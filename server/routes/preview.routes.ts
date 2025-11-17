import { Router } from 'express';
import type { Deps } from './shared/deps';
import { asyncHandler } from './shared/async-handler';
import { safeTryAsync } from '../utils';

/**
 * Creates preview routes for NextPress content.
 * 
 * Endpoints:
 * - GET /api/preview/post/:id - Preview a post by ID (published or preview status)
 * - GET /api/preview/page/:id - Preview a page by ID (published or preview status)
 * - GET /api/preview/template/:id - Preview a template by ID (all templates available)
 * 
 * These routes allow previewing content without requiring authentication,
 * but only content with status 'publish' or 'preview' is accessible.
 * 
 * @param deps - Injected dependencies (models)
 * @returns Express router with mounted preview routes
 */
export function createPreviewRoutes(deps: Deps): Router {
  const router = Router();
  const { models } = deps;

  /**
   * GET /api/preview/post/:id - Preview a post by ID
   * Only allows preview of posts with status 'publish' or 'preview'
   */
  router.get(
    '/post/:id',
    asyncHandler(async (req, res) => {
      const { err, result } = await safeTryAsync(async () => {
        const post = await models.posts.findById(req.params.id);
        if (!post) {
          return res.status(404).json({ message: 'Post not found' });
        }

        // Only allow preview of published posts or posts with status 'preview'
        if (post.status !== 'publish' && post.status !== 'preview') {
          return res
            .status(404)
            .json({ message: 'Post not available for preview' });
        }

        res.json(post);
      });

      if (err) {
        console.error('Error fetching post preview:', err);
        res.status(500).json({ message: 'Failed to fetch post preview' });
      }
    })
  );

  /**
   * GET /api/preview/page/:id - Preview a page by ID
   * Only allows preview of pages with status 'publish' or 'preview'
   */
  router.get(
    '/page/:id',
    asyncHandler(async (req, res) => {
      const { err, result } = await safeTryAsync(async () => {
        const page = await models.posts.findById(req.params.id);
        if (!page) {
          return res.status(404).json({ message: 'Page not found' });
        }

        // Only allow preview of published pages or pages with status 'preview'
        if (page.status !== 'publish' && page.status !== 'preview') {
          return res
            .status(404)
            .json({ message: 'Page not available for preview' });
        }

        res.json(page);
      });

      if (err) {
        console.error('Error fetching page preview:', err);
        res.status(500).json({ message: 'Failed to fetch page preview' });
      }
    })
  );

  /**
   * GET /api/preview/template/:id - Preview a template by ID
   * Template preview is available for all templates
   */
  router.get(
    '/template/:id',
    asyncHandler(async (req, res) => {
      const { err, result } = await safeTryAsync(async () => {
        const template = await models.templates.findById(req.params.id);
        if (!template) {
          return res.status(404).json({ message: 'Template not found' });
        }

        // Template preview is available for all templates

        res.json(template);
      });

      if (err) {
        console.error('Error fetching template preview:', err);
        res.status(500).json({ message: 'Failed to fetch template preview' });
      }
    })
  );

  return router;
}
