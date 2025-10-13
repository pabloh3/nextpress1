import { sql, relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  serial,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table (WordPress compatible)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  username: varchar("username").unique().notNull(),
  password: varchar("password"),
  role: varchar("role").default("subscriber"), // administrator, editor, author, contributor, subscriber
  status: varchar("status").default("active"), // active, inactive, pending
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Posts table (WordPress compatible)
export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content"),
  excerpt: text("excerpt"),
  slug: varchar("slug").unique().notNull(),
  status: varchar("status").default("draft"), // publish, draft, private, trash
  type: varchar("type").default("post"), // post, page
  authorId: varchar("author_id").references(() => users.id).notNull(),
  featuredImage: varchar("featured_image"),
  publishedAt: timestamp("published_at"),
  
  // Page Builder fields
  builderData: jsonb("builder_data"), // Page builder content (blocks)
  usePageBuilder: boolean("use_page_builder").default(false), // Whether to use page builder or classic editor
  templateId: integer("template_id").references(() => templates.id), // Associated template
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Comments table (WordPress compatible)
export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").references(() => posts.id).notNull(),
  authorId: varchar("author_id").references(() => users.id),
  authorName: varchar("author_name"),
  authorEmail: varchar("author_email"),
  content: text("content").notNull(),
  status: varchar("status").default("pending"), // approved, pending, spam, trash
  parentId: integer("parent_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  parentReference: index("idx_comments_parent").on(table.parentId),
}));

