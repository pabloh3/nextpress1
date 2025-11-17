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

    // Check if default site exists
    const defaultSite = await deps.models.sites.findDefaultSite();

    if (!defaultSite) {
      console.log('Creating default site...');

      // Get the first user to be the site owner, or create a system user
      let ownerId: string;
      const users = await deps.models.users.findMany();

      if (users.length === 0) {
        // Create a system user for the site
        const systemUser = await deps.models.users.create({
          username: 'system',
          email: 'system@nextpress.local',
          firstName: 'System',
          lastName: 'User',
          status: 'active',
        });
        ownerId = systemUser.id;
      } else {
        ownerId = users[0].id;
      }

      const site = await deps.models.sites.create({
        name: 'Default Site',
        description: 'The default site for NextPress',
        siteUrl: 'http://localhost:3000',
        ownerId: ownerId,
        settings: {
          title: 'NextPress Site',
          tagline: 'A modern content management system',
          timezone: 'UTC',
          dateFormat: 'Y-m-d',
          timeFormat: 'H:i',
        },
      });

      console.log('Default site created:', site.name);
    }
  } catch (error) {
    console.error('Error initializing default roles and site:', error);
  }
}
