import type { Deps } from '../shared/deps';

/**
 * Initializes default roles and site on first run.
 * Creates admin, editor, and subscriber roles with appropriate capabilities.
 * Creates a default site with the first available user as owner.
 * 
 * @param deps - Dependency injection container with models access
 */
export async function initializeDefaultRolesAndSite(deps: Deps) {
  try {
    // Check if roles exist
    const existingRoles = await deps.models.roles.findDefaultRoles();

    if (existingRoles.length === 0) {
      console.log('Creating default roles...');

      // Create default roles
      const adminRole = await deps.models.roles.create({
        name: 'admin',
        description: 'Full system access with all permissions',
        capabilities: [
          {
            name: 'manage_users',
            description: 'Create, edit, and delete users',
          },
          {
            name: 'manage_roles',
            description: 'Create, edit, and delete roles',
          },
          {
            name: 'manage_sites',
            description: 'Create, edit, and delete sites',
          },
          {
            name: 'manage_themes',
            description: 'Install, activate, and customize themes',
          },
          {
            name: 'manage_plugins',
            description: 'Install, activate, and configure plugins',
          },
          {
            name: 'manage_settings',
            description: 'Access and modify system settings',
          },
          { name: 'publish_posts', description: 'Publish posts and pages' },
          { name: 'edit_posts', description: 'Edit all posts and pages' },
          { name: 'delete_posts', description: 'Delete posts and pages' },
          {
            name: 'manage_media',
            description: 'Upload and manage media files',
          },
          {
            name: 'moderate_comments',
            description: 'Approve, edit, and delete comments',
          },
        ],
      });

      const editorRole = await deps.models.roles.create({
        name: 'editor',
        description: 'Content management with publishing permissions',
        capabilities: [
          { name: 'publish_posts', description: 'Publish posts and pages' },
          { name: 'edit_posts', description: 'Edit all posts and pages' },
          { name: 'delete_posts', description: 'Delete posts and pages' },
          {
            name: 'manage_media',
            description: 'Upload and manage media files',
          },
          {
            name: 'moderate_comments',
            description: 'Approve, edit, and delete comments',
          },
        ],
      });

      const subscriberRole = await deps.models.roles.create({
        name: 'subscriber',
        description: 'Basic user with limited content access',
        capabilities: [
          { name: 'read_posts', description: 'Read published posts and pages' },
          { name: 'comment_posts', description: 'Comment on posts' },
        ],
      });

      console.log('Default roles created:', {
        adminRole: adminRole.name,
        editorRole: editorRole.name,
        subscriberRole: subscriberRole.name,
      });
    }

    // NOTE: Default site and user creation is now handled by the Setup Wizard.
    // This allows fresh installations to go through a guided setup process
    // where the user configures their admin account and site details.
    // See: /api/setup routes and /setup frontend page.
  } catch (error) {
    console.error('Error initializing default roles and site:', error);
  }
}