// Themes table
export const themes = pgTable("themes", {
  id: serial("id").primaryKey(),
  name: varchar("name").unique().notNull(),
  description: text("description"),
  version: varchar("version").default("1.0.0"),
  author: varchar("author"),
  renderer: varchar("renderer").default("react"), // react, nextjs, custom
  isActive: boolean("is_active").default(false),
  config: jsonb("config"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Plugins table
export const plugins = pgTable("plugins", {
  id: serial("id").primaryKey(),
  name: varchar("name").unique().notNull(),
  description: text("description"),
  version: varchar("version").default("1.0.0"),
  author: varchar("author"),
  isActive: boolean("is_active").default(false),
  config: jsonb("config"),
  hooks: jsonb("hooks"), // Array of hook names this plugin registers
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Media table (WordPress compatible)
export const media = pgTable("media", {
  id: serial("id").primaryKey(),
  filename: varchar("filename").notNull(),
  originalName: varchar("original_name").notNull(),
  mimeType: varchar("mime_type").notNull(),
  size: integer("size").notNull(), // Size in bytes
  url: varchar("url").notNull(),
  alt: varchar("alt"),
  caption: text("caption"),
  description: text("description"),
  authorId: varchar("author_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Options table (WordPress compatible)
export const options = pgTable("options", {
  id: serial("id").primaryKey(),
  name: varchar("name").unique().notNull(),
  value: text("value"),
  autoload: boolean("autoload").default(true),
});

// Page Builder Templates table
export const templates = pgTable("templates", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  type: varchar("type").notNull(), // 'header', 'footer', 'page', 'post', 'popup'
  description: text("description"),
  blocks: jsonb("blocks").notNull().default([]), // Array of block configurations
  settings: jsonb("settings").default({}), // Template-level settings
  customHtml: text("custom_html"), // Custom HTML content
  customCss: text("custom_css"), // Custom CSS
  customJs: text("custom_js"), // Custom JavaScript
  isGlobal: boolean("is_global").default(false), // If true, applies to all pages
  // Application conditions (Elementor-style)
  applyTo: varchar("apply_to").default("all"), // 'all', 'specific', 'exclude'
  conditions: jsonb("conditions").default([]), // Array of condition objects
  priority: integer("priority").default(0), // Higher priority templates override lower ones
  isActive: boolean("is_active").default(true),
  authorId: varchar("author_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Page Builder Blocks table (for reusable blocks)
export const blocks = pgTable("blocks", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  type: varchar("type").notNull(), // 'text', 'heading', 'image', 'button', 'video', 'spacer', 'divider', etc.
  config: jsonb("config").notNull(), // Block configuration and content
  styles: jsonb("styles").default({}), // CSS styles
  customCss: text("custom_css"), // Custom CSS code
  isReusable: boolean("is_reusable").default(false),
  authorId: varchar("author_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
  comments: many(comments),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  author: one(users, { fields: [posts.authorId], references: [users.id] }),
  comments: many(comments),
  template: one(templates, { fields: [posts.templateId], references: [templates.id] }),
}));

export const commentsRelations = relations(comments, ({ one, many }) => ({
  post: one(posts, { fields: [comments.postId], references: [posts.id] }),
  author: one(users, { fields: [comments.authorId], references: [users.id] }),
  parent: one(comments, { fields: [comments.parentId], references: [comments.id], relationName: "parentComment" }),
  children: many(comments, { relationName: "parentComment" }),
}));

export const mediaRelations = relations(media, ({ one }) => ({
  author: one(users, { fields: [media.authorId], references: [users.id] }),
}));

export const templatesRelations = relations(templates, ({ one }) => ({
  author: one(users, { fields: [templates.authorId], references: [users.id] }),
}));

export const blocksRelations = relations(blocks, ({ one }) => ({
  author: one(users, { fields: [blocks.authorId], references: [users.id] }),
}));

// Schemas for validation
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPostSchema = createInsertSchema(posts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  publishedAt: z.union([z.date(), z.string().datetime().transform(str => new Date(str))]).optional().nullable(),
});

export const insertCommentSchema = createInsertSchema(comments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertThemeSchema = createInsertSchema(themes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPluginSchema = createInsertSchema(plugins).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOptionSchema = createInsertSchema(options).omit({
  id: true,
});

export const insertMediaSchema = createInsertSchema(media).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTemplateSchema = createInsertSchema(templates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateTemplateSchema = insertTemplateSchema.partial();

// Template condition schemas for Elementor-style conditional application
export const templateConditionSchema = z.object({
  type: z.enum(['page_type', 'post_type', 'specific_page', 'specific_post', 'taxonomy', 'author', 'date_range']),
  operator: z.enum(['is', 'is_not', 'contains', 'starts_with', 'ends_with']).default('is'),
  value: z.string(),
  relation: z.enum(['and', 'or']).default('and'),
});

export const templateWithConditionsSchema = insertTemplateSchema.extend({
  conditions: z.array(templateConditionSchema).default([]),
});

export const insertBlockSchema = createInsertSchema(blocks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Create user schema for validation
export const createUserSchema = createInsertSchema(users, {
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["administrator", "editor", "author", "contributor", "subscriber"]),
  status: z.enum(["active", "inactive", "pending"]).default("active"),
}).omit({ 
  id: true,
  createdAt: true,
  updatedAt: true 
});

// Update user schema (password is optional for updates)
export const updateUserSchema = createUserSchema.extend({
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
}).partial().refine(
  (data) => {
    // If password is provided and it's not empty, it must meet requirements
    if (data.password !== undefined && data.password !== "" && data.password.length < 6) {
      return false;
    }
    return true;
  },
  {
    message: "Password must be at least 6 characters",
    path: ["password"],
  }
);

// Types
export type User = typeof users.$inferSelect;
export type UpsertUser = typeof users.$inferInsert;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type CreateUser = z.infer<typeof createUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;

export type Post = typeof posts.$inferSelect;
export type InsertPost = z.infer<typeof insertPostSchema>;

export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;

export type Theme = typeof themes.$inferSelect;
export type InsertTheme = z.infer<typeof insertThemeSchema>;

export type Plugin = typeof plugins.$inferSelect;
export type InsertPlugin = z.infer<typeof insertPluginSchema>;

export type Option = typeof options.$inferSelect;
export type InsertOption = z.infer<typeof insertOptionSchema>;

export type Media = typeof media.$inferSelect;
export type InsertMedia = z.infer<typeof insertMediaSchema>;

export type Template = typeof templates.$inferSelect;
export type InsertTemplate = z.infer<typeof insertTemplateSchema>;

export type Block = typeof blocks.$inferSelect;
export type InsertBlock = z.infer<typeof insertBlockSchema>;

// Block configuration types
export interface BlockConfig {
  id: string;
  type: string;
  content: Record<string, any>;
  styles: Record<string, any>;
  settings: Record<string, any>;
  customCss?: string;
  children?: BlockConfig[]; // Nested blocks (containers only)
}
