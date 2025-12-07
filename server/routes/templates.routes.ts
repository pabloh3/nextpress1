import { Router } from 'express';
import type { Deps } from './shared/deps';
import { asyncHandler } from './shared/async-handler';
import { safeTryAsync } from '../utils';

/**
 * Creates template routes for template management.
 * Templates are reusable page/post layouts stored with blocks configuration.
 * 
 * Endpoints:
 * - GET    /api/templates          - List templates with pagination and type filter
 * - GET    /api/templates/:id      - Get single template (auth required)
 * - POST   /api/templates          - Create template (auth required, injects authorId)
 * - POST   /api/templates/:id/duplicate - Duplicate template (auth required)
 * - PUT    /api/templates/:id      - Update template (auth required)
 * - DELETE /api/templates/:id      - Delete template (auth required)
 */
export function createTemplatesRoutes(deps: Deps): Router {
  const router = Router();
  const { models, requireAuth, authService, schemas } = deps;

  // GET /api/templates - List templates with pagination and optional type filter
  router.get(
    '/',
    requireAuth,
    asyncHandler(async (req, res) => {
      const { type, page = 1, per_page = 10 } = req.query;
      const limit = parseInt(per_page as string);
      const offset = (parseInt(page as string) - 1) * limit;

      // Build query conditionally based on whether type filter is provided
      const findManyOptions: any = {
        limit,
        offset,
      };

      if (type) {
        findManyOptions.where = 'type';
        findManyOptions.equals = type as string;
      }

      const templates = await models.templates.findMany(findManyOptions);

      // Build count query conditionally
      const countOptions: any = {};
      if (type) {
        countOptions.where = [{ where: 'type', equals: type as string }];
      }

      const total = await models.templates.count(countOptions);

      res.json({
        templates,
        total,
        page: parseInt(page as string),
        per_page: limit,
        total_pages: Math.ceil(total / limit),
      });
    })
  );

  // GET /api/templates/:id - Get single template (auth required)
  router.get(
    '/:id',
    requireAuth,
    asyncHandler(async (req, res) => {
      const template = await models.templates.findById(req.params.id);
      if (!template) {
        return res.status(404).json({ message: 'Template not found' });
      }
      res.json(template);
    })
  );

  // POST /api/templates - Create new template (auth required, injects authorId)
  router.post(
    '/',
    requireAuth,
    asyncHandler(async (req: any, res) => {
      const { err, result } = await safeTryAsync(async () => {
        const userId = authService.getCurrentUserId(req);
        if (!userId) {
          throw new Error('User not authenticated');
        }

        const parsedData = schemas.templates.insert.parse({
          ...req.body,
          authorId: userId,
        });

        // Ensure required fields are present and properly typed
        if (!parsedData.name || !parsedData.type) {
          throw new Error('name and type are required');
        }

        const templateData = {
          name: String(parsedData.name),
          authorId: String(parsedData.authorId),
          type: String(parsedData.type),
          ...(parsedData.description && { description: String(parsedData.description) }),
          ...(parsedData.blocks && { blocks: parsedData.blocks }),
          ...(parsedData.settings && { settings: parsedData.settings }),
        };

        const template = await models.templates.create(templateData);
        return template;
      });

      if (err) {
        console.error('Error creating template:', err);
        return res.status(500).json({ message: 'Failed to create template' });
      }

      res.status(201).json(result);
    })
  );

  // POST /api/templates/:id/duplicate - Duplicate existing template (auth required)
  router.post(
    '/:id/duplicate',
    requireAuth,
    asyncHandler(async (req, res) => {
      const { name } = req.body;
      if (!name) {
        return res.status(400).json({ message: 'Template name is required' });
      }

      const template = await models.templates.duplicate(req.params.id, name);
      res.status(201).json(template);
    })
  );

  // PUT /api/templates/:id - Update template (auth required)
  router.put(
    '/:id',
    requireAuth,
    asyncHandler(async (req, res) => {
      const id = req.params.id;
      const templateData = schemas.templates.update.parse(req.body);

      const template = await models.templates.update(id, templateData);
      res.json(template);
    })
  );

  // DELETE /api/templates/:id - Delete template (auth required)
  router.delete(
    '/:id',
    requireAuth,
    asyncHandler(async (req, res) => {
      const id = req.params.id;
      await models.templates.delete(id);
      res.json({ message: 'Template deleted successfully' });
    })
  );

  return router;
}
