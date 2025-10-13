import { sql, relations } from "drizzle-orm";
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
	other: jsonb("other").default({}),
});

// Comments table (WordPress compatible)
export const comments = pgTable(
	"comments",
	{
		id: serial("id").primaryKey(),
		postId: integer("post_id")
			.references(() => posts.id)
			.notNull(),
		authorId: varchar("author_id").references(() => users.id),
		authorName: varchar("author_name"),
		authorEmail: varchar("author_email"),
		content: text("content").notNull(),
		status: varchar("status").default("pending"), // approved, pending, spam, trash
		parentId: integer("parent_id"),
		createdAt: timestamp("created_at").defaultNow(),
		updatedAt: timestamp("updated_at").defaultNow(),
	},
	(table) => ({
		parentReference: index("idx_comments_parent").on(table.parentId),
	}),
);

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
	authorId: varchar("author_id")
		.references(() => users.id)
		.notNull(),
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
	template: one(templates, {
		fields: [posts.templateId],
		references: [templates.id],
	}),
}));

export const commentsRelations = relations(comments, ({ one, many }) => ({
	post: one(posts, { fields: [comments.postId], references: [posts.id] }),
	author: one(users, { fields: [comments.authorId], references: [users.id] }),
	parent: one(comments, {
		fields: [comments.parentId],
		references: [comments.id],
		relationName: "parentComment",
	}),
	children: many(comments, { relationName: "parentComment" }),
}));

export const mediaRelations = relations(media, ({ one }) => ({
	author: one(users, { fields: [media.authorId], references: [users.id] }),
}));
