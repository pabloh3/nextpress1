import { storage } from "./storage.js";
import hooks from "./hooks.js";
import { spawn } from "child_process";
import { promises as fs } from "fs";
import path from "path";

interface ThemeRenderer {
  name: string;
  type: 'nextjs' | 'react' | 'vue' | 'custom';
  render: (template: string, data: any) => Promise<string>;
  isActive?: boolean;
}

class ThemeManager {
  private renderers: Map<string, ThemeRenderer>;
  private activeTheme: any;
  private nextJsProcess: any;

  constructor() {
    this.renderers = new Map();
    this.registerDefaultRenderers();
  }

  // Register default theme renderers
  registerDefaultRenderers() {
    // React renderer
    this.renderers.set('react', {
      name: 'React Renderer',
      type: 'react',
      render: async (template: string, data: any) => {
        // React server-side rendering would go here
        return `<!-- React rendered content for ${template} -->`;
      }
    });

    // Next.js renderer
    this.renderers.set('nextjs', {
      name: 'Next.js Renderer',
      type: 'nextjs',
      render: async (template: string, data: any) => {
        return this.renderNextJsTemplate(template, data);
      }
    });

    // Vue renderer
    this.renderers.set('vue', {
      name: 'Vue.js Renderer',
      type: 'vue',
      render: async (template: string, data: any) => {
        // Vue server-side rendering would go here
        return `<!-- Vue rendered content for ${template} -->`;
      }
    });

    // Custom renderer
    this.renderers.set('custom', {
      name: 'Custom Renderer',
      type: 'custom',
      render: async (template: string, data: any) => {
        // Custom rendering logic
        return `<!-- Custom rendered content for ${template} -->`;
      }
    });
  }

  // Register a new theme renderer
  registerRenderer(name: string, renderer: ThemeRenderer) {
    this.renderers.set(name, renderer);
  }

  // Get available renderers
  getRenderers() {
    return Array.from(this.renderers.keys());
  }

  // Get renderer by name
  getRenderer(name: string): ThemeRenderer | undefined {
    return this.renderers.get(name);
  }

  // Install a new theme
  async installTheme(themeData: any) {
    const theme = await storage.createTheme(themeData);
    hooks.doAction('theme_installed', theme);
    return theme;
  }

  // Activate a theme
  async activateTheme(themeId: number) {
    const oldTheme = await storage.getActiveTheme();
    await storage.activateTheme(themeId);
    const newTheme = await storage.getTheme(themeId);
    
    // Stop previous Next.js process if switching from Next.js theme
    if (oldTheme?.renderer === 'nextjs') {
      await this.stopNextJsProcess();
    }
    
    // Start Next.js process if switching to Next.js theme
    if (newTheme?.renderer === 'nextjs') {
      await this.startNextJsProcess();
    }
    
    this.activeTheme = newTheme;
    hooks.doAction('switch_theme', newTheme, oldTheme);
    return newTheme;
  }

  // Get active theme
  async getActiveTheme() {
    if (!this.activeTheme) {
      this.activeTheme = await storage.getActiveTheme();
    }
    return this.activeTheme;
  }

  // Start Next.js development server for theme
  async startNextJsProcess() {
    try {
      const themePath = path.join(process.cwd(), 'themes', 'nextjs-theme');
      
      // Check if Next.js theme exists
      try {
        await fs.access(path.join(themePath, 'package.json'));
      } catch {
        console.log('Next.js theme not found, skipping Next.js process start');
        return;
      }

      // Kill existing process if running
      if (this.nextJsProcess) {
        await this.stopNextJsProcess();
      }

      console.log('Starting Next.js theme development server...');
      
      this.nextJsProcess = spawn('npm', ['run', 'dev'], {
        cwd: themePath,
        stdio: 'pipe',
        env: { ...process.env, PORT: '3001' }
      });

      this.nextJsProcess.stdout?.on('data', (data: Buffer) => {
        console.log(`Next.js Theme: ${data.toString()}`);
      });

      this.nextJsProcess.stderr?.on('data', (data: Buffer) => {
        console.error(`Next.js Theme Error: ${data.toString()}`);
      });

      this.nextJsProcess.on('close', (code: number) => {
        console.log(`Next.js theme process exited with code ${code}`);
        this.nextJsProcess = null;
      });

      // Wait a bit for the server to start
      await new Promise(resolve => setTimeout(resolve, 3000));
      
    } catch (error) {
      console.error('Error starting Next.js theme process:', error);
    }
  }

