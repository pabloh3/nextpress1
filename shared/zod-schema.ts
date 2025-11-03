import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { 
	comments, 
	media, 
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
	blocks 
} from "./schema";

// User schemas
export const insertUserSchema = createInsertSchema(users).omit({
	id: true,
	createdAt: true,
	updatedAt: true,
});

export const createUserSchema = createInsertSchema(users, {
	username: z.string().min(3, "Username must be at least 3 characters"),
	email: z.string().email("Invalid email address"),
	firstName: z.string().min(1, "First name is required"),
	lastName: z.string().min(1, "Last name is required"),
	password: z.string().min(6, "Password must be at least 6 characters"),
	status: z.enum(["active", "inactive", "pending"]).default("active"),
}).omit({
	id: true,
	createdAt: true,
	updatedAt: true,
});

export const updateUserSchema = createUserSchema
	.extend({
		password: z
			.string()
			.min(6, "Password must be at least 6 characters")
			.optional(),
	})
	.partial()
	.refine(
		(data) => {
			if (
				data.password !== undefined &&
				data.password !== "" &&
				data.password.length < 6
			) {
				return false;
			}
			return true;
		},
		{
			message: "Password must be at least 6 characters",
			path: ["password"],
		},
	);

// Comment schemas
export const insertCommentSchema = createInsertSchema(comments).omit({
	id: true,
	createdAt: true,
	updatedAt: true,
});

// Media schemas
export const insertMediaSchema = createInsertSchema(media).omit({
	id: true,
	createdAt: true,
	updatedAt: true,
});

export const updateMediaSchema = createInsertSchema(media).partial().omit({
	id: true,
	createdAt: true,
});

// Site schemas
export const insertSiteSchema = createInsertSchema(sites).omit({
	id: true,
	createdAt: true,
	updatedAt: true,
});

export const updateSiteSchema = createInsertSchema(sites).partial().omit({
	id: true,
	createdAt: true,
});

// Role schemas
export const insertRoleSchema = createInsertSchema(roles).omit({
	id: true,
	createdAt: true,
	updatedAt: true,
});

export const updateRoleSchema = createInsertSchema(roles).partial().omit({
	id: true,
	createdAt: true,
});

// UserRole schemas
export const insertUserRoleSchema = createInsertSchema(userRoles).omit({
	id: true,
	createdAt: true,
	updatedAt: true,
});

// Page schemas
export const insertPageSchema = createInsertSchema(pages).omit({
	id: true,
	createdAt: true,
	updatedAt: true,
});

export const updatePageSchema = createInsertSchema(pages).partial().omit({
	id: true,
	createdAt: true,
});

// Post schemas
export const insertPostSchema = createInsertSchema(posts).omit({
	id: true,
	createdAt: true,
	updatedAt: true,
});

export const updatePostSchema = createInsertSchema(posts).partial().omit({
	id: true,
	createdAt: true,
});

// Blog schemas
export const insertBlogSchema = createInsertSchema(blogs).omit({
	id: true,
	createdAt: true,
	updatedAt: true,
});

export const updateBlogSchema = createInsertSchema(blogs).partial().omit({
	id: true,
	createdAt: true,
});

// Template schemas
export const insertTemplateSchema = createInsertSchema(templates).omit({
	id: true,
	createdAt: true,
	updatedAt: true,
});

export const updateTemplateSchema = createInsertSchema(templates).partial().omit({
	id: true,
	createdAt: true,
});

// Theme schemas
export const insertThemeSchema = createInsertSchema(themes).omit({
	id: true,
	createdAt: true,
	updatedAt: true,
});

export const updateThemeSchema = createInsertSchema(themes).partial().omit({
	id: true,
	createdAt: true,
});

// Plugin schemas
export const insertPluginSchema = createInsertSchema(plugins).omit({
	id: true,
	createdAt: true,
	updatedAt: true,
});

export const updatePluginSchema = createInsertSchema(plugins).partial().omit({
	id: true,
	createdAt: true,
});

// Option schemas
export const insertOptionSchema = createInsertSchema(options).omit({
	id: true,
	createdAt: true,
	updatedAt: true,
});

// Block schemas
export const insertBlockSchema = createInsertSchema(blocks).omit({
	id: true,
	createdAt: true,
	updatedAt: true,
});

export const updateBlockSchema = createInsertSchema(blocks).partial().omit({
	id: true,
	createdAt: true,
});
