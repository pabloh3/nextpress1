import { Router } from 'express';
import type { Deps } from './shared/deps';
import { asyncHandler } from './shared/async-handler';

/**
 * Creates comment routes with CRUD operations and status management.
 * Handles comment approval, spam marking, and fires WordPress-style hooks.
 * 
 * Endpoints:
 * - GET    /api/comments          - List comments with filters (post_id, status)
 * - POST   /api/comments          - Create new comment (fires new_comment hook)
 * - GET    /api/comments/:id      - Get single comment (auth required)
 * - PUT    /api/comments/:id      - Update comment (auth required, fires edit_comment hook)
 * - DELETE /api/comments/:id      - Delete comment (auth required, fires delete_comment hook)
 * - PATCH  /api/comments/:id/approve - Approve comment (auth required, fires approve_comment hook)
 * - PATCH  /api/comments/:id/spam    - Mark as spam (auth required, fires spam_comment hook)
 */
export function createCommentsRoutes(deps: Deps): Router {
  const router = Router();
  const { models, hooks, requireAuth, schemas } = deps;

  // GET /api/comments - List comments with pagination and filtering
  router.get(
    '/',
    asyncHandler(async (req, res) => {
      const {
        post_id,
        status = 'approved',
        page = 1,
        per_page = 10,
      } = req.query;
      const limit = parseInt(per_page as string);
      const offset = (parseInt(page as string) - 1) * limit;

      const filters = [
        ...(post_id ? [{ where: 'postId', equals: post_id }] : []),
        ...(status ? [{ where: 'status', equals: status }] : []),
      ];

      const comments = await models.comments.findManyWhere(filters, {
        limit,
        offset,
      });

      const total = await models.comments.count({
        where: filters,
      });

      res.json({
        comments,
        total,
        page: parseInt(page as string),
        per_page: limit,
        total_pages: Math.ceil(total / limit),
      });
    })
  );

  // POST /api/comments - Create new comment
  router.post(
    '/',
    asyncHandler(async (req, res) => {
      const parsedData = schemas.comments.insert.parse(req.body);
      // Ensure required fields are present
      if (!parsedData.postId || !parsedData.content) {
        return res.status(400).json({ message: 'postId and content are required' });
      }
      const commentData = {
        ...parsedData,
        postId: String(parsedData.postId),
        content: String(parsedData.content),
      } as any;
      const comment = await models.comments.create(commentData);
      hooks.doAction('new_comment', comment);
      res.status(201).json(comment);
    })
  );

  // GET /api/comments/:id - Get single comment (auth required)
  router.get(
    '/:id',
    requireAuth,
    asyncHandler(async (req, res) => {
      const id = req.params.id;
      const comment = await models.comments.findById(id);

      if (!comment) {
        return res.status(404).json({ message: 'Comment not found' });
      }

      res.json(comment);
    })
  );

  // PUT /api/comments/:id - Update comment (auth required)
  router.put(
    '/:id',
    requireAuth,
    asyncHandler(async (req, res) => {
      const id = req.params.id;
      const existingComment = await models.comments.findById(id);

      if (!existingComment) {
        return res.status(404).json({ message: 'Comment not found' });
      }

      const commentData = schemas.comments.update.parse(req.body);
      const updatedComment = await models.comments.update(id, commentData);

      hooks.doAction('edit_comment', updatedComment);
      res.json(updatedComment);
    })
  );

  // DELETE /api/comments/:id - Delete comment (auth required)
  router.delete(
    '/:id',
    requireAuth,
    asyncHandler(async (req, res) => {
      const id = req.params.id;
      const existingComment = await models.comments.findById(id);

      if (!existingComment) {
        return res.status(404).json({ message: 'Comment not found' });
      }

      await models.comments.delete(id);
      hooks.doAction('delete_comment', id);

      res.json({ message: 'Comment deleted successfully' });
    })
  );

  // PATCH /api/comments/:id/approve - Approve comment (auth required)
  router.patch(
    '/:id/approve',
    requireAuth,
    asyncHandler(async (req, res) => {
      const id = req.params.id;
      const comment = await models.comments.approve(id);
      hooks.doAction('approve_comment', comment);
      res.json(comment);
    })
  );

  // PATCH /api/comments/:id/spam - Mark comment as spam (auth required)
  router.patch(
    '/:id/spam',
    requireAuth,
    asyncHandler(async (req, res) => {
      const id = req.params.id;
      const comment = await models.comments.spam(id);
      hooks.doAction('spam_comment', comment);
      res.json(comment);
    })
  );

  return router;
}
