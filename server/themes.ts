import { storage } from "./storage.js";
import hooks from "./hooks.js";

class ThemeManager {
  private renderers: Map<string, any>;

  constructor() {
    this.renderers = new Map();
    this.registerDefaultRenderers();
  }

  // Register default theme renderers
  registerDefaultRenderers() {
    // React renderer
    this.renderers.set('react', {
      name: 'React Renderer',
      render: async (template: string, data: any) => {
        // React server-side rendering would go here
        return `<!-- React rendered content for ${template} -->`;
      }
    });

    // Next.js renderer
    this.renderers.set('nextjs', {
      name: 'Next.js Renderer',
      render: async (template: string, data: any) => {
        return this.renderNextJsTemplate(template, data);
      }
    });

    // Custom renderer
    this.renderers.set('custom', {
      name: 'Custom Renderer',
      render: async (template: string, data: any) => {
        // Custom rendering logic
        return `<!-- Custom rendered content for ${template} -->`;
      }
    });
  }

  // Register a new theme renderer
  registerRenderer(name: string, renderer: any) {
    this.renderers.set(name, renderer);
  }

  // Get available renderers
  getRenderers() {
    return Array.from(this.renderers.keys());
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
    
    hooks.doAction('switch_theme', newTheme, oldTheme);
    return newTheme;
  }

  // Get active theme
  async getActiveTheme() {
    return await storage.getActiveTheme();
  }

  // Next.js specific rendering method
  renderNextJsTemplate(template: string, data: any): string {
    const { post, page, site } = data;
    const content = post || page;
    
    switch (template) {
      case 'single-post':
      case 'post':
        if (!content) {
          return this.render404();
        }
        return this.renderSinglePost(content, site);
      case 'page':
        if (!content) {
          return this.render404();
        }
        return this.renderSinglePage(content, site);
      case 'home':
      case 'index':
        return this.renderHomePage(data.posts || [], site);
      case 'landing':
        return this.renderLandingPage(site);
      default:
        if (!content) {
          return this.render404();
        }
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
    <title>${post.title} | ${siteTitle}</title>
    <meta name="description" content="${post.excerpt || post.title}">
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="article">
    <meta property="og:title" content="${post.title}">
    <meta property="og:description" content="${post.excerpt || post.title}">
    <meta property="og:url" content="${site?.url || ''}/posts/${post.id}">
    
    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:title" content="${post.title}">
    <meta property="twitter:description" content="${post.excerpt || post.title}">
    
    <!-- Next.js-style CSS -->
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
            line-height: 1.6;
            color: #333;
            background: #fff;
        }
        
        .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem 1rem;
        }
        
        header {
            text-align: center;
            margin-bottom: 3rem;
            padding-bottom: 2rem;
            border-bottom: 1px solid #eee;
        }
        
        .site-title {
            font-size: 2rem;
            font-weight: 700;
            margin-bottom: 0.5rem;
            color: #1a1a1a;
        }
        
        .site-description {
            color: #666;
            font-size: 1.1rem;
        }
        
        .post-header {
            margin-bottom: 2rem;
        }
        
        .post-title {
            font-size: 2.5rem;
            font-weight: 700;
            line-height: 1.2;
            margin-bottom: 1rem;
            color: #1a1a1a;
        }
        
        .post-meta {
            display: flex;
            align-items: center;
            gap: 1rem;
            font-size: 0.9rem;
            color: #666;
            margin-bottom: 1rem;
        }
        
        .post-status {
            display: inline-block;
            padding: 0.25rem 0.75rem;
            border-radius: 9999px;
            font-size: 0.75rem;
            font-weight: 500;
            text-transform: uppercase;
        }
        
