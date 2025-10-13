import type { comments, users } from "./schema";
import type {
	createUserSchema,
	insertCommentSchema,
	insertUserSchema,
	updateUserSchema,
} from "./zod-schema";
import type { z } from "zod";

export type User = typeof users.$inferSelect;
export type UpsertUser = typeof users.$inferInsert;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type CreateUser = z.infer<typeof createUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;

export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;
