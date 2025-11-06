import type {
	users,
	comments,
	sites,
	roles,
	userRoles,
	pages,
	templates,
	themes,
	plugins,
	options,
	blogs,
	posts,
	media,
	sessions,
} from "./schema";

// User types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

// Comment types
export type Comment = typeof comments.$inferSelect;
export type NewComment = typeof comments.$inferInsert;

// Site types
export type Site = typeof sites.$inferSelect;
export type NewSite = typeof sites.$inferInsert;

// Role types
export type Role = typeof roles.$inferSelect;
export type NewRole = typeof roles.$inferInsert;

// UserRole types
export type UserRole = typeof userRoles.$inferSelect;
export type NewUserRole = typeof userRoles.$inferInsert;

// Page types
export type Page = typeof pages.$inferSelect;
export type NewPage = typeof pages.$inferInsert;

// Template types
export type Template = typeof templates.$inferSelect;
export type NewTemplate = typeof templates.$inferInsert;

// Theme types
export type Theme = typeof themes.$inferSelect;
export type NewTheme = typeof themes.$inferInsert;

// Plugin types
export type Plugin = typeof plugins.$inferSelect;
export type NewPlugin = typeof plugins.$inferInsert;

// Option types
export type Option = typeof options.$inferSelect;
export type NewOption = typeof options.$inferInsert;

// Blog types
export type Blog = typeof blogs.$inferSelect;
export type NewBlog = typeof blogs.$inferInsert;

// Post types
export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;

// Media types
export type Media = typeof media.$inferSelect;
export type NewMedia = typeof media.$inferInsert;

// Session types
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;

// Block configuration types

/**
 * Core block configuration for PageBuilder runtime
 * Used during editing and rendering
 */
export interface BlockConfig {
  // Core identity & type
  id: string;
  name: string; // Internal name: "heading", "text", "columns", "group"
  type: "block" | "container"; // Explicit union type
  parentId: string | null; // Parent block ID or null for root-level blocks
  
  // Display metadata
  displayName?: string; // UI-friendly name: "Heading", "Two Columns"
  category?: "basic" | "layout" | "media" | "advanced";
  
  // Content
  // - For containers: configuration like {gap, alignment, direction}
  // - For blocks: data like {text, url, level}
  content: Record<string, any>;
  
  // Styling (three layers: typed styles → block dev CSS → user CSS)
  styles?: React.CSSProperties; // Typed inline styles: {marginTop: "4rem", fontSize: "2rem"}
  customCss?: string; // CSS string defined by block developer
  
  // Container support (ONLY for type: "container")
  // Regular blocks (type: "block") should NOT have children
  children?: BlockConfig[];
  
  // Configuration
  settings?: Record<string, any>; // Block settings/options
  
  // Compatibility & rendering
  requires?: string; // Minimal NextPress version: "^4.0", ">=3.2.0", "~5.1"
  isReactive?: boolean; // If true, renders as React component in renderer
  
  // User overrides & extensions
  other?: {
    css?: string; // Custom CSS string added by user in editor
    classNames?: string; // CSS class names
    js?: string; // Custom JavaScript
    html?: string; // Custom HTML override
    attributes?: Record<string, any>; // HTML attributes
    metadata?: Record<string, any>; // Any additional custom data
  };
}

/**
 * Saved block configuration with version history & authorship
 * Used when persisting to database (posts.blocks, templates.blocks, pages.blocks)
 * Note: Version history types defined but not implemented yet (future feature)
 */
export interface SavedBlockConfig extends BlockConfig {
  version: number; // Current version number (increments on each save)
  previousState?: SavedBlockConfig; // Full N-1 version for undo/redo
  authorId: string; // UUID of user who created/owns this block
  createdAt: string; // ISO timestamp when first created
  updatedAt: string; // ISO timestamp when last updated
}
