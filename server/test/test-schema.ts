import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

// SQLite-compatible schema for testing
export const testUsers = sqliteTable("users", {
	id: text("id").primaryKey(),
	email: text("email").unique(),
	firstName: text("first_name"),
	lastName: text("last_name"),
	profileImageUrl: text("profile_image_url"),
	username: text("username").unique().notNull(),
	password: text("password"),
	status: text("status").default("active"),
	createdAt: text("created_at"),
	updatedAt: text("updated_at"),
	other: text("other").default("{}"),
});

export const testPosts = sqliteTable("posts", {
	id: text("id").primaryKey(),
	title: text("title").notNull(),
	slug: text("slug").notNull(),
	status: text("status").default("draft"),
	authorId: text("author_id").notNull(),
	featuredImage: text("featured_image"),
	excerpt: text("excerpt"),
	publishedAt: text("published_at"),
	allowComments: integer("allow_comments").default(1),
	password: text("password"),
	parentId: text("parent_id"),
	templateId: text("template_id"),
	blocks: text("blocks").default("[]"),
	settings: text("settings").default("{}"),
	createdAt: text("created_at"),
	updatedAt: text("updated_at"),
	blogId: text("blog_id"),
	other: text("other").default('{"categories":[],"tags":[]}'),
});

export const testComments = sqliteTable("comments", {
	id: text("id").primaryKey(),
	postId: text("post_id").notNull(),
	authorId: text("author_id"),
	authorName: text("author_name"),
	authorEmail: text("author_email"),
	content: text("content").notNull(),
	status: text("status").default("pending"),
	parentId: text("parent_id"),
	createdAt: text("created_at"),
	updatedAt: text("updated_at"),
	other: text("other").default("{}"),
});

export const testPages = sqliteTable("pages", {
	id: text("id").primaryKey(),
	title: text("title").notNull(),
	content: text("content").notNull(),
	slug: text("slug").notNull(),
	status: text("status").default("draft"),
	authorId: text("author_id").notNull(),
	featuredImage: text("featured_image"),
	publishedAt: text("published_at"),
	allowComments: integer("allow_comments").default(1),
	password: text("password"),
	parentId: text("parent_id"),
	menuOrder: integer("menu_order").default(0),
	templateId: text("template_id"),
	createdAt: text("created_at"),
	updatedAt: text("updated_at"),
	other: text("other").default("{}"),
});

export const testMedia = sqliteTable("media", {
	id: text("id").primaryKey(),
	filename: text("filename").notNull(),
	originalName: text("original_name").notNull(),
	mimeType: text("mime_type").notNull(),
	size: integer("size").notNull(),
	url: text("url").notNull(),
	authorId: text("author_id").notNull(),
	alt: text("alt"),
	caption: text("caption"),
	description: text("description"),
	createdAt: text("created_at"),
	updatedAt: text("updated_at"),
});

export const testThemes = sqliteTable("themes", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	description: text("description"),
	authorId: text("author_id").notNull(),
	version: text("version").notNull(),
	requires: text("requires").notNull(),
	isPaid: integer("is_paid").default(0),
	price: integer("price").default(0),
	currency: text("currency").default("USD"),
	status: text("status").default("draft"),
	createdAt: text("created_at"),
	updatedAt: text("updated_at"),
	settings: text("settings").default("{}"),
	other: text("other").default("{}"),
});

export const testPlugins = sqliteTable("plugins", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	description: text("description"),
	runsWhen: text("runs_when").default("rendering"),
	authorId: text("author_id").notNull(),
	status: text("status").default("inactive"),
	version: text("version").notNull(),
	requires: text("requires").notNull(),
	isPaid: integer("is_paid").default(0),
	price: integer("price").default(0),
	currency: text("currency").default("USD"),
	settings: text("settings").default("{}"),
	createdAt: text("created_at"),
	updatedAt: text("updated_at"),
	other: text("other").default("{}"),
});

export const testOptions = sqliteTable("options", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	value: text("value").notNull(),
	createdAt: text("created_at"),
	updatedAt: text("updated_at"),
	other: text("other").default("{}"),
});

export const testTemplates = sqliteTable("templates", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	type: text("type").notNull(),
	description: text("description"),
	authorId: text("author_id").notNull(),
	blocks: text("blocks").notNull().default("[]"),
	settings: text("settings").default("{}"),
	other: text("other").default("{}"),
	createdAt: text("created_at"),
	updatedAt: text("updated_at"),
});

export const testBlocks = sqliteTable("blocks", {
	id: text("id").primaryKey(),
	name: text("name").default("text"),
	type: text("type").default("block"),
	category: text("category").default("basic"),
	version: text("version").notNull(),
	requires: text("requires").notNull(),
	authorId: text("author_id").notNull(),
	description: text("description"),
	settings: text("settings").default("{}"),
	createdAt: text("created_at"),
	updatedAt: text("updated_at"),
	children: text("children").default("[]"),
	other: text("other").default(
		'{"css":"","js":"","html":"","attributes":{},"customContent":{},"classNames":""}',
	),
});

export const testBlogs = sqliteTable("blogs", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	description: text("description"),
	slug: text("slug").notNull(),
	status: text("status").default("draft"),
	createdAt: text("created_at"),
	updatedAt: text("updated_at"),
	siteId: text("site_id"),
	authorId: text("author_id").notNull(),
	settings: text("settings").default("{}"),
	other: text("other").default("{}"),
});

export const testSites = sqliteTable("sites", {
	id: text("id").primaryKey(),
	name: text("name"),
	description: text("description"),
	logoUrl: text("logo_url"),
	faviconUrl: text("favicon_url"),
	siteUrl: text("site_url"),
	ownerId: text("owner_id").notNull(),
	createdAt: text("created_at"),
	updatedAt: text("updated_at"),
	settings: text("settings").default("{}"),
	activeThemeId: text("active_theme_id"),
	other: text("other").default("{}"),
});

export const testRoles = sqliteTable("roles", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	description: text("description"),
	createdAt: text("created_at"),
	updatedAt: text("updated_at"),
	capabilities: text("capabilities").default("[]"),
	siteId: text("site_id"),
	other: text("other").default("{}"),
});

export const testUserRoles = sqliteTable("user_roles", {
	id: text("id").primaryKey(),
	userId: text("user_id").notNull(),
	roleId: text("role_id").notNull(),
	siteId: text("site_id").notNull(),
	createdAt: text("created_at"),
	updatedAt: text("updated_at"),
});
