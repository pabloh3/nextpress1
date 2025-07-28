import { storage } from "./storage.js";
import hooks from "./hooks.js";

class ThemeManager {
  constructor() {
    this.renderers = new Map();
    this.registerDefaultRenderers();
  }

  // Register default theme renderers
  registerDefaultRenderers() {
    // React renderer
    this.renderers.set('react', {
      name: 'React Renderer',
      render: async (template, data) => {
        // React server-side rendering would go here
        return `<!-- React rendered content for ${template} -->`;
      }
    });

    // Next.js renderer
    this.renderers.set('nextjs', {
      name: 'Next.js Renderer',
      render: async (template, data) => {
        // Next.js rendering logic would go here
        return `<!-- Next.js rendered content for ${template} -->`;
      }
    });

    // Custom renderer
    this.renderers.set('custom', {
      name: 'Custom Renderer',
      render: async (template, data) => {
        // Custom rendering logic
        return `<!-- Custom rendered content for ${template} -->`;
      }
    });
  }

  // Register a new theme renderer
  registerRenderer(name, renderer) {
    this.renderers.set(name, renderer);
  }

  // Get available renderers
  getRenderers() {
    return Array.from(this.renderers.keys());
  }

  // Install a new theme
  async installTheme(themeData) {
    const theme = await storage.createTheme(themeData);
    hooks.doAction('theme_installed', theme);
    return theme;
  }

  // Activate a theme
  async activateTheme(themeId) {
    const oldTheme = await storage.getActiveTheme();
    await storage.activateTheme(themeId);
    const newTheme = await storage.getTheme(themeId);
    
    hooks.doAction('switch_theme', newTheme, oldTheme);
    return newTheme;
  }

  // Get active theme
  async getActiveTheme() {
    return await storage.getActiveTheme();
  }

  // Render content using active theme
  async renderContent(template, data) {
    const activeTheme = await this.getActiveTheme();
    
    if (!activeTheme) {
      throw new Error('No active theme found');
    }

    const renderer = this.renderers.get(activeTheme.renderer);
    if (!renderer) {
      throw new Error(`Renderer '${activeTheme.renderer}' not found`);
    }

    // Apply theme filters
    const filteredData = hooks.applyFilters('theme_data', data, activeTheme);
    const filteredTemplate = hooks.applyFilters('theme_template', template, activeTheme);

    // Render content
    const content = await renderer.render(filteredTemplate, filteredData);
    
    // Apply content filters
    return hooks.applyFilters('theme_content', content, activeTheme);
  }

  // Get theme templates
  getTemplateHierarchy(type, slug = null) {
    const templates = [];
    
    switch (type) {
      case 'single':
        if (slug) templates.push(`single-${slug}.js`);
        templates.push('single.js', 'index.js');
        break;
      case 'page':
        if (slug) templates.push(`page-${slug}.js`);
        templates.push('page.js', 'index.js');
        break;
      case 'archive':
        templates.push('archive.js', 'index.js');
        break;
      case 'home':
        templates.push('home.js', 'index.js');
        break;
      default:
        templates.push('index.js');
    }
    
    return templates;
  }

  // WordPress-compatible theme functions
  async getCurrentTheme() {
    return await this.getActiveTheme();
  }

  async switchTheme(themeName) {
    const themes = await storage.getThemes();
    const theme = themes.find(t => t.name === themeName);
    
    if (!theme) {
      throw new Error(`Theme '${themeName}' not found`);
    }
    
    return await this.activateTheme(theme.id);
  }
}

// Initialize default themes
async function initializeDefaultThemes() {
  const themes = await storage.getThemes();
  
  if (themes.length === 0) {
    // Create default Next.js theme
    const nextTheme = await storage.createTheme({
      name: 'Next Theme',
      description: 'A modern, responsive theme built with Next.js and Tailwind CSS.',
      version: '1.0.0',
      author: 'NextPress Team',
      renderer: 'nextjs',
      isActive: true,
      config: {
        colors: {
          primary: '#0073aa',
          secondary: '#005177',
          background: '#ffffff',
          text: '#23282d'
        },
        layout: {
          maxWidth: '1200px',
          sidebar: 'right'
        }
      }
    });

    console.log('Default theme initialized:', nextTheme.name);
  }
}

const themeManager = new ThemeManager();

// Initialize themes on startup
initializeDefaultThemes().catch(console.error);

export default themeManager;
