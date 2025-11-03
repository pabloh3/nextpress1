import type { Request } from "express";
import { models } from "./storage";

/**
 * Authentication service interface for unified auth handling
 */
export interface AuthService {
	/**
	 * Get the current authenticated user from request
	 * @param req - Express request object
	 * @returns User object or null if not authenticated
	 */
	getCurrentUser(req: Request): Promise<any | null>;

	/**
	 * Check if the request is authenticated
	 * @param req - Express request object
	 * @returns True if authenticated, false otherwise
	 */
	isAuthenticated(req: Request): boolean;

	/**
	 * Get the current user ID from request
	 * @param req - Express request object
	 * @returns User ID or null if not authenticated
	 */
	getCurrentUserId(req: Request): string | null;
}

/**
 * Unified authentication service implementation
 * Handles both local session auth and Replit auth
 */
export class UnifiedAuthService implements AuthService {
	/**
	 * Get the current authenticated user from request
	 * Checks both local session and Replit authentication
	 */
	async getCurrentUser(req: Request): Promise<any | null> {
		try {
			// Check for local session first
			if ((req as any).session?.localUser) {
				const user = await models.users.findById(
					(req as any).session.localUser.id,
				);
				if (user) {
					const { password: _password, ...userResponse } = user;
					return userResponse;
				}
			}

			// Check for Replit auth
			if (
				(req as any).isAuthenticated &&
				(req as any).isAuthenticated() &&
				(req as any).user?.claims?.sub
			) {
				const userId = (req as any).user.claims.sub;
				const user = await models.users.findById(userId);
				if (user) {
					return user;
				}
			}

			return null;
		} catch (error) {
			console.error("Error getting current user:", error);
			return null;
		}
	}

	/**
	 * Check if the request is authenticated
	 * Returns true if either local session or Replit auth is valid
	 */
	isAuthenticated(req: Request): boolean {
		// Check local session
		if ((req as any).session?.localUser) {
			return true;
		}

		// Check Replit auth
		if (
			(req as any).isAuthenticated &&
			(req as any).isAuthenticated() &&
			(req as any).user?.claims?.sub
		) {
			return true;
		}

		return false;
	}

	/**
	 * Get the current user ID from request
	 * Returns user ID from either auth method
	 */
	getCurrentUserId(req: Request): string | null {
		// Check local session first
		if ((req as any).session?.localUser) {
			return (req as any).session.localUser.id;
		}

		// Check Replit auth
		if (
			(req as any).isAuthenticated &&
			(req as any).isAuthenticated() &&
			(req as any).user?.claims?.sub
		) {
			return (req as any).user.claims.sub;
		}

		return null;
	}
}

// Export singleton instance
export const authService = new UnifiedAuthService();

/**
 * Middleware to check authentication using unified auth service
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export function requireAuth(req: Request, res: any, next: any) {
	if (!authService.isAuthenticated(req)) {
		return res.status(401).json({ message: "Unauthorized" });
	}
	next();
}

/**
 * Get current user middleware - adds user to request object
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export async function getCurrentUser(req: Request, res: any, next: any) {
	try {
		const user = await authService.getCurrentUser(req);
		if (user) {
			(req as any).currentUser = user;
		}
		next();
	} catch (error) {
		console.error("Error in getCurrentUser middleware:", error);
		next();
	}
}
