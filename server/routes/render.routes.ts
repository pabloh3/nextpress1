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

  /**
   * GET /sites/:siteId/:pageSlug - Retrieve page by site ID and page slug
   * Phase 1: Retrieves and logs blocks to console (rendering in Phase 2)
   */
  router.get(
    '/sites/:siteId/:pageSlug',
    asyncHandler(async (req, res) => {
      const { err, result } = await safeTryAsync(async () => {
        const { siteId, pageSlug } = req.params;

        // 1. Validate siteId format (should be UUID)
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(siteId);
        if (!isUUID) {
          res.status(400).json({ message: 'Invalid site ID format' });
          return;
        }

        // 2. Find site by ID
        const { err: siteErr, result: site } = await safeTryAsync(async () => {
          return await models.sites.findById(siteId);
        });

        if (siteErr) {
          console.error('Error finding site:', siteErr);
          res.status(500).json({ message: 'Error looking up site' });
          return;
        }

        if (!site) {
          console.error(`Site not found with ID: ${siteId}`);
          // Try to list all sites to help debug
          const { result: allSites } = await safeTryAsync(async () => {
            return await models.sites.findMany();
          });
          if (allSites && allSites.length > 0) {
            const sitesList = allSites.map((s: any) => `{id: ${s.id}, name: ${s.name || 'N/A'}}`).join(', ');
            console.log(`Available sites (${allSites.length}):`, sitesList);
            // Also try to get default site
            const { result: defaultSite } = await safeTryAsync(async () => {
              return await models.sites.findDefaultSite();
            });
            if (defaultSite) {
              console.log(`Default site ID: ${defaultSite.id}`);
            }
          } else {
            console.log('No sites found in database');
          }
          res.status(404).json({ 
            message: 'Site not found',
            requestedSiteId: siteId,
            hint: 'Check server logs for available site IDs'
          });
          return;
        }

        // 3. Find page by siteId and slug
        const page = await models.pages.findBySiteAndSlug(siteId, pageSlug);
        if (!page) {
          res.status(404).json({ message: 'Page not found' });
          return;
        }

        // 4. Only allow published pages for public access
        if (page.status !== 'publish') {
          res.status(404).json({ message: 'Page not found' });
          return;
        }

        // 5. Phase 1: Log blocks to console
        console.log('='.repeat(80));
        console.log(`Page: ${page.title} (${page.slug})`);
        console.log(`Site: ${site.name} (${site.id})`);
        console.log('='.repeat(80));
        console.log('Blocks:', JSON.stringify(page.blocks, null, 2));
        console.log('='.repeat(80));

        // 6. Return page metadata (rendering will be added in Phase 2)
        res.json({
          message: 'Page retrieved successfully (Phase 1: Blocks logged to console)',
          page: {
            id: page.id,
            title: page.title,
            slug: page.slug,
            siteId: page.siteId,
            blocksCount: Array.isArray(page.blocks) ? page.blocks.length : 0,
          },
        });
      });

      if (err) {
        console.error('Error retrieving page:', err);
        if (!res.headersSent) {
          res.status(500).json({ message: 'Failed to retrieve page' });
        }
      }
    })
  );

  return router;
}
