import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

// Check if Replit Auth is configured
const isReplitAuthConfigured = process.env.REPLIT_DOMAINS && process.env.REPL_ID;

if (!isReplitAuthConfigured) {
  console.log("Replit Auth not configured - running in local development mode");
}

const getOidcConfig = memoize(
  async () => {
    if (!isReplitAuthConfigured) {
      throw new Error("Replit Auth not configured");
    }
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(
  claims: any,
) {
  // Generate username from email or use fallback
  const email = claims["email"];
  let username = email ? email.split('@')[0] : `user_${claims["sub"]}`;
  
  // Sanitize username to remove special characters
  username = username.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
  
  // Ensure username is unique by checking if it exists
  const existingUser = await storage.getUserByUsername(username);
  if (existingUser && existingUser.id !== claims["sub"]) {
    // Append user ID to make it unique
    username = `${username}_${claims["sub"]}`;
  }

  await storage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
    username: username,
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Only setup Replit Auth if configured
  if (!isReplitAuthConfigured) {
    console.log("Skipping Replit Auth setup - using local authentication only");
    return;
  }

  try {
    const config = await getOidcConfig();

    const verify: VerifyFunction = async (
      tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
      verified: passport.AuthenticateCallback
    ) => {
      const user = {};
      updateUserSession(user, tokens);
      await upsertUser(tokens.claims());
      verified(null, user);
    };

    for (const domain of process.env
      .REPLIT_DOMAINS!.split(",")) {
      const strategy = new Strategy(
        {
          name: `replitauth:${domain}`,
          config,
          scope: "openid email profile offline_access",
          callbackURL: `https://${domain}/api/callback`,
        },
        verify,
      );
      passport.use(strategy);
    }

    passport.serializeUser((user: Express.User, cb) => cb(null, user));
    passport.deserializeUser((user: Express.User, cb) => cb(null, user));

    app.get("/api/login", (req, res, next) => {
      passport.authenticate(`replitauth:${req.hostname}`, {
        prompt: "login consent",
        scope: ["openid", "email", "profile", "offline_access"],
      })(req, res, next);
    });

    app.get("/api/callback", (req, res, next) => {
      passport.authenticate(`replitauth:${req.hostname}`, {
        successReturnToOrRedirect: "/",
        failureRedirect: "/api/login",
      })(req, res, next);
    });

    app.get("/api/logout", (req, res) => {
      req.logout(() => {
        res.redirect(
          client.buildEndSessionUrl(config, {
            client_id: process.env.REPL_ID!,
            post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
          }).href
        );
      });
    });
  } catch (error) {
    console.error("Failed to setup Replit Auth:", error);
    console.log("Continuing with local authentication only");
  }
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  console.log('=== isAuthenticated middleware START ===');
  console.log('Request URL:', req.url);
  console.log('Request method:', req.method);
  console.log('Session exists:', !!req.session);
  console.log('Session data:', req.session);
  console.log('LocalUser exists:', !!(req as any).session?.localUser);
  console.log('LocalUser data:', (req as any).session?.localUser);
  console.log('Req.user exists:', !!req.user);
  console.log('Req.user data:', req.user);
  console.log('Is authenticated function exists:', !!req.isAuthenticated);
  console.log('Is authenticated result:', req.isAuthenticated ? req.isAuthenticated() : 'function not available');
  
  // Check for local session first
  if ((req as any).session?.localUser) {
    console.log('Using local authentication');
    // Set req.user for local authentication to match the expected structure
    (req as any).user = {
      claims: {
        sub: (req as any).session.localUser.id
      }
    };
    console.log('Req.user after setting:', req.user);
    console.log('=== isAuthenticated middleware END (local auth) ===');
    return next();
  }

  // Check for Replit auth
  const user = req.user as any;
  console.log('Checking Replit auth, user:', user);
  if (!req.isAuthenticated() || !user?.expires_at) {
    console.log('Replit auth failed - not authenticated or no expires_at');
    console.log('=== isAuthenticated middleware END (Replit auth failed) ===');
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    console.log('Replit auth successful');
    console.log('=== isAuthenticated middleware END (Replit auth success) ===');
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    console.log('No refresh token available');
    console.log('=== isAuthenticated middleware END (no refresh token) ===');
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    console.log('=== isAuthenticated middleware END (token refreshed) ===');
    return next();
  } catch (error) {
    console.log('Token refresh failed:', error);
    console.log('=== isAuthenticated middleware END (token refresh failed) ===');
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};
