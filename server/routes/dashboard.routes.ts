import { Router } from 'express';
import type { Deps } from './shared/deps';

/**
 * Creates dashboard routes
 * Provides aggregated statistics for admin dashboard
 */
export function createDashboardRoutes(deps: Deps) {
  const router = Router();
  const { models, requireAuth } = deps;

  /**
   * GET /api/dashboard/stats
   * Get dashboard statistics (posts, pages, comments, users counts)
   * Auth: Required
   */
  router.get('/stats', requireAuth, async (_req, res) => {
    try {
      const [postsCount, pagesCount, commentsCount, usersCount] =
        await Promise.all([
          models.posts.count({
            where: [
              { where: 'status', equals: 'publish' },
              // Removed type filter; update this if new schema provides a way to distinguish posts
            ],
          }),
          models.posts.count({
            where: [
              { where: 'status', equals: 'publish' },
              // Removed type filter; update this if new schema provides a way to distinguish pages
            ],
          }),
          models.comments.count({
            where: [{ where: 'status', equals: 'approved' }],
          }),
          1, // Simplified for now
        ]);

      res.json({
        posts: postsCount,
        pages: pagesCount,
        comments: commentsCount,
        users: usersCount,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      res.status(500).json({ message: 'Failed to fetch dashboard stats' });
    }
  });

  return router;
}
