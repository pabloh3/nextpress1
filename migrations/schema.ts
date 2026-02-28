import { pgTable, foreignKey, unique, serial, text, varchar, timestamp, jsonb, boolean, integer, index } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const posts = pgTable("posts", {
	id: serial().primaryKey().notNull(),
	title: text().notNull(),
	content: text(),
	excerpt: text(),
	slug: varchar().notNull(),
	status: varchar().default('draft'),
	type: varchar().default('post'),
	authorId: varchar("author_id").notNull(),
	featuredImage: varchar("featured_image"),
	publishedAt: timestamp("published_at", { mode: 'string' }),
	builderData: jsonb("builder_data"),
	usePageBuilder: boolean("use_page_builder").default(false),
	templateId: integer("template_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.authorId],
			foreignColumns: [users.id],
			name: "posts_author_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.templateId],
			foreignColumns: [templates.id],
			name: "posts_template_id_templates_id_fk"
		}),
	unique("posts_slug_unique").on(table.slug),
]);

export const media = pgTable("media", {
	id: serial().primaryKey().notNull(),
	filename: varchar().notNull(),
	originalName: varchar("original_name").notNull(),
	mimeType: varchar("mime_type").notNull(),
	size: integer().notNull(),
	url: varchar().notNull(),
	alt: varchar(),
	caption: text(),
	description: text(),
	authorId: varchar("author_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.authorId],
			foreignColumns: [users.id],
			name: "media_author_id_users_id_fk"
		}),
]);

export const templates = pgTable("templates", {
	id: serial().primaryKey().notNull(),
	name: varchar().notNull(),
	type: varchar().notNull(),
	description: text(),
	blocks: jsonb().default([]).notNull(),
	settings: jsonb().default({}),
	customHtml: text("custom_html"),
	customCss: text("custom_css"),
	customJs: text("custom_js"),
	isGlobal: boolean("is_global").default(false),
	applyTo: varchar("apply_to").default('all'),
	conditions: jsonb().default([]),
	priority: integer().default(0),
	isActive: boolean("is_active").default(true),
	authorId: varchar("author_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.authorId],
			foreignColumns: [users.id],
			name: "templates_author_id_users_id_fk"
		}),
]);

export const options = pgTable("options", {
	id: serial().primaryKey().notNull(),
	name: varchar().notNull(),
	value: text(),
	autoload: boolean().default(true),
}, (table) => [
	unique("options_name_unique").on(table.name),
]);

export const plugins = pgTable("plugins", {
	id: serial().primaryKey().notNull(),
	name: varchar().notNull(),
	description: text(),
	version: varchar().default('1.0.0'),
	author: varchar(),
	isActive: boolean("is_active").default(false),
	config: jsonb(),
	hooks: jsonb(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("plugins_name_unique").on(table.name),
]);

export const blocks = pgTable("blocks", {
	id: serial().primaryKey().notNull(),
	name: varchar().notNull(),
	type: varchar().notNull(),
	config: jsonb().notNull(),
	styles: jsonb().default({}),
	customCss: text("custom_css"),
	isReusable: boolean("is_reusable").default(false),
	authorId: varchar("author_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.authorId],
			foreignColumns: [users.id],
			name: "blocks_author_id_users_id_fk"
		}),
]);

export const themes = pgTable("themes", {
	id: serial().primaryKey().notNull(),
	name: varchar().notNull(),
	description: text(),
	version: varchar().default('1.0.0'),
	author: varchar(),
	renderer: varchar().default('react'),
	isActive: boolean("is_active").default(false),
	config: jsonb(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("themes_name_unique").on(table.name),
]);

export const users = pgTable("users", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	email: varchar(),
	firstName: varchar("first_name"),
	lastName: varchar("last_name"),
	profileImageUrl: varchar("profile_image_url"),
	username: varchar().notNull(),
	password: varchar(),
	role: varchar().default('subscriber'),
	status: varchar().default('active'),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("users_email_unique").on(table.email),
	unique("users_username_unique").on(table.username),
]);

export const comments = pgTable("comments", {
	id: serial().primaryKey().notNull(),
	postId: integer("post_id").notNull(),
	authorId: varchar("author_id"),
	authorName: varchar("author_name"),
	authorEmail: varchar("author_email"),
	content: text().notNull(),
	status: varchar().default('pending'),
	parentId: integer("parent_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_comments_parent").using("btree", table.parentId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.postId],
			foreignColumns: [posts.id],
			name: "comments_post_id_posts_id_fk"
		}),
	foreignKey({
			columns: [table.authorId],
			foreignColumns: [users.id],
			name: "comments_author_id_users_id_fk"
		}),
]);
