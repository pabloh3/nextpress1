import type { Request, Response, NextFunction } from 'express';

/**
 * Wraps async route handlers to properly catch and forward errors to Express error middleware.
 * Eliminates repetitive try/catch blocks in route handlers.
 * 
 * @param fn - Async route handler function
 * @returns Express middleware that catches promise rejections
 * 
 * @example
 * router.get('/users', asyncHandler(async (req, res) => {
 *   const users = await models.users.findMany();
 *   res.json(users);
 * }));
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) =>
    fn(req, res, next).catch(next);
}
