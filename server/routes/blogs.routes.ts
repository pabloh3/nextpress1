import { Router } from 'express';
import type { Deps } from './shared/deps';
import { asyncHandler } from './shared/async-handler';
import { safeTryAsync } from '../utils';
import { generateSlug } from './shared/slug';

/**
 * Creates Blog CRUD routes for the NextPress API.
 *
 * Endpoints:
 * - GET /api/blogs       — List blogs with pagination
 * - GET /api/blogs/:id   — Get single blog by ID
 * - POST /api/blogs      — Create new blog (requires auth)
 * - PUT /api/blogs/:id   — Update blog (requires auth)
 * - DELETE /api/blogs/:id — Delete blog (requires auth)
 *
 * @param deps - Injected dependencies (models, hooks, schemas, auth, etc.)
 * @returns Express router with mounted blog routes
 */
export function createBlogsRoutes(deps: Deps): Router {
  const router = Router();
  const { models, hooks, requireAuth, CONFIG, parsePaginationParams, parseStatusParam, schemas } = deps;
  const blogSchemas = schemas.blogs;

  /**
   * GET /api/blogs — List blogs with pagination and optional status filter.
   */
  router.get(
    '/',
    asyncHandler(async (req, res) => {
      const { err, result } = await safeTryAsync(async () => {
        const { page, limit, offset } = parsePaginationParams(req.query, 20);
        const { status } = req.query;

        const actualStatus = status ? parseStatusParam(status as string) : null;

        const blogs = await models.blogs.findMany({
          where: actualStatus ? 'status' : undefined,
          equals: actualStatus || undefined,
          limit,
          offset,
        });

        const total = await models.blogs.count({
          where: actualStatus
            ? [{ where: 'status', equals: actualStatus }]
            : undefined,
        });

        return {
          blogs,
          total,
          page,
          per_page: limit,
          total_pages: Math.ceil(total / limit),
        };
      });

      if (err) {
        console.error('Error fetching blogs:', err);
        return res.status(500).json({ message: 'Failed to fetch blogs' });
      }

      res.json(result);
    })
  );

  /**
   * GET /api/blogs/:id — Get a single blog by ID.
   */
  router.get(
    '/:id',
    asyncHandler(async (req, res) => {
      try {
        const blog = await models.blogs.findById(req.params.id);
        if (!blog) {
          return res.status(404).json({ message: 'Blog not found' });
        }
        res.json(blog);
      } catch (error) {
        console.error('Error fetching blog:', error);
        res.status(500).json({ message: 'Failed to fetch blog' });
      }
    })
  );

  /**
   * POST /api/blogs — Create a new blog (requires authentication).
   */
  router.post(
    '/',
    requireAuth,
    asyncHandler(async (req: any, res) => {
      const { err, result } = await safeTryAsync(async () => {
        const { authService } = deps;
        const userId = authService.getCurrentUserId(req);
        if (!userId) {
          throw new Error('User not authenticated');
        }

        const name = req.body.name;
        if (!name || typeof name !== 'string') {
          throw new Error('Blog name is required');
        }

        // Generate slug before validation so the required field is present
        const slugValue = req.body.slug
          ? String(req.body.slug)
          : generateSlug(String(name));

        const parsedData = blogSchemas.insert.parse({
          ...req.body,
          slug: slugValue,
          authorId: userId,
        });

        const blogData = {
          ...parsedData,
          name: String(parsedData.name),
          slug: String(parsedData.slug),
          authorId: String(parsedData.authorId),
        };

        const blog = await models.blogs.create(blogData);
        hooks.doAction('save_blog', blog);

        return blog;
      });

      if (err) {
        console.error('Error creating blog:', err);
        return res.status(500).json({ message: 'Failed to create blog' });
      }

      res.status(201).json(result);
    })
  );

  /**
   * PUT /api/blogs/:id — Update an existing blog (requires authentication).
   */
  router.put(
    '/:id',
    requireAuth,
    asyncHandler(async (req, res) => {
      try {
        const id = req.params.id;
        const blogData = blogSchemas.update.parse(req.body);

        const existing = await models.blogs.findById(id);
        if (!existing) {
          return res.status(404).json({ message: 'Blog not found' });
        }

        const blog = await models.blogs.update(id, blogData);
        hooks.doAction('save_blog', blog);

        res.json(blog);
      } catch (error) {
        console.error('Error updating blog:', error);
        res.status(500).json({ message: 'Failed to update blog' });
      }
    })
  );

  /**
   * DELETE /api/blogs/:id — Delete a blog (requires authentication).
   */
  router.delete(
    '/:id',
    requireAuth,
    asyncHandler(async (req, res) => {
      try {
        const id = req.params.id;
        const blog = await models.blogs.findById(id);

        if (!blog) {
          return res.status(404).json({ message: 'Blog not found' });
        }

        await models.blogs.delete(id);
        hooks.doAction('delete_blog', id);

        res.json({ message: 'Blog deleted successfully' });
      } catch (error) {
        console.error('Error deleting blog:', error);
        res.status(500).json({ message: 'Failed to delete blog' });
      }
    })
  );

  return router;
}