  // Stop Next.js development server
  async stopNextJsProcess() {
    if (this.nextJsProcess) {
      console.log('Stopping Next.js theme development server...');
      this.nextJsProcess.kill('SIGTERM');
      this.nextJsProcess = null;
    }
  }

  // Next.js specific rendering method
  async renderNextJsTemplate(template: string, data: any): Promise<string> {
    const { post, page, site } = data;
    const content = post || page;
    
    if (!content) {
      return this.render404();
    }

    // For now, use the fallback template until we set up proper Next.js integration
    // This will be enhanced to actually use Next.js rendering
    return this.renderFallbackTemplate(template, data);
  }

  // Fallback template rendering when Next.js is not available
  renderFallbackTemplate(template: string, data: any): string {
    const { post, page, site } = data;
    const content = post || page;
    
    if (!content) {
      return this.render404();
    }

    switch (template) {
      case 'single-post':
      case 'post':
        return this.renderSinglePost(content, site);
      case 'page':
        return this.renderSinglePage(content, site);
      case 'home':
      case 'index':
        return this.renderHomePage(data.posts || [], site);
      default:
        return this.renderSinglePost(content, site);
    }
  }

  renderSinglePost(post: any, site: any): string {
    const siteTitle = site?.name || 'NextPress';
    const siteDescription = site?.description || 'A modern WordPress alternative';
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${post.title} - ${siteTitle}</title>
    <meta name="description" content="${siteDescription}">
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50">
    <div class="min-h-screen flex flex-col">
        <header class="bg-white shadow-sm border-b">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between items-center py-6">
                    <div class="flex items-center">
                        <a href="/" class="text-2xl font-bold text-blue-600">
                            ${siteTitle}
                        </a>
                    </div>
                </div>
            </div>
        </header>
        
        <main class="flex-grow">
            <article class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <header class="mb-8">
                    <h1 class="text-4xl font-bold text-gray-900 mb-4">
                        ${post.title}
                    </h1>
                    <div class="flex items-center text-gray-600 mb-6">
                        <time datetime="${post.created_at}">
                            ${new Date(post.created_at).toLocaleDateString()}
                        </time>
                        ${post.author ? `<span class="mx-2">•</span><span>By ${post.author.username}</span>` : ''}
                    </div>
                </header>

                <div class="prose prose-lg max-w-none">
                    ${this.parseContent(post.content)}
                </div>
            </article>
        </main>

        <footer class="bg-gray-50 border-t mt-12">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div class="text-center text-gray-600">
                    <p>&copy; ${new Date().getFullYear()} ${siteTitle}. All rights reserved.</p>
                </div>
            </div>
        </footer>
    </div>
</body>
</html>`;
  }

  renderSinglePage(page: any, site: any): string {
    // Pages use the same template as posts for now
    return this.renderSinglePost(page, site);
  }

  renderHomePage(posts: any[], site: any): string {
    const siteTitle = site?.name || 'NextPress';
    const siteDescription = site?.description || 'A modern WordPress alternative';
    
    const postsHtml = posts.map(post => `
        <article class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
            <div class="p-6">
                <h3 class="text-xl font-semibold text-gray-900 mb-2">
                    <a href="/posts/${post.slug}" class="hover:text-blue-600 transition-colors">
                        ${post.title}
                    </a>
                </h3>
                <p class="text-gray-600 mb-4">
                    ${post.excerpt || post.content.substring(0, 150)}...
                </p>
                <div class="flex items-center justify-between text-sm text-gray-500">
                    <span>${new Date(post.created_at).toLocaleDateString()}</span>
                    ${post.author ? `<span>By ${post.author.username}</span>` : ''}
                </div>
            </div>
        </article>
    `).join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${siteTitle}</title>
    <meta name="description" content="${siteDescription}">
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50">
    <div class="min-h-screen flex flex-col">
        <header class="bg-white shadow-sm border-b">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between items-center py-6">
                    <div class="flex items-center">
                        <a href="/" class="text-2xl font-bold text-blue-600">
                            ${siteTitle}
                        </a>
                    </div>
                </div>
            </div>
        </header>
        
        <main class="flex-grow">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div class="text-center mb-12">
                    <h1 class="text-4xl font-bold text-gray-900 mb-4">
                        Welcome to ${siteTitle}
                    </h1>
                    <p class="text-xl text-gray-600 max-w-2xl mx-auto">
                        ${siteDescription}
                    </p>
                </div>

                ${posts.length > 0 ? `
                <div class="mt-16">
                    <h2 class="text-3xl font-bold text-gray-900 mb-8">Latest Posts</h2>
                    <div class="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                        ${postsHtml}
                    </div>
                </div>
                ` : ''}
            </div>
        </main>

        <footer class="bg-gray-50 border-t mt-12">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div class="text-center text-gray-600">
                    <p>&copy; ${new Date().getFullYear()} ${siteTitle}. All rights reserved.</p>
                </div>
            </div>
        </footer>
    </div>
</body>
</html>`;
  }

