import { Router } from 'express';
import type { Deps } from './shared/deps';

/**
 * Creates options routes (WordPress-compatible settings API)
 * Handles key-value configuration storage
 */
export function createOptionsRoutes(deps: Deps) {
  const router = Router();
  const { models, requireAuth } = deps;

  /**
   * GET /api/options/:name
   * Get option value by name
   * Auth: Public (some options may be needed client-side)
   */
  router.get('/:name', async (req, res) => {
    try {
      const option = await models.options.getOption(req.params.name);
      if (!option) {
        return res.status(404).json({ message: 'Option not found' });
      }
      res.json(option);
    } catch (error) {
      console.error('Error fetching option:', error);
      res.status(500).json({ message: 'Failed to fetch option' });
    }
  });

  /**
   * POST /api/options
   * Set or update option value
   * Auth: Required
   */
  router.post('/', requireAuth, async (req, res) => {
    try {
      const { name, value } = req.body;
      const option = await models.options.setOption({ name, value });
      res.json(option);
    } catch (error) {
      console.error('Error setting option:', error);
      res.status(500).json({ message: 'Failed to set option' });
    }
  });

  return router;
}
