import type {
	comments,
	users,
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
} from "./schema";
import type {
	createUserSchema,
	insertCommentSchema,
	insertUserSchema,
	updateUserSchema,
	insertSiteSchema,
	updateSiteSchema,
	insertRoleSchema,
	updateRoleSchema,
	insertUserRoleSchema,
	insertPageSchema,
	updatePageSchema,
	insertPostSchema,
	updatePostSchema,
	insertBlogSchema,
	updateBlogSchema,
	insertTemplateSchema,
	updateTemplateSchema,
	insertThemeSchema,
	updateThemeSchema,
	insertPluginSchema,
	updatePluginSchema,
	insertOptionSchema,
	insertBlockSchema,
	updateBlockSchema,
	insertMediaSchema,
	updateMediaSchema,
} from "./zod-schema";
import type { z } from "zod";

// User types
export type User = typeof users.$inferSelect;
export type UpsertUser = typeof users.$inferInsert;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type CreateUser = z.infer<typeof createUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;

// Comment types
export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;

// Site types
export type Site = typeof sites.$inferSelect;
export type UpsertSite = typeof sites.$inferInsert;
export type InsertSite = z.infer<typeof insertSiteSchema>;
export type UpdateSite = z.infer<typeof updateSiteSchema>;

// Role types
export type Role = typeof roles.$inferSelect;
export type UpsertRole = typeof roles.$inferInsert;
export type InsertRole = z.infer<typeof insertRoleSchema>;
export type UpdateRole = z.infer<typeof updateRoleSchema>;

// UserRole types
export type UserRole = typeof userRoles.$inferSelect;
export type UpsertUserRole = typeof userRoles.$inferInsert;
export type InsertUserRole = z.infer<typeof insertUserRoleSchema>;

// Page types
export type Page = typeof pages.$inferSelect;
export type UpsertPage = typeof pages.$inferInsert;
export type InsertPage = z.infer<typeof insertPageSchema>;
export type UpdatePage = z.infer<typeof updatePageSchema>;

// Template types
export type Template = typeof templates.$inferSelect;
export type UpsertTemplate = typeof templates.$inferInsert;
export type InsertTemplate = z.infer<typeof insertTemplateSchema>;
export type UpdateTemplate = z.infer<typeof updateTemplateSchema>;

// Theme types
export type Theme = typeof themes.$inferSelect;
export type UpsertTheme = typeof themes.$inferInsert;
export type InsertTheme = z.infer<typeof insertThemeSchema>;
export type UpdateTheme = z.infer<typeof updateThemeSchema>;

// Plugin types
export type Plugin = typeof plugins.$inferSelect;
export type UpsertPlugin = typeof plugins.$inferInsert;
export type InsertPlugin = z.infer<typeof insertPluginSchema>;
export type UpdatePlugin = z.infer<typeof updatePluginSchema>;

// Option types
export type Option = typeof options.$inferSelect;
export type UpsertOption = typeof options.$inferInsert;
export type InsertOption = z.infer<typeof insertOptionSchema>;

// Blog types
export type Blog = typeof blogs.$inferSelect;
export type UpsertBlog = typeof blogs.$inferInsert;
export type InsertBlog = z.infer<typeof insertBlogSchema>;
export type UpdateBlog = z.infer<typeof updateBlogSchema>;

// Post types
export type Post = typeof posts.$inferSelect;
export type UpsertPost = typeof posts.$inferInsert;
export type InsertPost = z.infer<typeof insertPostSchema>;
export type UpdatePost = z.infer<typeof updatePostSchema>;

// Block types
export type Block = typeof blocks.$inferSelect;
export type UpsertBlock = typeof blocks.$inferInsert;
export type InsertBlock = z.infer<typeof insertBlockSchema>;
export type UpdateBlock = z.infer<typeof updateBlockSchema>;

// Media types
export type Media = typeof media.$inferSelect;
export type UpsertMedia = typeof media.$inferInsert;
export type InsertMedia = z.infer<typeof insertMediaSchema>;
export type UpdateMedia = z.infer<typeof updateMediaSchema>;
