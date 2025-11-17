import { Router } from 'express';
import type { Deps } from './shared/deps';
import { asyncHandler } from './shared/async-handler';

/**
 * Creates authentication routes for local login, registration, and session management.
 * Handles both username/email login and new user registration with role assignment.
 * 
 * Routes:
 * - POST /login - Authenticate with username/email and password
 * - POST /register - Create new user account
 * - POST /logout - Destroy user session
 * - GET /user - Get current authenticated user
 * 
 * @param deps - Injected dependencies (models, schemas, authService)
 * @returns Express router with mounted auth routes
 */
export function createAuthRoutes(deps: Deps): Router {
  const router = Router();

  /**
   * POST /login
   * Authenticates user with username/email and password.
   * Creates session on successful authentication.
   */
  router.post('/login', asyncHandler(async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ message: 'Username and password are required' });
    }

    console.log('Login attempt for:', username);

    // Try to find user by username or email
    let user = await deps.models.users.findByUsername(username);
    if (!user) {
      user = await deps.models.users.findByEmail(username);
    }

    if (!user) {
      console.log('User not found for:', username);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!user.password) {
      console.log('User has no password set:', username);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    console.log('Found user, checking password...');
    const bcrypt = await import('bcrypt');
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      console.log('Password does not match for user:', username);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (user.status !== 'active') {
      console.log('User account is not active:', username);
      return res.status(401).json({ message: 'Account is not active' });
    }

    console.log('Login successful for user:', username);

    // Create session for local user
    (req as any).session.localUser = {
      id: user.id,
      username: user.username,
      email: user.email,
    };

    const { password: _, ...userResponse } = user;
    res.json(userResponse);
  }));

  /**
   * POST /register
   * Creates new user account with hashed password.
   * Assigns default subscriber role and creates session.
   */
  router.post('/register', asyncHandler(async (req, res) => {
    const userData: any = deps.schemas.users.insert.parse(req.body);

    // Check if username or email already exists
    const existingUser = await deps.models.users.findByUsername(userData.username);
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    const existingEmail = await deps.models.users.findByEmail(userData.email);
    if (existingEmail) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    // Hash password
    const bcrypt = await import('bcrypt');
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    userData.password = hashedPassword;
    console.log('Password hashed for new user:', userData.username);

    const user = await deps.models.users.create(userData);

    // Assign default role to new user
    try {
      // Get the default site
      const defaultSite = await deps.models.sites.findDefaultSite();
      if (!defaultSite) {
        console.error('No default site found for role assignment');
      } else {
        // Get subscriber role
        const subscriberRole = await deps.models.roles.findByName('subscriber');
        if (subscriberRole) {
          await deps.models.userRoles.assignRole(
            user.id,
            subscriberRole.id,
            defaultSite.id
          );
          console.log(`Assigned subscriber role to user: ${user.username}`);
        } else {
          console.error('Subscriber role not found');
        }
      }
    } catch (roleError) {
      console.error('Error assigning role to new user:', roleError);
      // Don't fail registration if role assignment fails
    }

    // Create session for new user
    (req as any).session.localUser = {
      id: user.id,
      username: user.username,
      email: user.email,
    };

    const { password: _password, ...userResponse } = user;
    res.status(201).json(userResponse);
  }));

  /**
   * POST /logout
   * Destroys user session
   */
  router.post('/logout', (req, res) => {
    (req as any).session.destroy((err: any) => {
      if (err) {
        return res.status(500).json({ message: 'Logout failed' });
      }
      res.json({ message: 'Logged out successfully' });
    });
  });

  /**
   * GET /user
   * Returns current authenticated user from session or Replit auth.
   * Uses unified auth service to check both auth methods.
   */
  router.get('/user', asyncHandler(async (req: any, res) => {
    const user = await deps.authService.getCurrentUser(req);

    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    res.json(user);
  }));

  return router;
}
