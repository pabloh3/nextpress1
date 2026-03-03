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

// Page version history entry (page-level, not per block)
export interface PageVersionEntry {
	version: number;
	updatedAt: string; // ISO timestamp
	blocks: BlockConfig[];
	authorId?: string;
	message?: string;
}

// Page types
export type Page = typeof pages.$inferSelect & {
	version?: number;
	history?: PageVersionEntry[];
};
export type NewPage = typeof pages.$inferInsert & {
	version?: number;
	history?: PageVersionEntry[];
};
export type PageDraft = Page & { localVersion?: number };

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
 * A single design token entry stored on block.other.tokenMap.
 * Represents either a Tailwind token selection (value + variant) or a custom raw value (style).
 */
export interface TokenEntry {
  /** CSS property name in camelCase: "backgroundColor", "paddingTop", "fontSize" */
  property: string;
  /** Base token key: "blue", "5", "lg". Empty string when custom mode is active. */
  value: string;
  /** Shade or variant: "500", null for single-value tokens */
  variant: string | null;
  /** Tailwind utility prefix hint for UI display: "bg", "pt", "text" */
  alias: string;
  /** Optional state or responsive modifier: "hover", "md", "focus" */
  modifier?: string;
  /** Catch-all for values that don't fit the structured fields */
  other?: string;
  /** Custom raw value set when user picks custom mode: "23", "#ff5500", "1.5" */
  style?: string;
  /** Category for unit resolution: "spacing", "font", "dimension", "border" */
  unitCategory?: string;
}

/** Entry animation driven by AOS scroll detection + Animate.css keyframes */
export interface EntryAnimation {
  /** Animate.css class name without prefix: "fadeInUp", "bounceIn", "zoomIn" */
  name: string;
  /** Animation duration in ms (default: 1000) */
  duration?: number;
  /** Animation delay in ms (default: 0) */
  delay?: number;
  /** Play the animation only once (default: true) */
  once?: boolean;
}

/** Hover animation triggered by CSS :hover, using Animate.css keyframes */
export interface HoverAnimation {
  /** Animate.css class name without prefix: "pulse", "rubberBand", "tada" */
  name: string;
}

/** Continuous loop animation using Animate.css keyframes with infinite iteration */
export interface LoopAnimation {
  /** Animate.css class name without prefix: "bounce", "heartBeat", "swing" */
  name: string;
}

/** Container for all animation categories on a single block */
export interface BlockAnimation {
  entry?: EntryAnimation;
  hover?: HoverAnimation;
  loop?: LoopAnimation;
}

/**
 * Discriminated union for block content
 * Each content type has a unique 'kind' discriminator for type-safe handling
 */
export type BlockContent =
	| { kind: "text"; value: string; textAlign?: string; dropCap?: boolean }
	| { kind: "markdown"; value: string; textAlign?: string }
	| {
			kind: "media";
			url: string;
			alt?: string;
			caption?: string;
			mediaType: "image" | "video" | "audio";
	  }
	| { kind: "html"; value: string; sanitized: boolean }
	| { kind: "structured"; data: Record<string, unknown> } // For complex blocks like tables, columns
	| { kind: "empty" } // Explicitly empty block
	| undefined; // No content set

/**
 * Core block configuration for PageBuilder runtime
 * Used during editing and rendering
 * 
 * Blocks are persisted to database using BlockConfig directly (in posts.blocks, templates.blocks, pages.blocks).
 * Version tracking happens at the page level via PageVersionEntry, not at individual block level.
 * This ensures atomic rollback of entire page state rather than per-block versioning.
 */
export interface BlockConfig {
	// Core identity & type
	id: string; // Unique instance ID
	name: string; // Canonical machine key (e.g., 'core/heading', 'core/paragraph')
	type: "block" | "container"; // Structural kind: can this block have children?
	parentId: string | null; // Parent block ID or null for root-level blocks

	// Display metadata
	label?: string; // User-facing display name (e.g., 'Heading', 'Two Columns')
	category?: "basic" | "layout" | "media" | "advanced";

	// Content - Discriminated union for type-safe handling
	// - For text blocks: { kind: 'text', value: '...' }
	// - For media blocks: { kind: 'media', url: '...', mediaType: 'image' }
	// - For containers: { kind: 'structured', data: { gap, alignment, ... } }
	content: BlockContent;

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
		/** Design token selections keyed by property name (or "modifier:property" for modifier entries) */
		tokenMap?: Record<string, TokenEntry>;
		/** Active unit per category: { spacing: "px", font: "rem" } */
		units?: Record<string, string>;
		/** Animation configuration for entry (scroll), hover, and loop categories */
		animation?: BlockAnimation;
	};
}
