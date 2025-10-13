import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { comments, media, users } from "./schema";

export const insertUserSchema = createInsertSchema(users).omit({
	id: true,
	createdAt: true,
	updatedAt: true,
});

export const insertCommentSchema = createInsertSchema(comments).omit({
	id: true,
	createdAt: true,
	updatedAt: true,
});

export const insertMediaSchema = createInsertSchema(media).omit({
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
	role: z.enum([
		"administrator",
		"editor",
		"author",
		"contributor",
		"subscriber",
	]),
	status: z.enum(["active", "inactive", "pending"]).default("active"),
}).omit({
	id: true,
	createdAt: true,
	updatedAt: true,
});

// Update user schema (password is optional for updates)
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
			// If password is provided and it's not empty, it must meet requirements
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
