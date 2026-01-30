import { Router } from 'express';
import type { Deps } from './shared/deps';
import { asyncHandler } from './shared/async-handler';
import { promises as fs } from 'node:fs';

/**
 * Password validation: minimum 8 chars, 1 uppercase, 1 lowercase, 1 number
 */
function validatePassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }
  return { valid: true };
}

/**
 * Updates Caddyfile with new domain and attempts to reload Caddy.
 * Falls back gracefully if Caddy API is unavailable (config applies on restart).
 */
async function updateCaddyConfig(domain: string): Promise<{ success: boolean; message: string }> {
  const caddyfilePath = '/etc/caddy/Caddyfile';

  // Normalize domain (remove protocol if present)
  const cleanDomain = domain.replace(/^https?:\/\//, '');

  const caddyConfig = `{
  admin 0.0.0.0:2019
}

${cleanDomain} {
  reverse_proxy app:5000
}
`;

  try {
    await fs.writeFile(caddyfilePath, caddyConfig);

    // Try to reload Caddy via Admin API
    try {
      const response = await fetch('http://caddy:2019/load', {
        method: 'POST',
        headers: { 'Content-Type': 'text/caddyfile' },
        body: caddyConfig,
      });

      if (response.ok) {
        return { success: true, message: 'Caddy configuration updated and reloaded' };
      }
      return { success: true, message: 'Caddy configuration saved, will apply on restart' };
    } catch {
      // Fallback: Caddy will pick up changes on container restart
      return { success: true, message: 'Caddy configuration saved, will apply on restart' };
    }
  } catch (err) {
    // In non-Docker environments, skip Caddyfile updates
    console.log('Caddyfile update skipped (not in Docker environment or no write access)');
    return { success: true, message: 'Skipped Caddy update (non-Docker environment)' };
  }
}

/**
 * Creates setup routes for initial system configuration.
 * 
 * Routes:
 * - GET /api/setup/status - Check if system is configured
 * - POST /api/setup - Complete initial setup (create admin + site)
 * 
 * @param deps - Injected dependencies (models, schemas)
 * @returns Express router with setup routes
 */
export function createSetupRoutes(deps: Deps): Router {
  const router = Router();

  /**
   * GET /api/setup/status
   * Returns whether the system has been configured (has at least one site)
   */
  router.get('/status', asyncHandler(async (_req, res) => {
    const sites = await deps.models.sites.findMany();
    res.json({ isSetup: sites.length > 0 });
  }));

  /**
   * POST /api/setup
   * Initial system setup - creates admin user and default site.
   * Also updates Caddy configuration with the provided domain.
   */
  router.post('/', asyncHandler(async (req, res) => {
    const { email, password, username, siteName, domain } = req.body;

    // Validate required fields
    if (!email || !password || !siteName || !domain) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Please provide email, password, siteName, and domain',
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Invalid email',
        message: 'Please provide a valid email address',
      });
    }

    // Validate password
    const passwordCheck = validatePassword(password);
    if (!passwordCheck.valid) {
      return res.status(400).json({
        error: 'Invalid password',
        message: passwordCheck.message,
      });
    }

    // Check if already setup
    const existingSites = await deps.models.sites.findMany();
    if (existingSites.length > 0) {
      return res.status(400).json({
        error: 'Already configured',
        message: 'System has already been configured',
      });
    }

    // Generate username from email if not provided
    const finalUsername = username || email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_');

    // Check if username already exists
    const existingUser = await deps.models.users.findByUsername(finalUsername);
    if (existingUser) {
      return res.status(400).json({
        error: 'Username taken',
        message: 'Please choose a different username',
      });
    }

    // Check if email already exists
    const existingEmail = await deps.models.users.findByEmail(email);
    if (existingEmail) {
      return res.status(400).json({
        error: 'Email taken',
        message: 'An account with this email already exists',
      });
    }

    // Hash password
    const bcrypt = await import('bcrypt');
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin user
    const adminUser = await deps.models.users.create({
      email,
      username: finalUsername,
      password: hashedPassword,
      firstName: 'Admin',
      status: 'active',
    });

    // Get admin role
    const adminRole = await deps.models.roles.findByName('admin');

    // Normalize domain for siteUrl
    const siteUrl = domain.startsWith('http') ? domain : `https://${domain}`;

    // Create site
    const site = await deps.models.sites.create({
      name: siteName,
      description: `${siteName} - Powered by NextPress`,
      siteUrl,
      ownerId: adminUser.id,
      settings: {
        general: {
          siteName,
          siteUrl: domain,
        },
      },
    });

    // Assign admin role to user for this site
    if (adminRole) {
      await deps.models.userRoles.assignRole(
        adminUser.id,
        adminRole.id,
        site.id
      );
    }

    // Update Caddyfile
    const caddyResult = await updateCaddyConfig(domain);
    console.log('Caddy update:', caddyResult.message);

    res.json({
      success: true,
      message: 'Setup complete! You can now log in.',
      redirect: '/login',
      caddyStatus: caddyResult.message,
    });
  }));

  return router;
}
