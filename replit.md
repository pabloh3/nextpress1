# NextPress - WordPress-Compatible CMS

## Overview

NextPress is a modern, TypeScript-based content management system that provides full WordPress API compatibility while leveraging modern web technologies. Built with React, Node.js, and PostgreSQL, it offers a familiar WordPress experience with improved performance and developer experience.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: TanStack React Query for server state
- **Routing**: Wouter for client-side routing
- **Build Tool**: Vite for development and bundling

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **API Design**: RESTful endpoints matching WordPress REST API specification
- **Session Management**: Express sessions with PostgreSQL store
- **Authentication**: OpenID Connect (Replit Auth) integration

### Database Layer
- **Primary Database**: PostgreSQL via Neon serverless
- **ORM**: Drizzle ORM with type-safe queries
- **Schema**: WordPress-compatible table structure (users, posts, comments, themes, plugins, options)
- **Migrations**: Drizzle Kit for schema management

## Key Components

### Core Systems
1. **Hook System** (`server/hooks.ts`)
   - WordPress-compatible actions and filters
   - Priority-based execution order
   - Error handling for hook callbacks

2. **Theme System** (`server/themes.ts`)
   - Multi-renderer support (React, Next.js, custom)
   - Theme activation and management
   - WordPress-style template hierarchy
   - Full Next.js-style rendering with SEO optimization
   - Live post/page rendering at `/posts/:id` and `/pages/:id`

3. **Storage Layer** (`server/storage.ts`)
   - Abstracted database operations
   - WordPress-compatible CRUD operations
   - Type-safe database interactions

4. **Authentication** (`server/replitAuth.ts`)
   - OpenID Connect integration
   - Session-based authentication
   - User management with WordPress roles

### Frontend Components
- **Admin Interface**: WordPress-style admin panel with sidebar navigation
- **Post Editor**: Rich text editing for posts and pages
- **Media Library**: Complete file upload system with drag & drop
- **Theme Management**: Visual theme browser and activation
- **Settings Management**: Site configuration and options
- **Dashboard**: Analytics and quick actions

### Theme Rendering
- **Next.js Theme**: Professional rendering system with modern styling
- **SEO Optimization**: Complete meta tags, Open Graph, and Twitter cards
- **Responsive Design**: Mobile-first approach with media queries
- **Content Parsing**: Markdown-style formatting support

## Data Flow

1. **Request Processing**: Express middleware handles authentication and logging
2. **API Routing**: WordPress-compatible REST endpoints process requests
3. **Hook Execution**: Actions and filters modify request/response data
4. **Database Operations**: Drizzle ORM executes type-safe queries
5. **Response Generation**: JSON responses matching WordPress API format

## External Dependencies

### Core Dependencies
- **Database**: Neon PostgreSQL serverless
- **Authentication**: Replit OpenID Connect
- **UI Components**: Radix UI primitives via shadcn/ui
- **State Management**: TanStack React Query
- **Validation**: Zod schemas with Drizzle integration

### Development Tools
- **Testing**: Jest for server-side testing
- **Build**: Vite for frontend, esbuild for backend
- **Code Quality**: TypeScript strict mode
- **Styling**: PostCSS with Tailwind CSS

## Deployment Strategy

### Production Build
- Frontend: Vite builds optimized React app to `dist/public`
- Backend: esbuild bundles Node.js server to `dist/index.js`
- Static Assets: Served directly by Express in production

### Development Environment
- Hot Module Replacement via Vite dev server
- Express middleware mode for API integration
- TypeScript compilation checking
- Automatic database schema synchronization

### Environment Configuration
- Database connection via `DATABASE_URL`
- Session security via `SESSION_SECRET`
- OIDC configuration via `ISSUER_URL` and `REPL_ID`
- Development vs production mode detection

The system prioritizes WordPress compatibility while providing modern development experience, allowing existing WordPress users to migrate seamlessly while benefiting from improved performance and type safety.