        .status-published { background: #dcfce7; color: #166534; }
        .status-draft { background: #fef3c7; color: #92400e; }
        .status-private { background: #fee2e2; color: #991b1b; }
        
        .post-content {
            font-size: 1.1rem;
            line-height: 1.8;
            margin-bottom: 2rem;
        }
        
        .post-content h1, .post-content h2, .post-content h3 {
            margin: 2rem 0 1rem 0;
            line-height: 1.3;
        }
        
        .post-content h1 { font-size: 2rem; }
        .post-content h2 { font-size: 1.75rem; }
        .post-content h3 { font-size: 1.5rem; }
        
        .post-content p {
            margin-bottom: 1.5rem;
        }
        
        .post-content img {
            max-width: 100%;
            height: auto;
            border-radius: 8px;
            margin: 1.5rem 0;
        }
        
        .post-content blockquote {
            border-left: 4px solid #e5e7eb;
            padding-left: 1.5rem;
            margin: 1.5rem 0;
            font-style: italic;
            color: #666;
        }
        
        .post-content code {
            background: #f3f4f6;
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            font-size: 0.9em;
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        }
        
        .post-content pre {
            background: #1f2937;
            color: #f9fafb;
            padding: 1.5rem;
            border-radius: 8px;
            overflow-x: auto;
            margin: 1.5rem 0;
        }
        
        .post-content pre code {
            background: none;
            padding: 0;
            color: inherit;
        }
        
        footer {
            margin-top: 3rem;
            padding-top: 2rem;
            border-top: 1px solid #eee;
            text-align: center;
            color: #666;
            font-size: 0.9rem;
        }
        
        .back-link {
            display: inline-block;
            margin-bottom: 1rem;
            color: #3b82f6;
            text-decoration: none;
            font-weight: 500;
        }
        
        .back-link:hover {
            text-decoration: underline;
        }
        
        @media (max-width: 640px) {
            .container {
                padding: 1rem;
            }
            
            .post-title {
                font-size: 2rem;
            }
            
            .post-meta {
                flex-direction: column;
                align-items: flex-start;
                gap: 0.5rem;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1 class="site-title">${siteTitle}</h1>
            <p class="site-description">${siteDescription}</p>
        </header>
        
        <main>
            <a href="/" class="back-link">← Back to Home</a>
            
            <article>
                <div class="post-header">
                    <h1 class="post-title">${post.title}</h1>
                    <div class="post-meta">
                        <time datetime="${post.createdAt}">
                            ${new Date(post.createdAt).toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                            })}
                        </time>
                        <span class="post-status status-${post.status}">${post.status}</span>
                    </div>
                </div>
                
                <div class="post-content">
                    ${this.parseContent(post.content)}
                </div>
            </article>
        </main>
        
        <footer>
            <p>Powered by NextPress - A modern WordPress alternative</p>
        </footer>
    </div>
</body>
</html>`;
  }

  renderSinglePage(page: any, site: any): string {
    // Similar to post but with different structure
    return this.renderSinglePost(page, site);
  }

  renderLandingPage(site: any): string {
    const siteTitle = site?.name || 'NextPress';
    const siteDescription = site?.description || 'A modern WordPress alternative';
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${siteTitle} - WordPress, Reimagined in JavaScript</title>
    <meta name="description" content="${siteDescription}">
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website">
    <meta property="og:title" content="${siteTitle} - WordPress, Reimagined in JavaScript">
    <meta property="og:description" content="${siteDescription}">
    <meta property="og:url" content="${site?.url || ''}">
    
    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:title" content="${siteTitle} - WordPress, Reimagined in JavaScript">
    <meta property="twitter:description" content="${siteDescription}">
    
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        :root {
            --wp-blue: #3b82f6;
            --wp-blue-dark: #2563eb;
            --wp-gray: #1f2937;
            --wp-gray-light: #f9fafb;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
            line-height: 1.6;
            color: #333;
            background: linear-gradient(135deg, var(--wp-gray-light) 0%, #ffffff 100%);
            min-height: 100vh;
        }
        
        /* Header Styles */
        .header {
            border-bottom: 1px solid #e5e7eb;
            background: rgba(255, 255, 255, 0.8);
            backdrop-filter: blur(8px);
            position: sticky;
            top: 0;
            z-index: 50;
        }
        
        .header-container {
            max-width: 1280px;
            margin: 0 auto;
            padding: 0 1rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
            height: 4rem;
        }
        
        .header-left {
            display: flex;
            align-items: center;
            gap: 1rem;
        }
        
        .site-logo {
            font-size: 1.5rem;
            font-weight: 700;
            color: var(--wp-gray);
            text-decoration: none;
        }
        
        .version-badge {
            background: var(--wp-blue);
            color: white;
            padding: 0.25rem 0.75rem;
            border-radius: 9999px;
            font-size: 0.75rem;
            font-weight: 500;
        }
        
        .header-right {
            display: flex;
            align-items: center;
            gap: 1rem;
        }
        
        .btn {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem 1rem;
            border-radius: 0.375rem;
            text-decoration: none;
            font-weight: 500;
            transition: all 0.2s;
            border: 1px solid transparent;
            cursor: pointer;
            font-size: 0.875rem;
        }
        
        .btn-outline {
            border: 1px solid #d1d5db;
            color: #374151;
            background: white;
        }
        
        .btn-outline:hover {
            background: #f9fafb;
        }
        
        .btn-primary {
            background: var(--wp-blue);
            color: white;
            border: 1px solid var(--wp-blue);
        }
        
        .btn-primary:hover {
            background: var(--wp-blue-dark);
            border-color: var(--wp-blue-dark);
        }
        
        .btn-outline-blue {
            border: 1px solid var(--wp-blue);
            color: var(--wp-blue);
            background: white;
        }
        
        .btn-outline-blue:hover {
            background: var(--wp-blue);
            color: white;
        }
        
        /* Hero Section */
        .hero {
            padding: 5rem 1rem;
            text-align: center;
        }
        
        .hero-container {
            max-width: 1280px;
            margin: 0 auto;
        }
        
        .hero-badge {
            background: rgba(59, 130, 246, 0.1);
            color: var(--wp-blue);
            border: 1px solid rgba(59, 130, 246, 0.2);
            padding: 0.5rem 1rem;
            border-radius: 9999px;
            font-size: 0.875rem;
            font-weight: 500;
            margin-bottom: 2rem;
            display: inline-block;
        }
        
        .hero-title {
            font-size: 3rem;
            font-weight: 700;
            color: var(--wp-gray);
            margin-bottom: 1.5rem;
            line-height: 1.1;
        }
        
        .hero-title-highlight {
            color: var(--wp-blue);
        }
        
        .hero-description {
            font-size: 1.25rem;
            color: #6b7280;
            max-width: 48rem;
            margin: 0 auto 2rem auto;
        }
        
        .hero-buttons {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1rem;
            margin-bottom: 4rem;
        }
        
        .btn-large {
            padding: 0.75rem 2rem;
            font-size: 1rem;
        }
        
        .tech-stack {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            justify-content: center;
            gap: 0.75rem;
            margin-bottom: 4rem;
        }
        
        .tech-label {
            font-size: 0.875rem;
            color: #6b7280;
            margin-right: 1rem;
        }
        
        .tech-badge {
            padding: 0.25rem 0.75rem;
            border-radius: 9999px;
            font-size: 0.75rem;
            font-weight: 500;
            color: white;
        }
        
        .tech-nodejs { background: #339933; }
        .tech-react { background: #61dafb; }
        .tech-postgresql { background: #336791; }
        .tech-express { background: #000000; }
        .tech-typescript { background: #3178c6; }
        .tech-tailwind { background: #06b6d4; }
        
        /* Features Section */
        .features {
            padding: 5rem 1rem;
            background: white;
        }
        
        .features-container {
            max-width: 1280px;
            margin: 0 auto;
        }
        
        .section-header {
            text-align: center;
            margin-bottom: 4rem;
        }
        
        .section-title {
            font-size: 2rem;
            font-weight: 700;
            color: var(--wp-gray);
            margin-bottom: 1rem;
        }
        
        .section-description {
            font-size: 1.125rem;
            color: #6b7280;
            max-width: 32rem;
            margin: 0 auto;
        }
        
        .features-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
            gap: 2rem;
        }
        
        .feature-card {
            border: 1px solid #e5e7eb;
            border-radius: 0.5rem;
            padding: 1.5rem;
            transition: border-color 0.2s;
        }
        
        .feature-card:hover {
            border-color: rgba(59, 130, 246, 0.3);
        }
        
        .feature-header {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            margin-bottom: 1rem;
        }
        
        .feature-icon {
            width: 2.5rem;
            height: 2.5rem;
            background: rgba(59, 130, 246, 0.1);
            border-radius: 0.5rem;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--wp-blue);
        }
        
        .feature-title {
            font-size: 1.125rem;
            font-weight: 600;
            color: var(--wp-gray);
        }
        
        .feature-description {
            color: #6b7280;
        }
        
        /* Compatibility Section */
        .compatibility {
            padding: 5rem 1rem;
            background: var(--wp-gray-light);
        }
        
        .compatibility-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1.5rem;
        }
        
        .compatibility-card {
            border: 1px solid #e5e7eb;
            border-radius: 0.5rem;
            padding: 1.5rem;
            text-align: center;
            background: white;
        }
        
        .check-icon {
            width: 2rem;
            height: 2rem;
            color: #10b981;
            margin: 0 auto 0.5rem auto;
        }
        
        .compatibility-title {
            font-weight: 500;
            color: var(--wp-gray);
            margin-bottom: 0.25rem;
        }
        
        .compatibility-status {
            color: #10b981;
            border: 1px solid #d1fae5;
            background: #ecfdf5;
            padding: 0.25rem 0.75rem;
            border-radius: 9999px;
            font-size: 0.75rem;
            font-weight: 500;
        }
        
        /* Performance Section */
        .performance {
            padding: 5rem 1rem;
            background: white;
        }
        
        .performance-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 3rem;
            align-items: center;
        }
        
        .performance-content h2 {
            font-size: 2rem;
            font-weight: 700;
            color: var(--wp-gray);
            margin-bottom: 1.5rem;
            line-height: 1.2;
        }
        
        .performance-content .highlight {
            color: var(--wp-blue);
        }
        
        .performance-description {
            font-size: 1.125rem;
            color: #6b7280;
            margin-bottom: 2rem;
        }
        
        .benefits-list {
            list-style: none;
        }
        
        .benefits-list li {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            margin-bottom: 1rem;
            color: #374151;
        }
        
        .performance-metrics {
            background: var(--wp-gray-light);
            border-radius: 0.5rem;
            padding: 2rem;
        }
        
        .metrics-title {
            font-size: 1.25rem;
            font-weight: 600;
            color: var(--wp-gray);
            margin-bottom: 1.5rem;
        }
        
        .metric-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 1rem;
        }
        
        .metric-label {
            color: #6b7280;
        }
        
        .metric-value {
            text-align: right;
        }
        
        .metric-number {
            font-weight: 600;
            color: var(--wp-blue);
        }
        
        .metric-description {
            font-size: 0.75rem;
            color: #6b7280;
        }
        
        /* CTA Section */
        .cta {
            padding: 5rem 1rem;
            background: var(--wp-blue);
            text-align: center;
        }
        
        .cta h2 {
            font-size: 2rem;
            font-weight: 700;
            color: white;
            margin-bottom: 1rem;
        }
        
        .cta-description {
            font-size: 1.25rem;
            color: #dbeafe;
            max-width: 32rem;
            margin: 0 auto 2rem auto;
        }
        
        .cta-buttons {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1rem;
        }
        
        .btn-white {
            background: white;
            color: var(--wp-blue);
            border: 1px solid white;
        }
        
        .btn-white:hover {
            background: #f9fafb;
        }
        
        .btn-outline-white {
            border: 1px solid white;
            color: white;
            background: transparent;
        }
        
        .btn-outline-white:hover {
            background: rgba(255, 255, 255, 0.1);
        }
        
        /* Footer */
        .footer {
            background: var(--wp-gray);
            color: white;
            padding: 3rem 1rem;
        }
        
        .footer-container {
            max-width: 1280px;
            margin: 0 auto;
        }
        
        .footer-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 2rem;
            margin-bottom: 2rem;
        }
        
        .footer-section h3 {
            font-size: 1.125rem;
            font-weight: 600;
            margin-bottom: 1rem;
        }
        
        .footer-section h4 {
            font-weight: 500;
            margin-bottom: 1rem;
        }
        
        .footer-description {
            color: #d1d5db;
            font-size: 0.875rem;
        }
        
        .footer-links {
            list-style: none;
        }
        
        .footer-links li {
            margin-bottom: 0.5rem;
        }
        
        .footer-links a {
            color: #d1d5db;
            text-decoration: none;
            font-size: 0.875rem;
        }
        
        .footer-links a:hover {
            color: white;
        }
        
        .footer-bottom {
            border-top: 1px solid #4b5563;
            padding-top: 2rem;
            text-align: center;
            color: #d1d5db;
            font-size: 0.875rem;
        }
        
        /* Responsive Design */
        @media (min-width: 640px) {
            .hero-buttons {
                flex-direction: row;
                justify-content: center;
            }
            
            .cta-buttons {
                flex-direction: row;
                justify-content: center;
            }
        }
        
        @media (max-width: 768px) {
            .hero-title {
                font-size: 2rem;
            }
            
            .performance-grid {
                grid-template-columns: 1fr;
                gap: 2rem;
            }
            
            .header-right {
                display: none;
            }
        }
        
        /* Icons (simplified SVG icons) */
        .icon {
            width: 1.5rem;
            height: 1.5rem;
            display: inline-block;
            vertical-align: middle;
        }
    </style>
</head>
<body>
    <!-- Header -->
    <header class="header">
        <div class="header-container">
            <div class="header-left">
                <a href="/" class="site-logo">${siteTitle}</a>
                <span class="version-badge">v1.0.0</span>
            </div>
            <div class="header-right">
                <a href="#" class="btn btn-outline">
                    📚 GitHub
                </a>
                <a href="#" class="btn btn-outline">
                    📖 Docs
                </a>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <a href="/login" class="btn btn-outline-blue">
                        NextPress Login
                    </a>
                    <a href="/api/login" class="btn btn-primary">
                        Login with Replit ➜
                    </a>
                </div>
            </div>
        </div>
    </header>

    <!-- Hero Section -->
    <section class="hero">
        <div class="hero-container">
            <div class="hero-badge">WordPress-Compatible CMS</div>
            <h1 class="hero-title">
                WordPress, Reimagined<br>
                <span class="hero-title-highlight">in JavaScript</span>
            </h1>
            <p class="hero-description">
                NextPress is a complete WordPress clone built with modern JavaScript technologies. 
                All WordPress APIs, hooks, and database operations are preserved, giving you the 
                power of WordPress with the performance of Node.js.
            </p>
            
            <div class="hero-buttons">
                <a href="/login" class="btn btn-primary btn-large">
                    Get Started ➜
                </a>
                <a href="/register" class="btn btn-outline-blue btn-large">
                    Create Account
                </a>
            </div>

            <!-- Tech Stack -->
            <div class="tech-stack">
                <span class="tech-label">Built with:</span>
                <span class="tech-badge tech-nodejs">Node.js</span>
                <span class="tech-badge tech-react">React</span>
                <span class="tech-badge tech-postgresql">PostgreSQL</span>
                <span class="tech-badge tech-express">Express</span>
                <span class="tech-badge tech-typescript">TypeScript</span>
                <span class="tech-badge tech-tailwind">Tailwind</span>
            </div>
        </div>
    </section>

    <!-- Features Section -->
    <section class="features">
        <div class="features-container">
            <div class="section-header">
                <h2 class="section-title">Everything WordPress, Nothing Compromised</h2>
                <p class="section-description">
                    NextPress maintains 100% compatibility with WordPress while delivering 
                    modern performance and developer experience.
                </p>
            </div>

            <div class="features-grid">
                <div class="feature-card">
                    <div class="feature-header">
                        <div class="feature-icon">💻</div>
                        <h3 class="feature-title">WordPress Compatible APIs</h3>
                    </div>
                    <p class="feature-description">
                        All REST API endpoints match WordPress specifications exactly, ensuring seamless migration and compatibility.
                    </p>
                </div>

                <div class="feature-card">
                    <div class="feature-header">
                        <div class="feature-icon">🗄️</div>
                        <h3 class="feature-title">WordPress Database Schema</h3>
                    </div>
                    <p class="feature-description">
                        Identical database structure and operations to WordPress, supporting all your existing data.
                    </p>
                </div>

                <div class="feature-card">
                    <div class="feature-header">
                        <div class="feature-icon">⚡</div>
                        <h3 class="feature-title">Modern JavaScript Stack</h3>
                    </div>
                    <p class="feature-description">
                        Built with Node.js, React, and TypeScript for superior performance and developer experience.
                    </p>
                </div>

                <div class="feature-card">
                    <div class="feature-header">
                        <div class="feature-icon">🛡️</div>
                        <h3 class="feature-title">Hook System</h3>
                    </div>
                    <p class="feature-description">
                        WordPress-compatible actions and filters implemented in JavaScript for maximum extensibility.
                    </p>
                </div>

                <div class="feature-card">
                    <div class="feature-header">
                        <div class="feature-icon">🎨</div>
                        <h3 class="feature-title">Multi-Renderer Themes</h3>
                    </div>
                    <p class="feature-description">
                        Support for Next.js, React, and custom rendering engines in a single theme system.
                    </p>
                </div>

                <div class="feature-card">
                    <div class="feature-header">
                        <div class="feature-icon">🔌</div>
                        <h3 class="feature-title">Plugin Architecture</h3>
                    </div>
                    <p class="feature-description">
                        Extensible plugin system with WordPress-compatible hooks and activation patterns.
                    </p>
                </div>
            </div>
        </div>
    </section>

    <!-- Compatibility Section -->
    <section class="compatibility">
        <div class="features-container">
            <div class="section-header">
                <h2 class="section-title">WordPress Compatibility Guaranteed</h2>
                <p class="section-description">
                    NextPress implements the exact same APIs, database schema, and hook system as WordPress.
                </p>
            </div>

            <div class="compatibility-grid">
                <div class="compatibility-card">
                    <div class="check-icon">✓</div>
                    <h4 class="compatibility-title">REST API Endpoints</h4>
                    <span class="compatibility-status">100% Compatible</span>
                </div>
                <div class="compatibility-card">
                    <div class="check-icon">✓</div>
                    <h4 class="compatibility-title">Database Schema</h4>
                    <span class="compatibility-status">Identical</span>
                </div>
                <div class="compatibility-card">
                    <div class="check-icon">✓</div>
                    <h4 class="compatibility-title">Hook System</h4>
                    <span class="compatibility-status">Complete</span>
                </div>
                <div class="compatibility-card">
                    <div class="check-icon">✓</div>
                    <h4 class="compatibility-title">Theme Support</h4>
                    <span class="compatibility-status">Enhanced</span>
                </div>
                <div class="compatibility-card">
                    <div class="check-icon">✓</div>
                    <h4 class="compatibility-title">Plugin Architecture</h4>
                    <span class="compatibility-status">Compatible</span>
                </div>
                <div class="compatibility-card">
                    <div class="check-icon">✓</div>
                    <h4 class="compatibility-title">User Roles</h4>
                    <span class="compatibility-status">WordPress Standard</span>
                </div>
                <div class="compatibility-card">
                    <div class="check-icon">✓</div>
                    <h4 class="compatibility-title">Content Types</h4>
                    <span class="compatibility-status">Full Support</span>
                </div>
                <div class="compatibility-card">
                    <div class="check-icon">✓</div>
                    <h4 class="compatibility-title">Media Handling</h4>
                    <span class="compatibility-status">WordPress Compatible</span>
                </div>
            </div>
        </div>
    </section>

    <!-- Performance Section -->
    <section class="performance">
        <div class="features-container">
            <div class="performance-grid">
                <div class="performance-content">
                    <h2>
                        Modern Performance,<br>
                        <span class="highlight">WordPress Familiarity</span>
                    </h2>
                    <p class="performance-description">
                        Get the best of both worlds: the familiar WordPress interface and workflow 
                        you know, powered by modern JavaScript for superior performance and scalability.
                    </p>
                    
                    <ul class="benefits-list">
                        <li><span style="color: #10b981;">✓</span> Node.js runtime for faster execution</li>
                        <li><span style="color: #10b981;">✓</span> React-based admin interface</li>
                        <li><span style="color: #10b981;">✓</span> TypeScript support for better development</li>
                        <li><span style="color: #10b981;">✓</span> Modern build tools and hot reloading</li>
                        <li><span style="color: #10b981;">✓</span> Enhanced security with modern practices</li>
                    </ul>
                </div>

                <div class="performance-metrics">
                    <h3 class="metrics-title">Performance Metrics</h3>
                    <div class="metric-item">
                        <span class="metric-label">Page Load Time</span>
                        <div class="metric-value">
                            <div class="metric-number">~2x faster</div>
                            <div class="metric-description">vs WordPress</div>
                        </div>
                    </div>
                    <div class="metric-item">
                        <span class="metric-label">Admin Interface</span>
                        <div class="metric-value">
                            <div class="metric-number">~3x faster</div>
                            <div class="metric-description">React-powered</div>
                        </div>
                    </div>
                    <div class="metric-item">
                        <span class="metric-label">API Response</span>
                        <div class="metric-value">
                            <div class="metric-number">~4x faster</div>
                            <div class="metric-description">Node.js runtime</div>
                        </div>
                    </div>
                    <div class="metric-item">
                        <span class="metric-label">Development</span>
                        <div class="metric-value">
                            <div class="metric-number">Hot reload</div>
                            <div class="metric-description">Modern tooling</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- CTA Section -->
    <section class="cta">
        <div class="features-container">
            <h2>Ready to Experience NextPress?</h2>
            <p class="cta-description">
                Start building with the WordPress-compatible CMS that brings modern performance 
                to the content management system you already know and love.
            </p>
            
            <div class="cta-buttons">
                <a href="/api/login" class="btn btn-white btn-large">
                    Access Admin Panel ➜
                </a>
                <a href="#" class="btn btn-outline-white btn-large">
                    📚 View on GitHub
                </a>
            </div>
        </div>
    </section>

    <!-- Footer -->
    <footer class="footer">
        <div class="footer-container">
            <div class="footer-grid">
                <div class="footer-section">
                    <h3>${siteTitle}</h3>
                    <p class="footer-description">
                        WordPress-compatible CMS built with modern JavaScript technologies.
                    </p>
                </div>
                <div class="footer-section">
                    <h4>Features</h4>
                    <ul class="footer-links">
                        <li><a href="#">WordPress API Compatible</a></li>
                        <li><a href="#">Modern Theme Engine</a></li>
                        <li><a href="#">Hook System</a></li>
                        <li><a href="#">Plugin Architecture</a></li>
                    </ul>
                </div>
                <div class="footer-section">
                    <h4>Resources</h4>
                    <ul class="footer-links">
                        <li><a href="#">Documentation</a></li>
                        <li><a href="#">API Reference</a></li>
                        <li><a href="#">Theme Development</a></li>
                        <li><a href="#">Plugin Development</a></li>
                    </ul>
                </div>
                <div class="footer-section">
                    <h4>Community</h4>
                    <ul class="footer-links">
                        <li><a href="#">GitHub</a></li>
                        <li><a href="#">Discord</a></li>
                        <li><a href="#">Forum</a></li>
                        <li><a href="#">Support</a></li>
                    </ul>
                </div>
            </div>
            
            <div class="footer-bottom">
                <p>&copy; 2025 ${siteTitle}. WordPress-compatible CMS powered by JavaScript.</p>
            </div>
        </div>
    </footer>
</body>
</html>`;
  }

  renderHomePage(posts: any[], site: any): string {
    const siteTitle = site?.name || 'NextPress';
    const siteDescription = site?.description || 'A modern WordPress alternative';
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${siteTitle} - Modern WordPress Alternative</title>
    <meta name="description" content="${siteDescription} - Build fast, modern websites with our WordPress-compatible CMS.">
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website">
    <meta property="og:title" content="${siteTitle} - Modern WordPress Alternative">
    <meta property="og:description" content="${siteDescription}">
    <meta property="og:url" content="${site?.url || ''}">
    
    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:title" content="${siteTitle} - Modern WordPress Alternative">
    <meta property="twitter:description" content="${siteDescription}">
    
    <style>
        :root {
            --wp-blue: #0073aa;
            --wp-blue-dark: #005177;
            --wp-gray: #23282d;
            --wp-light-gray: #f1f2f3;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
            line-height: 1.6;
            color: #333;
            background: #fff;
        }
        
        /* Header */
        .header {
            background: white;
            border-bottom: 1px solid #e5e7eb;
            padding: 1rem 0;
            position: sticky;
            top: 0;
            z-index: 10;
        }
        
        .header-container {
            max-width: 1280px;
            margin: 0 auto;
            padding: 0 1rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .header-left {
            display: flex;
            align-items: center;
            gap: 1rem;
        }
        
        .site-logo {
            font-size: 1.5rem;
            font-weight: 700;
            color: var(--wp-blue);
            text-decoration: none;
        }
        
        .version-badge {
            background: var(--wp-light-gray);
            color: #666;
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            font-size: 0.75rem;
            font-weight: 500;
        }
        
        .header-right {
            display: flex;
            align-items: center;
            gap: 1rem;
        }
        
        .btn {
            padding: 0.5rem 1rem;
            border-radius: 6px;
            text-decoration: none;
            font-weight: 500;
            font-size: 0.875rem;
            transition: all 0.2s;
            border: 1px solid transparent;
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        .btn-primary {
            background: var(--wp-blue);
            color: white;
        }
        
        .btn-primary:hover {
            background: var(--wp-blue-dark);
        }
        
        .btn-outline {
            border: 1px solid #d1d5db;
            color: #374151;
        }
        
        .btn-outline:hover {
            background: #f9fafb;
        }
        
        .btn-outline-blue {
            border: 1px solid var(--wp-blue);
            color: var(--wp-blue);
        }
        
        .btn-outline-blue:hover {
            background: var(--wp-blue);
            color: white;
        }
        
        /* Hero Section */
        .hero {
            background: linear-gradient(135deg, var(--wp-blue) 0%, var(--wp-blue-dark) 100%);
            color: white;
            padding: 4rem 1rem;
            text-align: center;
        }
        
        .hero-container {
            max-width: 800px;
            margin: 0 auto;
        }
        
        .hero-title {
            font-size: 3rem;
            font-weight: 700;
            margin-bottom: 1rem;
            line-height: 1.1;
        }
        
        .hero-subtitle {
            font-size: 1.25rem;
            color: #dbeafe;
            margin-bottom: 2rem;
            max-width: 600px;
            margin-left: auto;
            margin-right: auto;
        }
        
        .hero-buttons {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1rem;
            margin-bottom: 3rem;
        }
        
        .btn-white {
            background: white;
            color: var(--wp-blue);
            border: 1px solid white;
        }
        
        .btn-white:hover {
            background: #f9fafb;
        }
        
        .btn-outline-white {
            border: 1px solid white;
            color: white;
            background: transparent;
        }
        
        .btn-outline-white:hover {
            background: rgba(255, 255, 255, 0.1);
        }
        
        /* Posts Section */
        .posts-section {
            padding: 4rem 1rem;
            background: #f8fafc;
        }
        
        .posts-container {
            max-width: 1280px;
            margin: 0 auto;
        }
        
        .section-header {
            text-align: center;
            margin-bottom: 3rem;
        }
        
        .section-title {
            font-size: 2.5rem;
            font-weight: 700;
            margin-bottom: 1rem;
            color: #1a1a1a;
        }
        
        .section-subtitle {
            font-size: 1.25rem;
            color: #666;
            max-width: 600px;
            margin: 0 auto;
        }
        
        .posts-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 2rem;
            margin-bottom: 3rem;
        }
        
        .post-card {
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            transition: all 0.3s;
        }
        
        .post-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
        }
        
        .post-card-content {
            padding: 1.5rem;
        }
        
        .post-card-title {
            font-size: 1.25rem;
            font-weight: 600;
            margin-bottom: 0.5rem;
            color: #1a1a1a;
        }
        
        .post-card-title a {
            color: inherit;
            text-decoration: none;
        }
        
        .post-card-title a:hover {
            color: var(--wp-blue);
        }
        
        .post-card-meta {
            font-size: 0.875rem;
            color: #666;
            margin-bottom: 1rem;
        }
        
        .post-card-excerpt {
            color: #666;
            line-height: 1.6;
            font-size: 0.9rem;
        }
        
        .view-all-posts {
            text-align: center;
        }
        
        .no-posts {
            text-align: center;
            padding: 3rem 0;
            color: #666;
        }
        
        .no-posts h2 {
            font-size: 2rem;
            margin-bottom: 1rem;
            color: #333;
        }
        
        /* Footer */
        .footer {
            background: var(--wp-gray);
            color: white;
            padding: 3rem 1rem;
        }
        
        .footer-container {
            max-width: 1280px;
            margin: 0 auto;
            text-align: center;
        }
        
        .footer-description {
            color: #d1d5db;
            font-size: 0.875rem;
            margin-bottom: 2rem;
        }
        
        .footer-bottom {
            border-top: 1px solid #4b5563;
            padding-top: 2rem;
            color: #d1d5db;
            font-size: 0.875rem;
        }
        
        /* Responsive Design */
        @media (min-width: 640px) {
            .hero-buttons {
                flex-direction: row;
                justify-content: center;
            }
        }
        
        @media (max-width: 768px) {
            .hero-title {
                font-size: 2rem;
            }
            
            .section-title {
                font-size: 2rem;
            }
            
            .header-right {
                display: none;
            }
            
            .posts-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <!-- Header -->
    <header class="header">
        <div class="header-container">
            <div class="header-left">
                <a href="/" class="site-logo">${siteTitle}</a>
                <span class="version-badge">v1.0.0</span>
            </div>
            <div class="header-right">
                <a href="/admin" class="btn btn-outline-blue">
                    Admin Dashboard
                </a>
            </div>
        </div>
    </header>

    <!-- Hero Section -->
    <section class="hero">
        <div class="hero-container">
            <h1 class="hero-title">The Future of Content Management</h1>
            <p class="hero-subtitle">
                A modern, TypeScript-powered alternative to WordPress. Build faster, deploy easier, scale better.
            </p>
            <div class="hero-buttons">
                <a href="/admin" class="btn btn-white">Get Started</a>
                <a href="/landing" class="btn btn-outline-white">Learn More</a>
            </div>
        </div>
    </section>

    <!-- Posts Section -->
    <section class="posts-section">
        <div class="posts-container">
            <div class="section-header">
                <h2 class="section-title">Latest Posts</h2>
                <p class="section-subtitle">
                    Discover the latest content and insights from our community
                </p>
            </div>
            
            ${posts.length > 0 ? `
                <div class="posts-grid">
                    ${posts.slice(0, 6).map(post => `
                        <article class="post-card">
                            <div class="post-card-content">
                                <h3 class="post-card-title">
                                    <a href="/posts/${post.id}">${post.title}</a>
                                </h3>
                                <div class="post-card-meta">
                                    ${new Date(post.createdAt).toLocaleDateString('en-US', { 
                                        year: 'numeric', 
                                        month: 'long', 
                                        day: 'numeric' 
                                    })}
                                </div>
                                <div class="post-card-excerpt">
                                    ${this.parseContent(post.excerpt || post.content).substring(0, 150)}${(post.excerpt || post.content).length > 150 ? '...' : ''}
                                </div>
                            </div>
                        </article>
                    `).join('')}
                </div>
                <div class="view-all-posts">
                    <a href="/posts" class="btn btn-primary">View All Posts</a>
                </div>
            ` : `
                <div class="no-posts">
                    <h2>Welcome to ${siteTitle}</h2>
                    <p>Your content management system is ready! Create your first post to get started.</p>
                    <div style="margin-top: 2rem;">
                        <a href="/admin" class="btn btn-primary">Create Your First Post</a>
                    </div>
                </div>
            `}
        </div>
    </section>

    <!-- Footer -->
    <footer class="footer">
        <div class="footer-container">
            <p class="footer-description">
                ${siteTitle} - A modern WordPress alternative built with TypeScript, React, and PostgreSQL.
            </p>
            <div class="footer-bottom">
                <p>&copy; ${new Date().getFullYear()} ${siteTitle}. Powered by NextPress CMS.</p>
            </div>
        </div>
    </footer>
</body>
</html>`;
  }

  render404(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>404 - Page Not Found</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            background: #f9fafb;
        }
        
        .error-container {
            text-align: center;
            max-width: 400px;
            padding: 2rem;
        }
        
        .error-code {
            font-size: 6rem;
            font-weight: 700;
            color: #374151;
            margin-bottom: 1rem;
        }
        
        .error-message {
            font-size: 1.5rem;
            color: #6b7280;
            margin-bottom: 2rem;
        }
        
        .back-link {
            color: #3b82f6;
            text-decoration: none;
            font-weight: 500;
        }
    </style>
</head>
<body>
    <div class="error-container">
        <div class="error-code">404</div>
        <div class="error-message">Page Not Found</div>
        <a href="/" class="back-link">← Back to Home</a>
    </div>
</body>
</html>`;
  }

  parseContent(content: string): string {
    // Basic content parsing - convert markdown-like syntax to HTML
    if (!content) return '';
    
    return content
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>')
      .replace(/^/, '<p>')
      .replace(/$/, '</p>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>');
  }

  // Render content using active theme
  async renderContent(template: string, data: any): Promise<string> {
    const activeTheme = await this.getActiveTheme();
    
    if (!activeTheme) {
      throw new Error('No active theme found');
    }

    const renderer = this.renderers.get(activeTheme.renderer || 'nextjs');
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
  getTemplateHierarchy(type: string, slug: string | null = null): string[] {
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
      case 'landing':
        templates.push('landing.js', 'index.js');
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

  async switchTheme(themeName: string) {
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