  render404(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Page Not Found - NextPress</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50">
    <div class="min-h-screen flex items-center justify-center">
        <div class="text-center">
            <h1 class="text-4xl font-bold text-gray-900 mb-4">404 - Page Not Found</h1>
            <p class="text-gray-600 mb-8">The page you're looking for doesn't exist.</p>
            <a href="/" class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
                Go Home
            </a>
        </div>
    </div>
</body>
</html>`;
  }

  parseContent(content: string): string {
    return content
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>');
  }

  // Render content using active theme
  async renderContent(template: string, data: any): Promise<string> {
    const activeTheme = await this.getActiveTheme();
    
    if (!activeTheme) {
      console.warn('No active theme found, using fallback renderer');
      return this.renderFallbackTemplate(template, data);
    }

    const renderer = this.renderers.get(activeTheme.renderer || 'nextjs');
    
    if (!renderer) {
      console.warn(`Renderer '${activeTheme.renderer}' not found, using fallback`);
      return this.renderFallbackTemplate(template, data);
    }

    try {
      // Render content
      const html = await renderer.render(template, data);
      return html;
    } catch (error) {
      console.error('Error rendering content:', error);
      return this.renderFallbackTemplate(template, data);
    }
  }

  getTemplateHierarchy(type: string, slug: string | null = null): string[] {
    const templates = [];
    
    if (type === 'post') {
      templates.push('single-post', 'post');
    } else if (type === 'page') {
      templates.push('page');
    } else if (type === 'home') {
      templates.push('home', 'index');
    }
    
    return templates;
  }

  async getCurrentTheme() {
    return await this.getActiveTheme();
  }

  async switchTheme(themeName: string) {
    const themes = await storage.getThemes();
    const theme = themes.find(t => t.name === themeName);
    
    if (theme) {
      return await this.activateTheme(theme.id);
    }
    
    throw new Error(`Theme '${themeName}' not found`);
  }

  // Cleanup method
  async cleanup() {
    await this.stopNextJsProcess();
  }
}

const themeManager = new ThemeManager();

// Initialize default themes
async function initializeDefaultThemes() {
  try {
    const themes = await storage.getThemes();
    
    if (themes.length === 0) {
      // Create default Next.js theme
      await storage.createTheme({
        name: 'Next.js Theme',
        description: 'A modern Next.js-based theme',
        renderer: 'nextjs',
        isActive: true,
        config: {
          siteName: 'NextPress',
          siteDescription: 'A modern WordPress alternative'
        }
      });
      
      console.log('Default Next.js theme created');
    }
  } catch (error) {
    console.error('Error initializing default themes:', error);
  }
}

// Initialize themes on startup
initializeDefaultThemes();

export default themeManager;
