import { relations } from "drizzle-orm/relations";
import { users, posts, templates, media, blocks, comments } from "./schema";

export const postsRelations = relations(posts, ({one, many}) => ({
	user: one(users, {
		fields: [posts.authorId],
		references: [users.id]
	}),
	template: one(templates, {
		fields: [posts.templateId],
		references: [templates.id]
	}),
	comments: many(comments),
}));

export const usersRelations = relations(users, ({many}) => ({
	posts: many(posts),
	media: many(media),
	templates: many(templates),
	blocks: many(blocks),
	comments: many(comments),
}));

export const templatesRelations = relations(templates, ({one, many}) => ({
	posts: many(posts),
	user: one(users, {
		fields: [templates.authorId],
		references: [users.id]
	}),
}));

export const mediaRelations = relations(media, ({one}) => ({
	user: one(users, {
		fields: [media.authorId],
		references: [users.id]
	}),
}));

export const blocksRelations = relations(blocks, ({one}) => ({
	user: one(users, {
		fields: [blocks.authorId],
		references: [users.id]
	}),
}));

export const commentsRelations = relations(comments, ({one}) => ({
	post: one(posts, {
		fields: [comments.postId],
		references: [posts.id]
	}),
	user: one(users, {
		fields: [comments.authorId],
		references: [users.id]
	}),
}));