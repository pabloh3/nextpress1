import { Router } from 'express';
import type { Deps } from './shared/deps';
import { asyncHandler } from './shared/async-handler';
import { safeTryAsync } from '../utils';
import { partialSettingsSchema } from '@shared/settings-schema';
import { updateCaddyConfig } from '../utils/caddy';
import { validateDomain } from '../utils/validate-domain';

/**
 * Creates settings routes for site-wide configuration management
 * 
 * Endpoints:
 * - GET /api/settings - Get current site settings
 * - PATCH /api/settings - Update site settings (partial)
 * 
 * All endpoints require authentication.
 * Settings are stored in sites.settings jsonb column.
 * 
 * @param deps - Injected dependencies (models, auth)
 * @returns Express router with mounted settings routes
 */
export function createSettingsRoutes(deps: Deps): Router {
  const router = Router();
  const { models, requireAuth } = deps;

  /**
   * GET /api/settings
   * Get current site settings merged with defaults
   * Auth: Required
   */
  router.get(
    '/',
    requireAuth,
    asyncHandler(async (_req, res) => {
      const { err, result } = await safeTryAsync(async () => {
        const settings = await models.sites.getSettings();
        return { status: true, data: settings };
      });

      if (err) {
        console.error('Error fetching settings:', err);
        return res.status(500).json({
          status: false,
          message: 'Failed to fetch settings',
        });
      }

      res.json(result);
    })
  );

  /**
   * PATCH /api/settings
   * Update site settings with partial changes
   * Auth: Required
   * 
   * Validates partial payload, merges with existing, persists
   */
  router.patch(
    '/',
    requireAuth,
    asyncHandler(async (req, res) => {
      // Log incoming payload for debugging
      console.log('PATCH /api/settings - Received payload:', JSON.stringify(req.body, null, 2));
      
      // Validate partial payload first (before safeTryAsync)
      const validationResult = partialSettingsSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        console.log('Validation failed:', validationResult.error.errors);
        return res.status(400).json({
          status: false,
          message: 'Invalid settings data',
          errors: validationResult.error.errors,
        });
      }

      const { err, result } = await safeTryAsync(async () => {
        // If updating siteUrl, validate domain resolves then update Caddyfile
        if (validationResult.data.general?.siteUrl) {
          const oldSettings = await models.sites.getSettings();
          const oldUrl = oldSettings.general?.siteUrl;
          const newUrl = validationResult.data.general.siteUrl;
          
          if (oldUrl !== newUrl && newUrl) {
            // Validate domain before updating Caddy config
            const domainCheck = await validateDomain(newUrl);
            if (!domainCheck.valid) {
              return { status: false, message: domainCheck.message };
            }

            const caddyResult = await updateCaddyConfig(newUrl);
            console.log('Settings Caddy update:', caddyResult.message);

            if (!caddyResult.success) {
              return { status: false, message: `Domain saved but Caddy configuration failed: ${caddyResult.message}` };
            }
          }
        }

        const updatedSettings = await models.sites.updateSettings(
          validationResult.data
        );

        return { status: true, data: updatedSettings };
      });

      if (err) {
        console.error('Error updating settings:', err);
        return res.status(500).json({
          status: false,
          message: 'Failed to update settings',
        });
      }

      // Domain validation or Caddy config failures are returned as { status: false }
      if (result && !result.status) {
        return res.status(400).json(result);
      }

      res.json(result);
    })
  );

  return router;
}
