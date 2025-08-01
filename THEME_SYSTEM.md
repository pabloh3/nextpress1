# NextPress Theme System

NextPress now supports a flexible theme-based rendering system that allows companies to switch between different rendering technologies (React, Next.js, Vue.js, etc.) by simply changing the active theme.

## Architecture Overview

### Theme Renderers
The system supports multiple renderer types:
- **Next.js**: Full Next.js App Router support with SSR
- **React**: React-based rendering with Vite
- **Vue.js**: Vue.js-based rendering (planned)
- **Custom**: Custom rendering implementations

### Theme Structure
```
themes/
├── nextjs-theme/          # Next.js-based theme
│   ├── app/              # Next.js App Router
│   ├── components/       # Reusable components
│   ├── lib/             # Utilities
│   └── package.json     # Theme dependencies
├── react-theme/          # React-based theme
│   ├── src/             # React components
│   └── package.json     # Theme dependencies
└── vue-theme/           # Vue.js-based theme (planned)
```

## How It Works

### 1. Theme Registration
Themes are registered in the database with a specific renderer type:

```typescript
{
  name: 'Next.js Theme',
  description: 'A modern Next.js-based theme',
  renderer: 'nextjs',
  isActive: true,
  config: {
    siteName: 'NextPress',
    siteDescription: 'A modern WordPress alternative'
  }
}
```

### 2. Theme Activation
When a theme is activated, the system:
- Stops any running processes from the previous theme
- Starts the new theme's development server (if needed)
- Updates the active theme in the database

### 3. Content Rendering
When rendering content, the system:
1. Gets the active theme
2. Determines the appropriate renderer
3. Renders content using the theme's renderer
4. Falls back to a default renderer if needed

## API Endpoints

### Theme Management
- `GET /api/themes` - List all themes
- `GET /api/themes/active` - Get active theme
- `POST /api/themes/:id/activate` - Activate a theme
- `GET /api/themes/renderers` - List available renderers

### Public Routes
- `GET /` - Home page (theme-rendered)
- `GET /home` - Home page (theme-rendered)
- `GET /posts/:id` - Single post (theme-rendered)
- `GET /pages/:id` - Single page (theme-rendered)

## Creating a New Theme

### 1. Create Theme Directory
```bash
mkdir themes/my-theme
cd themes/my-theme
```

### 2. Set Up Dependencies
Create a `package.json` with the necessary dependencies for your rendering technology.

### 3. Implement Components
Create the necessary components for:
- Home page
- Single post
- Single page
- Header/Footer
- Error pages

### 4. Register Theme
Add the theme to the database with the appropriate renderer type.

## Current Themes

### Next.js Theme (`themes/nextjs-theme/`)
- **Renderer**: `nextjs`
- **Features**: Full Next.js App Router support, SSR, Tailwind CSS
- **Status**: ✅ Implemented

### React Theme (`themes/react-theme/`)
- **Renderer**: `react`
- **Features**: React with Vite, Tailwind CSS
- **Status**: 🚧 In Progress

## Development

### Starting Theme Development
```bash
# Start Next.js theme development
npm run theme:dev

# Build theme for production
npm run theme:build

# Start theme in production
npm run theme:start
```

### Theme Switching
Themes can be switched via the admin interface or API:
```bash
curl -X POST http://localhost:3000/api/themes/1/activate
```

## Benefits

1. **Technology Flexibility**: Companies can choose their preferred rendering technology
2. **Easy Migration**: Switch from React to Next.js without changing content
3. **Performance**: Each theme can optimize for its specific technology
4. **Maintainability**: Themes are isolated and can be developed independently
5. **WordPress Compatibility**: Maintains similar architecture to WordPress themes

## Future Enhancements

- [ ] Vue.js theme implementation
- [ ] Theme marketplace
- [ ] Theme customization interface
- [ ] Performance optimization
- [ ] SEO optimization per theme
- [ ] Mobile-specific themes 