import { Router } from 'express';
import type { Deps } from './shared/deps';
import { asyncHandler } from './shared/async-handler';
import { safeTryAsync } from '../utils';
import { coerceDates } from './shared/date-coerce';

/**
 * Creates Pages CRUD routes for the NextPress API.
 * Pages are a special type of post with type='page'.
 * 
 * Endpoints:
 * - GET /api/pages - List pages with pagination and status filter
 * - GET /api/pages/:id - Get single page by ID
 * - POST /api/pages - Create new page (requires auth)
 * - PUT /api/pages/:id - Update page (requires auth)
 * - DELETE /api/pages/:id - Delete page (requires auth)
 * 
 * @param deps - Injected dependencies (models, hooks, schemas, auth, etc.)
 * @returns Express router with mounted page routes
 */
export function createPagesRoutes(deps: Deps): Router {
  const router = Router();
  const { models, hooks, authService, requireAuth, CONFIG, parsePaginationParams, parseStatusParam, schemas } = deps;
  const pageSchemas = schemas.pages;

  /**
   * GET /api/pages - List pages with pagination and status filter
   */
  router.get(
    '/',
    asyncHandler(async (req, res) => {
      const { err, result } = await safeTryAsync(async () => {
        const { page, limit, offset } = parsePaginationParams(
          req.query,
          CONFIG.PAGINATION.DEFAULT_POSTS_PER_PAGE
        );
        const { status = CONFIG.STATUS.PUBLISH } = req.query;

        // Handle 'any' status to show all pages (for admin interface)
        const actualStatus = parseStatusParam(status as string);

        const pages = await models.pages.findMany({
          where: 'status',
          equals: actualStatus,
          limit,
          offset,
        });

        const total = await models.pages.count({
          where: actualStatus
            ? [{ where: 'status', equals: actualStatus }]
            : undefined,
        });

        return {
          pages,
          total,
          page,
          per_page: limit,
          total_pages: Math.ceil(total / limit),
        };
      });

      if (err) {
        console.error('Error fetching pages:', err);
        return res.status(500).json({ message: 'Failed to fetch pages' });
      }

      res.json(result);
    })
  );

  /**
   * GET /api/pages/:id - Get single page by ID or slug
   * Supports both UUID and slug for flexibility
   */
  router.get(
    '/:id',
    asyncHandler(async (req, res) => {
      try {
        const { id } = req.params;
        // Check if id is a UUID (format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
        
        const page = isUUID 
          ? await models.pages.findById(id)
          : await models.pages.findBySlug(id);
        
        if (!page) {
          return res.status(404).json({ message: 'Page not found' });
        }
        res.json(page);
      } catch (error) {
        console.error('Error fetching page:', error);
        res.status(500).json({ message: 'Failed to fetch page' });
      }
    })
  );

  /**
   * POST /api/pages - Create new page (requires authentication)
   */
  router.post(
    '/',
    requireAuth,
    asyncHandler(async (req: any, res) => {
      const { err, result } = await safeTryAsync(async () => {
        const userId = authService.getCurrentUserId(req);
        if (!userId) {
          throw new Error('User not authenticated');
        }

        // Include authorId in the data before validation
        const pageData = pageSchemas.insert.parse({
          ...req.body,
          authorId: userId,
        });

        // Generate slug if not provided
        if (!pageData.slug) {
          pageData.slug = pageData.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
        }

        const page = await models.pages.create(pageData);
        hooks.doAction('save_post', page);

        if (page.status === CONFIG.STATUS.PUBLISH) {
          hooks.doAction('publish_post', page);
        }

        return page;
      });

      if (err) {
        console.error('Error creating page:', err);
        return res.status(500).json({ message: 'Failed to create page' });
      }

      res.status(201).json(result);
    })
  );

  /**
   * PUT /api/pages/:id - Update existing page (requires authentication)
   */
  router.put(
    '/:id',
    requireAuth,
    asyncHandler(async (req, res) => {
      try {
        const id = req.params.id;
        const pageData = pageSchemas.update.parse(coerceDates(req.body, ['publishedAt']));

        const existingPage = await models.pages.findById(id);
        if (!existingPage) {
          return res.status(404).json({ message: 'Page not found' });
        }

        const wasPublished = existingPage.status === 'publish';
        const page = await models.pages.update(id, pageData);

        hooks.doAction('save_post', page);

        if (!wasPublished && page.status === 'publish') {
          hooks.doAction('publish_post', page);
        }

        res.json(page);
      } catch (error) {
        console.error('Error updating page:', error);
        res.status(500).json({ message: 'Failed to update page' });
      }
    })
  );

  /**
   * DELETE /api/pages/:id - Delete page (requires authentication)
   */
  router.delete(
    '/:id',
    requireAuth,
    asyncHandler(async (req, res) => {
      try {
        const id = req.params.id;
        const page = await models.pages.findById(id);

        if (!page) {
          return res.status(404).json({ message: 'Page not found' });
        }

        await models.pages.delete(id);
        hooks.doAction('delete_post', id);

        res.json({ message: 'Page deleted successfully' });
      } catch (error) {
        console.error('Error deleting page:', error);
        res.status(500).json({ message: 'Failed to delete page' });
      }
    })
  );

  return router;
}
