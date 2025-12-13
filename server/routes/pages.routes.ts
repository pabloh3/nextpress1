import { Router } from 'express';
import type { Deps } from './shared/deps';
import { asyncHandler } from './shared/async-handler';
import { safeTryAsync } from '../utils';
import { coerceDates } from './shared/date-coerce';

/**
 * Validates that a slug is unique within a site (application-level check)
 * Complements database unique constraint for better error messages
 * @param models - Models dependency
 * @param siteId - The site ID to check uniqueness within
 * @param slug - The slug to validate
 * @param excludePageId - Optional page ID to exclude from check (for updates)
 * @returns true if unique, throws error if not
 */
async function validateSlugUniqueness(
	models: any,
	siteId: string,
	slug: string,
	excludePageId?: string
) {
	const existingPage = await models.pages.findBySiteAndSlug(siteId, slug);
	
	if (existingPage) {
		// If updating, exclude the current page
		if (excludePageId && existingPage.id === excludePageId) {
			return true;
		}
		throw new Error(`Slug "${slug}" already exists for this site`);
	}
	
	return true;
}

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

        // Get siteId from request or use default site (before validation)
        let siteId = req.body?.siteId;
        if (!siteId) {
          const defaultSite = await models.sites.findDefaultSite();
          if (!defaultSite || !defaultSite.id) {
            throw new Error('No site found. Please create a site first.');
          }
          siteId = String(defaultSite.id);
        } else {
          siteId = String(siteId);
        }

        // Prepare data object with required fields before validation
        const dataToValidate = {
          ...req.body,
          authorId: userId,
          siteId: siteId,
        };

        // Include authorId and siteId in the data before validation
        const parsedData = pageSchemas.insert.parse(dataToValidate) as any;

        // Generate slug if not provided
        const title = parsedData.title;
        if (!title || typeof title !== 'string') {
          throw new Error('Title is required and must be a string');
        }

        const pageData = {
          ...parsedData,
          title: String(title),
          slug: parsedData.slug || title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, ''),
        };

        // Validate slug uniqueness per site
        await validateSlugUniqueness(models, siteId, pageData.slug);

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
        const parsed = pageSchemas.update.parse(coerceDates(req.body, ['publishedAt'])) as any;

        const existingPage = await models.pages.findById(id);
        if (!existingPage) {
          return res.status(404).json({ message: 'Page not found' });
        }

        const previousSnapshot = {
          version: existingPage.version ?? 0,
          updatedAt: existingPage.updatedAt
            ? new Date(existingPage.updatedAt as any).toISOString()
            : new Date().toISOString(),
          blocks: existingPage.blocks ?? [],
          authorId: (existingPage as any).authorId,
        };

        const existingHistory = Array.isArray(existingPage.history) ? existingPage.history : [];
        
        // Determine siteId and slug for validation
        const siteId = parsed.siteId || existingPage.siteId;
        const slug = parsed.slug || existingPage.slug;

        // Validate slug uniqueness per site (only if slug changed)
        if (parsed.slug && parsed.slug !== existingPage.slug) {
          await validateSlugUniqueness(models, siteId, slug, id);
        }

        const pageData = {
          ...parsed,
          version: (existingPage.version ?? 0) + 1,
          history: [previousSnapshot, ...existingHistory], // append previous snapshot to existing history
        };

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
