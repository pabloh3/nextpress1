import type { Request, Response, NextFunction } from 'express';
import { models } from '../storage';

/**
 * Paths that are allowed even when system is not configured.
 * These are necessary for the setup wizard to function.
 */
const ALLOWED_PATHS = [
  '/api/setup',
  '/admin/assets',
  '/assets',
  '/_vite',
  '/setup',
];

/**
 * Middleware to enforce setup wizard completion before normal operation.
 * 
 * When the system has no sites configured (fresh install), this middleware:
 * - Allows access to setup-related paths (/api/setup, /setup, static assets)
 * - Returns 428 "Precondition Required" for other API requests
 * - Allows other requests through (frontend handles redirect)
 * 
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export async function setupCheck(req: Request, res: Response, next: NextFunction) {
  // Allow setup-related paths without checking
  const isAllowed = ALLOWED_PATHS.some(p => req.path.startsWith(p));
  if (isAllowed) {
    return next();
  }

  try {
    // Check if system is configured (at least one site exists)
    const sites = await models.sites.findMany();
    const isSetup = sites.length > 0;

    if (!isSetup) {
      // For API requests, return JSON error
      if (req.path.startsWith('/api')) {
        return res.status(428).json({
          error: 'Setup Required',
          message: 'Please complete the setup wizard',
          redirect: '/setup',
        });
      }
      // For other requests, let them through - frontend will handle redirect
    }

    next();
  } catch (error) {
    // If database check fails, allow request to proceed
    // This prevents blocking the app if there's a transient DB issue
    console.error('Setup check failed:', error);
    next();
  }
}
