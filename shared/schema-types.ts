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
	blocks,
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

// Block types
export type Block = typeof blocks.$inferSelect;
export type NewBlock = typeof blocks.$inferInsert;

// Media types
export type Media = typeof media.$inferSelect;
export type NewMedia = typeof media.$inferInsert;

// Session types
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
