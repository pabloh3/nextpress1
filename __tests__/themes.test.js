/**
 * Test suite for NextPress Theme System
 * Tests theme management and rendering functionality
 */

const ThemeManager = require('../server/themes').default;

// Mock storage
const mockStorage = {
  createTheme: jest.fn(),
  getThemes: jest.fn(),
  getTheme: jest.fn(),
  getActiveTheme: jest.fn(),
  activateTheme: jest.fn(),
};

// Mock hooks
const mockHooks = {
  doAction: jest.fn(),
  applyFilters: jest.fn((tag, value) => value),
};

// Mock dependencies
jest.mock('../server/storage', () => ({
  storage: mockStorage
}));

jest.mock('../server/hooks', () => ({
  default: mockHooks
}));

describe('NextPress Theme System', () => {
  let themeManager;

  beforeEach(() => {
    themeManager = new ThemeManager();
    jest.clearAllMocks();
  });

  describe('Theme Renderers', () => {
    test('should register default renderers', () => {
      const renderers = themeManager.getRenderers();
      
      expect(renderers).toContain('react');
      expect(renderers).toContain('nextjs');
      expect(renderers).toContain('custom');
    });

    test('should register custom renderer', () => {
      const customRenderer = {
        name: 'Vue Renderer',
        render: async (template, data) => '<div>Vue content</div>'
      };

      themeManager.registerRenderer('vue', customRenderer);
      const renderers = themeManager.getRenderers();
      
      expect(renderers).toContain('vue');
    });
  });

  describe('Theme Installation', () => {
    test('should install new theme', async () => {
      const themeData = {
        name: 'Test Theme',
        description: 'A test theme',
        version: '1.0.0',
        renderer: 'react'
      };

      const installedTheme = { id: 1, ...themeData };
      mockStorage.createTheme.mockResolvedValue(installedTheme);

      const result = await themeManager.installTheme(themeData);

      expect(result).toEqual(installedTheme);
      expect(mockStorage.createTheme).toHaveBeenCalledWith(themeData);
      expect(mockHooks.doAction).toHaveBeenCalledWith('theme_installed', installedTheme);
    });
  });

  describe('Theme Activation', () => {
    test('should activate theme and trigger hooks', async () => {
      const oldTheme = { id: 1, name: 'Old Theme', isActive: true };
      const newTheme = { id: 2, name: 'New Theme', isActive: false };

      mockStorage.getActiveTheme.mockResolvedValue(oldTheme);
      mockStorage.getTheme.mockResolvedValue(newTheme);
      mockStorage.activateTheme.mockResolvedValue();

      const result = await themeManager.activateTheme(2);

      expect(result).toEqual(newTheme);
      expect(mockStorage.activateTheme).toHaveBeenCalledWith(2);
      expect(mockHooks.doAction).toHaveBeenCalledWith('switch_theme', newTheme, oldTheme);
    });

    test('should handle theme switching without old theme', async () => {
      const newTheme = { id: 1, name: 'First Theme', isActive: false };

      mockStorage.getActiveTheme.mockResolvedValue(null);
      mockStorage.getTheme.mockResolvedValue(newTheme);
      mockStorage.activateTheme.mockResolvedValue();

      await themeManager.activateTheme(1);

      expect(mockHooks.doAction).toHaveBeenCalledWith('switch_theme', newTheme, null);
    });
  });

  describe('Content Rendering', () => {
    test('should render content with active theme', async () => {
      const activeTheme = {
        id: 1,
        name: 'Test Theme',
        renderer: 'react'
      };

      const mockData = { title: 'Test Page', content: 'Test content' };
      mockStorage.getActiveTheme.mockResolvedValue(activeTheme);

      // Mock the React renderer
      themeManager.renderers.set('react', {
        name: 'React Renderer',
        render: async (template, data) => `<div>${data.title}: ${data.content}</div>`
      });

      const result = await themeManager.renderContent('single', mockData);

      expect(result).toBe('<div>Test Page: Test content</div>');
      expect(mockHooks.applyFilters).toHaveBeenCalledWith('theme_data', mockData, activeTheme);
      expect(mockHooks.applyFilters).toHaveBeenCalledWith('theme_template', 'single', activeTheme);
    });

    test('should throw error if no active theme', async () => {
      mockStorage.getActiveTheme.mockResolvedValue(null);

      await expect(themeManager.renderContent('single', {}))
        .rejects.toThrow('No active theme found');
    });

    test('should throw error if renderer not found', async () => {
      const activeTheme = {
        id: 1,
        name: 'Test Theme',
        renderer: 'nonexistent'
      };

      mockStorage.getActiveTheme.mockResolvedValue(activeTheme);

      await expect(themeManager.renderContent('single', {}))
        .rejects.toThrow("Renderer 'nonexistent' not found");
    });
  });

  describe('Template Hierarchy', () => {
    test('should return correct template hierarchy for single posts', () => {
      const templates = themeManager.getTemplateHierarchy('single', 'my-post');
      
      expect(templates).toEqual([
        'single-my-post.js',
        'single.js',
        'index.js'
      ]);
    });

    test('should return correct template hierarchy for pages', () => {
      const templates = themeManager.getTemplateHierarchy('page', 'about');
      
      expect(templates).toEqual([
        'page-about.js',
        'page.js',
        'index.js'
      ]);
    });

    test('should return correct template hierarchy for archives', () => {
      const templates = themeManager.getTemplateHierarchy('archive');
      
      expect(templates).toEqual([
        'archive.js',
        'index.js'
      ]);
    });

    test('should return correct template hierarchy for home', () => {
      const templates = themeManager.getTemplateHierarchy('home');
      
      expect(templates).toEqual([
        'home.js',
        'index.js'
      ]);
    });

    test('should fallback to index for unknown types', () => {
      const templates = themeManager.getTemplateHierarchy('unknown');
      
      expect(templates).toEqual(['index.js']);
    });
  });

  describe('WordPress Compatibility', () => {
    test('should provide getCurrentTheme method', async () => {
      const activeTheme = { id: 1, name: 'Current Theme' };
      mockStorage.getActiveTheme.mockResolvedValue(activeTheme);

      const result = await themeManager.getCurrentTheme();
      
      expect(result).toEqual(activeTheme);
    });

    test('should provide switchTheme method', async () => {
      const themes = [
        { id: 1, name: 'Theme One' },
        { id: 2, name: 'Theme Two' }
      ];
      
      const targetTheme = themes[1];
      mockStorage.getThemes.mockResolvedValue(themes);
      mockStorage.getActiveTheme.mockResolvedValue(null);
      mockStorage.getTheme.mockResolvedValue(targetTheme);
      mockStorage.activateTheme.mockResolvedValue();

      const result = await themeManager.switchTheme('Theme Two');
      
      expect(result).toEqual(targetTheme);
      expect(mockStorage.activateTheme).toHaveBeenCalledWith(2);
    });

    test('should throw error for nonexistent theme', async () => {
      const themes = [{ id: 1, name: 'Theme One' }];
      mockStorage.getThemes.mockResolvedValue(themes);

      await expect(themeManager.switchTheme('Nonexistent Theme'))
        .rejects.toThrow("Theme 'Nonexistent Theme' not found");
    });
  });

  describe('Theme Configuration', () => {
    test('should handle theme with configuration', async () => {
      const themeWithConfig = {
        id: 1,
        name: 'Configurable Theme',
        renderer: 'react',
        config: {
          colors: { primary: '#0073aa' },
          layout: { sidebar: 'right' }
        }
      };

      mockStorage.getActiveTheme.mockResolvedValue(themeWithConfig);

      // Mock renderer that uses config
      themeManager.renderers.set('react', {
        name: 'React Renderer',
        render: async (template, data) => {
          return `<div style="color: ${themeWithConfig.config.colors.primary}">Themed content</div>`;
        }
      });

      const result = await themeManager.renderContent('single', { title: 'Test' });
      
      expect(result).toContain('#0073aa');
    });
  });

  describe('Renderer Integration', () => {
    test('should pass correct parameters to renderer', async () => {
      const activeTheme = { id: 1, name: 'Test Theme', renderer: 'react' };
      const mockRenderer = { render: jest.fn().mockResolvedValue('<div>rendered</div>') };
      
      mockStorage.getActiveTheme.mockResolvedValue(activeTheme);
      themeManager.renderers.set('react', mockRenderer);
      
      const template = 'single';
      const data = { title: 'Test', content: 'Content' };

      await themeManager.renderContent(template, data);

      expect(mockRenderer.render).toHaveBeenCalledWith(template, data);
    });

    test('should apply theme filters to data and template', async () => {
      const activeTheme = { id: 1, name: 'Test Theme', renderer: 'react' };
      const mockRenderer = { render: jest.fn().mockResolvedValue('<div>rendered</div>') };
      
      mockStorage.getActiveTheme.mockResolvedValue(activeTheme);
      themeManager.renderers.set('react', mockRenderer);
      
      mockHooks.applyFilters
        .mockReturnValueOnce({ modified: 'data' }) // theme_data filter
        .mockReturnValueOnce('modified-template') // theme_template filter
        .mockReturnValueOnce('<div>filtered content</div>'); // theme_content filter

      const result = await themeManager.renderContent('single', { original: 'data' });

      expect(mockHooks.applyFilters).toHaveBeenCalledWith('theme_data', { original: 'data' }, activeTheme);
      expect(mockHooks.applyFilters).toHaveBeenCalledWith('theme_template', 'single', activeTheme);
      expect(mockHooks.applyFilters).toHaveBeenCalledWith('theme_content', '<div>rendered</div>', activeTheme);
      expect(result).toBe('<div>filtered content</div>');
    });
  });
});
