import { Router } from 'express';
import type { Deps } from './shared/deps';
import { asyncHandler } from './shared/async-handler';
import { safeTryAsync } from '../utils';

/**
 * Creates public API routes for accessing published content without authentication.
 * 
 * Endpoints:
 * - GET /api/public/page/:slug - Get published page by slug
 * - GET /api/public/post/:slug - Get published post by slug
 * - GET /api/public/homepage - Get homepage content
 * 
 * All endpoints only return content with status 'publish', ensuring
 * draft and private content remains inaccessible.
 * 
 * @param deps - Injected dependencies (models)
 * @returns Express router with mounted public routes
 */
export function createPublicRoutes(deps: Deps): Router {
  const router = Router();
  const { models } = deps;

  /**
   * GET /api/public/page/:slug - Get published page by slug
   * Only returns pages with status 'publish'
   */
  router.get(
    '/page/:slug',
    asyncHandler(async (req, res) => {
      const { err, result } = await safeTryAsync(async () => {
        const page = await models.posts.findBySlug(req.params.slug);
        if (!page) {
          return res.status(404).json({ message: 'Page not found' });
        }

        // Only allow access to published pages
        if (page.status !== 'publish') {
          return res.status(404).json({ message: 'Page not found' });
        }

        res.json(page);
      });

      if (err) {
        console.error('Error fetching published page:', err);
        res.status(500).json({ message: 'Failed to fetch page' });
      }
    })
  );

  /**
   * GET /api/public/post/:slug - Get published post by slug
   * Only returns posts with status 'publish'
   */
  router.get(
    '/post/:slug',
    asyncHandler(async (req, res) => {
      const { err, result } = await safeTryAsync(async () => {
        const post = await models.posts.findBySlug(req.params.slug);
        if (!post) {
          return res.status(404).json({ message: 'Post not found' });
        }

        // Only allow access to published posts
        if (post.status !== 'publish') {
          return res.status(404).json({ message: 'Post not found' });
        }

        res.json(post);
      });

      if (err) {
        console.error('Error fetching published post:', err);
        res.status(500).json({ message: 'Failed to fetch post' });
      }
    })
  );

  /**
   * GET /api/public/homepage - Get homepage content
   * Returns a published page marked as homepage or the first published page.
   * Checks for 'homepage_page_slug' option first, then falls back to first published page.
   */
  router.get(
    '/homepage',
    asyncHandler(async (_req, res) => {
      const { err, result } = await safeTryAsync(async () => {
        // First try to get a page specifically marked as homepage (we'll add this option later)
        const homepage = await models.options.getOption('homepage_page_slug');
        let page: any;

        if (homepage && homepage.value) {
          page = await models.posts.findBySlug(homepage.value);
        }

        // If no specific homepage set, try to get the first published page
        if (!page) {
          page = await models.posts.findFirst([
            { where: 'status', equals: 'publish' },
          ]);
        }

        if (!page) {
          return res.status(404).json({ message: 'No homepage content found' });
        }

        res.json(page);
      });

      if (err) {
        console.error('Error fetching homepage:', err);
        res.status(500).json({ message: 'Failed to fetch homepage' });
      }
    })
  );

  return router;
}
