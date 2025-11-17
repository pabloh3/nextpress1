import { Router } from 'express';
import type { Deps } from './shared/deps';
import { asyncHandler } from './shared/async-handler';
import { safeTryAsync } from '../utils';

/**
 * Creates HTML rendering routes for posts, pages, and home.
 * These routes serve server-rendered HTML content using the active theme.
 * 
 * Endpoints:
 * - GET /posts/:id - Render single post by ID as HTML
 * - GET /pages/:id - Render single page by ID as HTML
 * - GET /home - Render homepage with recent published posts
 * 
 * All routes use themeManager to render content with the active theme.
 * Returns 404 page if content not found or rendering fails.
 * 
 * @param deps - Injected dependencies (models, themeManager, getSiteSettings)
 * @returns Express router with mounted render routes
 */
export function createRenderRoutes(deps: Deps): Router {
  const router = Router();
  const { models, themeManager, getSiteSettings } = deps;

  /**
   * GET /posts/:id - Render single post as HTML
   * Uses 'single-post' template from active theme
   */
  router.get(
    '/posts/:id',
    asyncHandler(async (req, res) => {
      const { err, result } = await safeTryAsync(async () => {
        const postId = req.params.id;
        const post = await models.posts.findById(postId);

        if (!post) {
          const html = themeManager.render404();
          return res.status(404).send(html);
        }

        // Get site settings for theme context
        const siteSettings = getSiteSettings(req);

        const html = await themeManager.renderContent('single-post', {
          post,
          site: siteSettings,
        });

        res.setHeader('Content-Type', 'text/html');
        res.send(html);
      });

      if (err) {
        console.error('Error rendering post:', err);
        const html = themeManager.render404();
        res.status(500).send(html);
      }
    })
  );

  /**
   * GET /pages/:id - Render single page as HTML
   * Uses 'page' template from active theme
   * Pages use same storage as posts
   */
  router.get(
    '/pages/:id',
    asyncHandler(async (req, res) => {
      const { err, result } = await safeTryAsync(async () => {
        const pageId = req.params.id;
        const page = await models.posts.findById(pageId); // Pages use same storage as posts

        if (!page) {
          const html = themeManager.render404();
          return res.status(404).send(html);
        }

        const siteSettings = getSiteSettings(req);

        const html = await themeManager.renderContent('page', {
          page,
          site: siteSettings,
        });

        res.setHeader('Content-Type', 'text/html');
        res.send(html);
      });

      if (err) {
        console.error('Error rendering page:', err);
        const html = themeManager.render404();
        res.status(500).send(html);
      }
    })
  );

  /**
   * GET /home - Render homepage with recent published posts
   * Uses 'home' template from active theme
   * Fetches up to 10 most recent published posts
   */
  router.get(
    '/home',
    asyncHandler(async (req, res) => {
      const { err, result } = await safeTryAsync(async () => {
        const posts = await models.posts.findMany({
          where: 'status',
          equals: 'publish',
          limit: 10,
        });

        const siteSettings = getSiteSettings(req);

        const html = await themeManager.renderContent('home', {
          posts: posts,
          site: siteSettings,
        });

        res.setHeader('Content-Type', 'text/html');
        res.send(html);
      });

      if (err) {
        console.error('Error rendering home:', err);
        const html = themeManager.render404();
        res.status(500).send(html);
      }
    })
  );

  return router;
}
