import { Router } from 'express';
import type { Deps } from './shared/deps';
import { asyncHandler } from './shared/async-handler';
import { safeTryAsync } from '../utils';
import { z } from 'zod';

/**
 * Site information routes for managing site-level fields
 * 
 * Endpoints:
 * - GET /api/site - Get site information (logo, favicon, theme)
 * - PATCH /api/site - Update site information
 * 
 * These handle direct columns in the sites table:
 * - logoUrl, faviconUrl, activeThemeId
 * 
 * For settings (JSONB), use /api/settings instead.
 */

const siteInfoSchema = z.object({
  logoUrl: z.string().nullable().optional(),
  faviconUrl: z.string().nullable().optional(),
  activeThemeId: z.string().uuid().nullable().optional(),
});

export function createSiteRoutes(deps: Deps): Router {
  const router = Router();
  const { models, requireAuth } = deps;

  /**
   * GET /api/site
   * Get current site information
   * Auth: Required
   */
  router.get(
    '/',
    requireAuth,
    asyncHandler(async (_req, res) => {
      const { err, result } = await safeTryAsync(async () => {
        const site = await models.sites.findDefaultSite();
        
        if (!site) {
          throw new Error('Site not found');
        }

        return {
          status: true,
          data: {
            logoUrl: site.logoUrl,
            faviconUrl: site.faviconUrl,
            activeThemeId: site.activeThemeId,
          },
        };
      });

      if (err) {
        console.error('Error fetching site info:', err);
        return res.status(500).json({
          status: false,
          message: 'Failed to fetch site information',
        });
      }

      res.json(result);
    })
  );

  /**
   * PATCH /api/site
   * Update site information
   * Auth: Required
   */
  router.patch(
    '/',
    requireAuth,
    asyncHandler(async (req, res) => {
      console.log('PATCH /api/site - Received payload:', JSON.stringify(req.body, null, 2));

      // Validate payload
      const validationResult = siteInfoSchema.safeParse(req.body);

      if (!validationResult.success) {
        console.log('Validation failed:', validationResult.error.errors);
        return res.status(400).json({
          status: false,
          message: 'Invalid site information',
          errors: validationResult.error.errors,
        });
      }

      const { err, result } = await safeTryAsync(async () => {
        const site = await models.sites.findDefaultSite();
        
        if (!site) {
          throw new Error('Site not found');
        }

        // Update only provided fields
        const updateData: any = {
          updatedAt: new Date(),
        };

        if (validationResult.data.logoUrl !== undefined) {
          updateData.logoUrl = validationResult.data.logoUrl;
        }
        if (validationResult.data.faviconUrl !== undefined) {
          updateData.faviconUrl = validationResult.data.faviconUrl;
        }
        if (validationResult.data.activeThemeId !== undefined) {
          updateData.activeThemeId = validationResult.data.activeThemeId;
        }

        await models.sites.update(site.id, updateData);

        // Fetch updated site
        const updatedSite = await models.sites.findById(site.id);

        return {
          status: true,
          data: {
            logoUrl: updatedSite?.logoUrl,
            faviconUrl: updatedSite?.faviconUrl,
            activeThemeId: updatedSite?.activeThemeId,
          },
        };
      });

      if (err) {
        console.error('Error updating site info:', err);
        return res.status(500).json({
          status: false,
          message: 'Failed to update site information',
        });
      }

      res.json(result);
    })
  );

  return router;
}
