import "dotenv/config";
import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { models } from "./storage";

// Check if Replit Auth is configured
const isReplitAuthConfigured =
	process.env.REPLIT_DOMAINS && process.env.REPL_ID;

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
			process.env.REPL_ID!,
		);
	},
	{ maxAge: 3600 * 1000 },
);

export function getSession() {
	const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
	const isProduction = process.env.NODE_ENV === "production";

	// Dev uses in-memory sessions (no PG needed), prod uses connect-pg-simple
	const store = isProduction
		? new (connectPg(session))({
				conString: process.env.DATABASE_URL,
				createTableIfMissing: false,
				ttl: sessionTtl,
				tableName: "sessions",
			})
		: undefined; // express-session defaults to MemoryStore

	if (!isProduction) {
		console.log("[Session] Using MemoryStore for development");
	}

	return session({
		secret: process.env.SESSION_SECRET || "dev-secret-change-in-production",
		...(store ? { store } : {}),
		resave: false,
		saveUninitialized: false,
		cookie: {
			httpOnly: true,
			secure: isProduction ? "auto" as const : false,
			sameSite: "lax",
			maxAge: sessionTtl,
		},
	});
}

function updateUserSession(
	user: any,
	tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
) {
	user.claims = tokens.claims();
	user.access_token = tokens.access_token;
	user.refresh_token = tokens.refresh_token;
	user.expires_at = user.claims?.exp;
}

async function upsertUser(claims: any) {
	// Generate username from email or use fallback
	const email = claims["email"];
	let username = email ? email.split("@")[0] : `user_${claims["sub"]}`;

	// Sanitize username to remove special characters
	username = username.replace(/[^a-zA-Z0-9_]/g, "_").toLowerCase();

	// Ensure username is unique by checking if it exists
	const existingUser = await models.users.findByUsername(username);
	if (existingUser && existingUser.id !== claims["sub"]) {
		// Append user ID to make it unique
		username = `${username}_${claims["sub"]}`;
	}

	// Upsert user atomically
	await models.users.upsert({
		id: claims["sub"],
		email: claims["email"],
		firstName: claims["first_name"],
		lastName: claims["last_name"],
		profileImageUrl: claims["profile_image_url"],
		username: username,
		status: "active",
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
			tokens: client.TokenEndpointResponse &
				client.TokenEndpointResponseHelpers,
			verified: passport.AuthenticateCallback,
		) => {
			const user = {};
			updateUserSession(user, tokens);
			await upsertUser(tokens.claims());
			verified(null, user);
		};

		for (const domain of process.env.REPLIT_DOMAINS!.split(",")) {
			const strategy = new Strategy(
				{
					name: `replitauth:${domain}`,
					config,
					scope: "openid email profile offline_access",
					callbackURL: `https://${domain}/api/callback`,
				},
				verify,
			) as any;
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
					}).href,
				);
			});
		});
	} catch (error) {
		console.error("Failed to setup Replit Auth:", error);
		console.log("Continuing with local authentication only");
	}
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
	// Check for local session first
	if ((req as any).session?.localUser) {
		// Set req.user for local authentication to match the expected structure
		(req as any).user = {
			claims: {
				sub: (req as any).session.localUser.id,
			},
		};
		return next();
	}

	// Check for Replit auth
	const user = req.user as any;
	if (!req.isAuthenticated() || !user?.expires_at) {
		return res.status(401).json({ message: "Unauthorized" });
	}

	const now = Math.floor(Date.now() / 1000);
	if (now <= user.expires_at) {
		return next();
	}

	const refreshToken = user.refresh_token;
	if (!refreshToken) {
		res.status(401).json({ message: "Unauthorized" });
		return;
	}

	try {
		const config = await getOidcConfig();
		const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
		updateUserSession(user, tokenResponse);
		return next();
	} catch (error) {
		res.status(401).json({ message: "Unauthorized" });
		return;
	}
};
