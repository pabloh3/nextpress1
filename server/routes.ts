import type { Express } from "express";
import { createServer, type Server } from "http";
import { models } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { authService, requireAuth, getCurrentUser } from "./auth";
import {
	CONFIG,
	getSiteSettings,
	parsePaginationParams,
	parseStatusParam,
} from "./config";
import { safeTry, safeTryAsync, handleSafeTryResult } from "./utils";
import {
	insertPostSchema,
	insertCommentSchema,
	insertMediaSchema,
	insertTemplateSchema,
	insertBlockSchema,
	createUserSchema,
	updateUserSchema,
} from "@shared/zod-schema";
import hooks from "./hooks";
import themeManager from "./themes";
import multer from "multer";
import path from "path";
import { promises as fs } from "fs";
import express from "express";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize default roles and site
async function initializeDefaultRolesAndSite() {
	try {
		// Check if roles exist
		const existingRoles = await models.roles.findDefaultRoles();

		if (existingRoles.length === 0) {
			console.log("Creating default roles...");

			// Create default roles
			const adminRole = await models.roles.create({
				name: "admin",
				description: "Full system access with all permissions",
				capabilities: [
					{
						name: "manage_users",
						description: "Create, edit, and delete users",
					},
					{
						name: "manage_roles",
						description: "Create, edit, and delete roles",
					},
					{
						name: "manage_sites",
						description: "Create, edit, and delete sites",
					},
					{
						name: "manage_themes",
						description: "Install, activate, and customize themes",
					},
					{
						name: "manage_plugins",
						description: "Install, activate, and configure plugins",
					},
					{
						name: "manage_settings",
						description: "Access and modify system settings",
					},
					{ name: "publish_posts", description: "Publish posts and pages" },
					{ name: "edit_posts", description: "Edit all posts and pages" },
					{ name: "delete_posts", description: "Delete posts and pages" },
					{
						name: "manage_media",
						description: "Upload and manage media files",
					},
					{
						name: "moderate_comments",
						description: "Approve, edit, and delete comments",
					},
				],
			});

			const editorRole = await models.roles.create({
				name: "editor",
				description: "Content management with publishing permissions",
				capabilities: [
					{ name: "publish_posts", description: "Publish posts and pages" },
					{ name: "edit_posts", description: "Edit all posts and pages" },
					{ name: "delete_posts", description: "Delete posts and pages" },
					{
						name: "manage_media",
						description: "Upload and manage media files",
					},
					{
						name: "moderate_comments",
						description: "Approve, edit, and delete comments",
					},
				],
			});

			const subscriberRole = await models.roles.create({
				name: "subscriber",
				description: "Basic user with limited content access",
				capabilities: [
					{ name: "read_posts", description: "Read published posts and pages" },
					{ name: "comment_posts", description: "Comment on posts" },
				],
			});

			console.log("Default roles created:", {
				adminRole: adminRole.name,
				editorRole: editorRole.name,
				subscriberRole: subscriberRole.name,
			});
		}

		// Check if default site exists
		const defaultSite = await models.sites.findDefaultSite();

		if (!defaultSite) {
			console.log("Creating default site...");

			// Get the first user to be the site owner, or create a system user
			let ownerId: string;
			const users = await models.users.findMany();

			if (users.length === 0) {
				// Create a system user for the site
				const systemUser = await models.users.create({
					username: "system",
					email: "system@nextpress.local",
					firstName: "System",
					lastName: "User",
					status: "active",
				});
				ownerId = systemUser.id;
			} else {
				ownerId = users[0].id;
			}

			const site = await models.sites.create({
				name: "Default Site",
				description: "The default site for NextPress",
				siteUrl: "http://localhost:3000",
				ownerId: ownerId,
				settings: {
					title: "NextPress Site",
					tagline: "A modern content management system",
					timezone: "UTC",
					dateFormat: "Y-m-d",
					timeFormat: "H:i",
				},
			});

			console.log("Default site created:", site.name);
		}
	} catch (error) {
		console.error("Error initializing default roles and site:", error);
	}
}

export async function registerRoutes(app: Express): Promise<Server> {
	// Initialize default roles and site
	await initializeDefaultRolesAndSite();

	// Auth middleware
	await setupAuth(app);

	// Initialize hooks
	hooks.doAction("init");

	// Local authentication routes
	app.post("/api/auth/login", async (req, res) => {
		try {
			const { username, password } = req.body;

			if (!username || !password) {
				return res
					.status(400)
					.json({ message: "Username and password are required" });
			}

			console.log("Login attempt for:", username);

			// Try to find user by username or email
			let user = await models.users.findByUsername(username);
			if (!user) {
				user = await models.users.findByEmail(username);
			}

			if (!user) {
				console.log("User not found for:", username);
				return res.status(401).json({ message: "Invalid credentials" });
			}

			if (!user.password) {
				console.log("User has no password set:", username);
				return res.status(401).json({ message: "Invalid credentials" });
			}

			console.log("Found user, checking password...");
			const bcrypt = await import("bcrypt");
			const isValidPassword = await bcrypt.compare(password, user.password);

			if (!isValidPassword) {
				console.log("Password does not match for user:", username);
				return res.status(401).json({ message: "Invalid credentials" });
			}

			if (user.status !== "active") {
				console.log("User account is not active:", username);
				return res.status(401).json({ message: "Account is not active" });
			}

			console.log("Login successful for user:", username);

			// Create session for local user
			(req as any).session.localUser = {
				id: user.id,
				username: user.username,
				email: user.email,
			};

			const { password: _, ...userResponse } = user;
			res.json(userResponse);
		} catch (error) {
			console.error("Error during local login:", error);
			res.status(500).json({ message: "Login failed" });
		}
	});

	app.post("/api/auth/register", async (req, res) => {
		try {
			const { createUserSchema } = await import("@shared/zod-schema");
			const userData = createUserSchema.parse(req.body);

			// Check if username or email already exists
			const existingUser = await models.users.findByUsername(userData.username);
			if (existingUser) {
				return res.status(400).json({ message: "Username already exists" });
			}

			const existingEmail = await models.users.findByEmail(userData.email);
			if (existingEmail) {
				return res.status(400).json({ message: "Email already exists" });
			}

			// Hash password
			const bcrypt = await import("bcrypt");
			const hashedPassword = await bcrypt.hash(userData.password, 10);
			userData.password = hashedPassword;
			console.log("Password hashed for new user:", userData.username);

			const user = await models.users.create(userData);

			// Assign default role to new user
			try {
				// Get the default site
				const defaultSite = await models.sites.findDefaultSite();
				if (!defaultSite) {
					console.error("No default site found for role assignment");
				} else {
					// Get subscriber role
					const subscriberRole = await models.roles.findByName("subscriber");
					if (subscriberRole) {
						await models.userRoles.assignRole(
							user.id,
							subscriberRole.id,
							defaultSite.id,
						);
						console.log(`Assigned subscriber role to user: ${user.username}`);
					} else {
						console.error("Subscriber role not found");
					}
				}
			} catch (roleError) {
				console.error("Error assigning role to new user:", roleError);
				// Don't fail registration if role assignment fails
			}

			// Create session for new user
			(req as any).session.localUser = {
				id: user.id,
				username: user.username,
				email: user.email,
			};

			const { password: _password, ...userResponse } = user;
			res.status(201).json(userResponse);
		} catch (error) {
			console.error("Error during registration:", error);
			if (error instanceof Error && error.name === "ZodError") {
				return res
					.status(400)
					.json({ message: "Invalid user data", errors: error });
			}
			res.status(500).json({ message: "Registration failed" });
		}
	});

	app.post("/api/auth/logout", (req, res) => {
		(req as any).session.destroy((err: any) => {
			if (err) {
				return res.status(500).json({ message: "Logout failed" });
			}
			res.json({ message: "Logged out successfully" });
		});
	});

	// Auth routes (combined local and Replit auth)
	app.get("/api/auth/user", async (req: any, res) => {
		const { err, result } = await safeTryAsync(async () => {
			return await authService.getCurrentUser(req);
		});

		if (err) {
			console.error("Error fetching user:", err);
			return res.status(500).json({ message: "Failed to fetch user" });
		}

		if (!result) {
			return res.status(401).json({ message: "Unauthorized" });
		}

		res.json(result);
	});

	// User management routes (WordPress compatible)
	app.get("/api/users", isAuthenticated, async (req, res) => {
		const { err, result } = await safeTryAsync(async () => {
			const { page, limit, offset } = parsePaginationParams(
				req.query,
				CONFIG.PAGINATION.DEFAULT_PAGE_SIZE,
			);
			const { role } = req.query;

			const users = await models.users.findMany({
				limit,
				offset,
				where: "role",
				equals: role as string,
			});

			const total = await models.users.count({
				where: [{ where: "role", equals: role as string }],
			});

			return {
				users,
				total,
				page,
				per_page: limit,
				total_pages: Math.ceil(total / limit),
			};
		});

		if (err) {
			console.error("Error fetching users:", err);
			return res.status(500).json({ message: "Failed to fetch users" });
		}

		res.json(result);
	});

	app.get("/api/users/:id", isAuthenticated, async (req, res) => {
		try {
			const user = await models.users.findById(req.params.id);
			if (!user) {
				return res.status(404).json({ message: "User not found" });
			}
			res.json(user);
		} catch (error) {
			console.error("Error fetching user:", error);
			res.status(500).json({ message: "Failed to fetch user" });
		}
	});

	app.post("/api/users", isAuthenticated, async (req, res) => {
		try {
			const { createUserSchema } = await import("@shared/zod-schema");
			const userData = createUserSchema.parse(req.body);

			// Hash password if provided
			if (userData.password) {
				const bcrypt = await import("bcrypt");
				userData.password = await bcrypt.hash(userData.password, 10);
			}

			const user = await models.users.create(userData);

			// Remove password from response
			const { password: _password, ...userResponse } = user;
			res.status(201).json(userResponse);
		} catch (error) {
			console.error("Error creating user:", error);
			if (error instanceof Error && error.name === "ZodError") {
				return res
					.status(400)
					.json({ message: "Invalid user data", errors: error });
			}
			res.status(500).json({ message: "Failed to create user" });
		}
	});

	app.put("/api/users/:id", isAuthenticated, async (req, res) => {
		try {
			const { updateUserSchema } = await import("@shared/zod-schema");
			const userData = updateUserSchema.parse(req.body);

			// Hash password if provided
			if (userData.password) {
				const bcrypt = await import("bcrypt");
				const hashedPassword = await bcrypt.hash(userData.password, 10);
				userData.password = hashedPassword;
				console.log("Password updated and hashed for user:", req.params.id);
			}

			const user = await models.users.update(req.params.id, userData);

			// Remove password from response
			const { password: _password, ...userResponse } = user;
			res.json(userResponse);
		} catch (error) {
			console.error("Error updating user:", error);
			if (error instanceof Error && error.name === "ZodError") {
				return res
					.status(400)
					.json({ message: "Invalid user data", errors: error });
			}
			res.status(500).json({ message: "Failed to update user" });
		}
	});

	app.delete("/api/users/:id", isAuthenticated, async (req, res) => {
		try {
			// Prevent deletion of current user
			const currentUserId = (req as any).user?.claims?.sub;
			if (req.params.id === currentUserId) {
				return res
					.status(400)
					.json({ message: "Cannot delete your own account" });
			}

			await models.users.delete(req.params.id);
			res.json({ message: "User deleted successfully" });
		} catch (error) {
			console.error("Error deleting user:", error);
			res.status(500).json({ message: "Failed to delete user" });
		}
	});

	// Dashboard stats
	app.get("/api/dashboard/stats", isAuthenticated, async (req, res) => {
		try {
			const [postsCount, pagesCount, commentsCount, usersCount] =
				await Promise.all([
					models.posts.count({
						where: [
							{ where: "status", equals: "publish" },
							// Removed type filter; update this if new schema provides a way to distinguish posts
						],
					}),
					models.posts.count({
						where: [
							{ where: "status", equals: "publish" },
							// Removed type filter; update this if new schema provides a way to distinguish pages
						],
					}),
					models.comments.count({
						where: [{ where: "status", equals: "approved" }],
					}),
					1, // Simplified for now
				]);

			res.json({
				posts: postsCount,
				pages: pagesCount,
				comments: commentsCount,
				users: usersCount,
			});
		} catch (error) {
			console.error("Error fetching stats:", error);
			res.status(500).json({ message: "Failed to fetch dashboard stats" });
		}
	});

	// Posts API (WordPress compatible)
	app.get("/api/posts", async (req, res) => {
		const { err, result } = await safeTryAsync(async () => {
			const { page, limit, offset } = parsePaginationParams(
				req.query,
				CONFIG.PAGINATION.DEFAULT_POSTS_PER_PAGE,
			);
			const { status = CONFIG.STATUS.PUBLISH } = req.query;

			// Handle 'any' status to show all posts (for admin interface)
			const actualStatus = parseStatusParam(status as string);

			const posts = await models.posts.findMany({
				where: "status",
				equals: actualStatus,
				limit,
				offset,
			});

			const total = await models.posts.count({
				where: actualStatus
					? [{ where: "status", equals: actualStatus }]
					: undefined,
			});

			return {
				posts,
				total,
				page,
				per_page: limit,
				total_pages: Math.ceil(total / limit),
			};
		});

		if (err) {
			console.error("Error fetching posts:", err);
			return res.status(500).json({ message: "Failed to fetch posts" });
		}

		res.json(result);
	});

	app.get("/api/posts/:id", async (req, res) => {
		try {
			const post = await models.posts.findById(req.params.id);
			if (!post) {
				return res.status(404).json({ message: "Post not found" });
			}
			res.json(post);
		} catch (error) {
			console.error("Error fetching post:", error);
			res.status(500).json({ message: "Failed to fetch post" });
		}
	});

	app.post("/api/posts", isAuthenticated, async (req: any, res) => {
		const { err, result } = await safeTryAsync(async () => {
			const userId = authService.getCurrentUserId(req);
			if (!userId) {
				throw new Error("User not authenticated");
			}

			// Include authorId in the data before validation
			const postData = insertPostSchema.parse({
				...req.body,
				authorId: userId,
			});

			// Generate slug if not provided
			if (!postData.slug) {
				postData.slug = postData.title
					.toLowerCase()
					.replace(/[^a-z0-9]+/g, "-")
					.replace(/^-|-$/g, "");
			}

			const post = await models.posts.create(postData);
			hooks.doAction("save_post", post);

			if (post.status === CONFIG.STATUS.PUBLISH) {
				hooks.doAction("publish_post", post);
			}

			return post;
		});

		if (err) {
			console.error("Error creating post:", err);
			return res.status(500).json({ message: "Failed to create post" });
		}

		res.status(201).json(result);
	});

	app.put("/api/posts/:id", isAuthenticated, async (req, res) => {
		try {
			const id = req.params.id;
			const postData = insertPostSchema.partial().parse(req.body);

			const existingPost = await models.posts.findById(id);
			if (!existingPost) {
				return res.status(404).json({ message: "Post not found" });
			}

			const wasPublished = existingPost.status === "publish";
			const post = await models.posts.update(id, postData);

			hooks.doAction("save_post", post);

			if (!wasPublished && post.status === "publish") {
				hooks.doAction("publish_post", post);
			}

			res.json(post);
		} catch (error) {
			console.error("Error updating post:", error);
			res.status(500).json({ message: "Failed to update post" });
		}
	});

	app.delete("/api/posts/:id", isAuthenticated, async (req, res) => {
		try {
			const id = req.params.id;
			const post = await models.posts.findById(id);

			if (!post) {
				return res.status(404).json({ message: "Post not found" });
			}

			await models.posts.delete(id);
			hooks.doAction("delete_post", id);

			res.json({ message: "Post deleted successfully" });
		} catch (error) {
			console.error("Error deleting post:", error);
			res.status(500).json({ message: "Failed to delete post" });
		}
	});

	// Pages API (WordPress compatible)
	app.get("/api/pages", async (req, res) => {
		const { err, result } = await safeTryAsync(async () => {
			const { page, per_page, limit, offset } = parsePaginationParams(
				req.query,
				CONFIG.PAGINATION.DEFAULT_POSTS_PER_PAGE,
			);
			const { status = CONFIG.STATUS.PUBLISH } = req.query;

			// Handle 'any' status to show all pages (for admin interface)
			const actualStatus = parseStatusParam(status as string);

			const pages = await models.pages.findMany({
				where: "status",
				equals: actualStatus,
				limit,
				offset,
			});

			const total = await models.pages.count({
				where: actualStatus
					? [{ where: "status", equals: actualStatus }]
					: undefined,
			});

			return {
				pages,
				total,
				page,
				per_page: limit,
				total_pages: Math.ceil(total / limit),
			};
		});

		if (err) {
			console.error("Error fetching pages:", err);
			return res.status(500).json({ message: "Failed to fetch pages" });
		}

		res.json(result);
	});

	app.get("/api/pages/:id", async (req, res) => {
		try {
			const page = await models.pages.findById(req.params.id);
			if (!page) {
				return res.status(404).json({ message: "Page not found" });
			}
			res.json(page);
		} catch (error) {
			console.error("Error fetching page:", error);
			res.status(500).json({ message: "Failed to fetch page" });
		}
	});

	app.post("/api/pages", isAuthenticated, async (req: any, res) => {
		const { err, result } = await safeTryAsync(async () => {
			const userId = authService.getCurrentUserId(req);
			if (!userId) {
				throw new Error("User not authenticated");
			}

			// Include authorId and type in the data before validation
			const pageData = insertPostSchema.parse({
				...req.body,
				authorId: userId,
				type: "page",
			});

			// Generate slug if not provided
			if (!pageData.slug) {
				pageData.slug = pageData.title
					.toLowerCase()
					.replace(/[^a-z0-9]+/g, "-")
					.replace(/^-|-$/g, "");
			}

			const page = await models.posts.create(pageData);
			hooks.doAction("save_post", page);

			if (page.status === CONFIG.STATUS.PUBLISH) {
				hooks.doAction("publish_post", page);
			}

			return page;
		});

		if (err) {
			console.error("Error creating page:", err);
			return res.status(500).json({ message: "Failed to create page" });
		}

		res.status(201).json(result);
	});

	app.put("/api/pages/:id", isAuthenticated, async (req, res) => {
		try {
			const id = req.params.id;
			const pageData = insertPostSchema.partial().parse(req.body);

			const existingPage = await models.pages.findById(id);
			if (!existingPage) {
				return res.status(404).json({ message: "Page not found" });
			}

			const wasPublished = existingPage.status === "publish";
			const page = await models.pages.update(id, pageData);

			hooks.doAction("save_post", page);

			if (!wasPublished && page.status === "publish") {
				hooks.doAction("publish_post", page);
			}

			res.json(page);
		} catch (error) {
			console.error("Error updating page:", error);
			res.status(500).json({ message: "Failed to update page" });
		}
	});

	app.delete("/api/pages/:id", isAuthenticated, async (req, res) => {
		try {
			const id = req.params.id;
			const page = await models.pages.findById(id);

			if (!page) {
				return res.status(404).json({ message: "Page not found" });
			}

			await models.pages.delete(id);
			hooks.doAction("delete_post", id);

			res.json({ message: "Page deleted successfully" });
		} catch (error) {
			console.error("Error deleting page:", error);
			res.status(500).json({ message: "Failed to delete page" });
		}
	});

	// Comments API
	app.get("/api/comments", async (req, res) => {
		try {
			const {
				post_id,
				status = "approved",
				page = 1,
				per_page = 10,
			} = req.query;
			const limit = parseInt(per_page as string);
			const offset = (parseInt(page as string) - 1) * limit;

			const filters = [
				...(post_id ? [{ where: "postId", equals: post_id }] : []),
				...(status ? [{ where: "status", equals: status }] : []),
			];

			const comments = await models.comments.findManyWhere(filters, {
				limit,
				offset,
			});

			const total = await models.comments.count({
				where: filters,
			});

			res.json({
				comments,
				total,
				page: parseInt(page as string),
				per_page: limit,
				total_pages: Math.ceil(total / limit),
			});
		} catch (error) {
			console.error("Error fetching comments:", error);
			res.status(500).json({ message: "Failed to fetch comments" });
		}
	});

	app.post("/api/comments", async (req, res) => {
		try {
			const commentData = insertCommentSchema.parse(req.body);
			const comment = await models.comments.create(commentData);
			hooks.doAction("new_comment", comment);
			res.status(201).json(comment);
		} catch (error) {
			console.error("Error creating comment:", error);
			res.status(500).json({ message: "Failed to create comment" });
		}
	});

	app.get("/api/comments/:id", isAuthenticated, async (req, res) => {
		try {
			const id = req.params.id;
			const comment = await models.comments.findById(id);

			if (!comment) {
				return res.status(404).json({ message: "Comment not found" });
			}

			res.json(comment);
		} catch (error) {
			console.error("Error fetching comment:", error);
			res.status(500).json({ message: "Failed to fetch comment" });
		}
	});

	app.put("/api/comments/:id", isAuthenticated, async (req, res) => {
		try {
			const id = req.params.id;
			const existingComment = await models.comments.findById(id);

			if (!existingComment) {
				return res.status(404).json({ message: "Comment not found" });
			}

			const { content, status, authorName, authorEmail } = req.body;
			const updatedComment = await models.comments.update(id, {
				content,
				status,
				authorName,
				authorEmail,
			});

			hooks.doAction("edit_comment", updatedComment);
			res.json(updatedComment);
		} catch (error) {
			console.error("Error updating comment:", error);
			res.status(500).json({ message: "Failed to update comment" });
		}
	});

	app.delete("/api/comments/:id", isAuthenticated, async (req, res) => {
		try {
			const id = req.params.id;
			const existingComment = await models.comments.findById(id);

			if (!existingComment) {
				return res.status(404).json({ message: "Comment not found" });
			}

			await models.comments.delete(id);
			hooks.doAction("delete_comment", id);

			res.json({ message: "Comment deleted successfully" });
		} catch (error) {
			console.error("Error deleting comment:", error);
			res.status(500).json({ message: "Failed to delete comment" });
		}
	});

	app.patch("/api/comments/:id/approve", isAuthenticated, async (req, res) => {
		try {
			const id = req.params.id;
			const comment = await models.comments.approve(id);
			hooks.doAction("approve_comment", comment);
			res.json(comment);
		} catch (error) {
			console.error("Error approving comment:", error);
			res.status(500).json({ message: "Failed to approve comment" });
		}
	});

	app.patch("/api/comments/:id/spam", isAuthenticated, async (req, res) => {
		try {
			const id = req.params.id;
			const comment = await models.comments.spam(id);
			hooks.doAction("spam_comment", comment);
			res.json(comment);
		} catch (error) {
			console.error("Error marking comment as spam:", error);
			res.status(500).json({ message: "Failed to mark comment as spam" });
		}
	});

	// Themes API
	app.get("/api/themes", isAuthenticated, async (_req, res) => {
		try {
			const themes = await models.themes.findMany();
			res.json(themes);
		} catch (error) {
			console.error("Error fetching themes:", error);
			res.status(500).json({ message: "Failed to fetch themes" });
		}
	});

	app.get("/api/themes/active", async (_req, res) => {
		try {
			const theme = await models.themes.findActiveTheme();
			res.json(theme);
		} catch (error) {
			console.error("Error fetching active theme:", error);
			res.status(500).json({ message: "Failed to fetch active theme" });
		}
	});

	app.post("/api/themes/:id/activate", isAuthenticated, async (req, res) => {
		try {
			const id = req.params.id;
			const theme = await models.themes.setActiveTheme(id);
			res.json(theme);
		} catch (error) {
			console.error("Error activating theme:", error);
			res.status(500).json({ message: "Failed to activate theme" });
		}
	});

	// Plugins API
	app.get("/api/plugins", isAuthenticated, async (_req, res) => {
		try {
			const plugins = await models.plugins.findMany();
			res.json(plugins);
		} catch (error) {
			console.error("Error fetching plugins:", error);
			res.status(500).json({ message: "Failed to fetch plugins" });
		}
	});

	// Hooks API (for development/debugging)
	app.get("/api/hooks", isAuthenticated, async (_req, res) => {
		try {
			res.json({
				actions: hooks.getActions(),
				filters: hooks.getFilters(),
			});
		} catch (error) {
			console.error("Error fetching hooks:", error);
			res.status(500).json({ message: "Failed to fetch hooks" });
		}
	});

	// Options API (WordPress compatible)
	app.get("/api/options/:name", async (req, res) => {
		try {
			const option = await models.options.getOption(req.params.name);
			if (!option) {
				return res.status(404).json({ message: "Option not found" });
			}
			res.json(option);
		} catch (error) {
			console.error("Error fetching option:", error);
			res.status(500).json({ message: "Failed to fetch option" });
		}
	});

	app.post("/api/options", isAuthenticated, async (req, res) => {
		try {
			const { name, value } = req.body;
			const option = await models.options.setOption({ name, value });
			res.json(option);
		} catch (error) {
			console.error("Error setting option:", error);
			res.status(500).json({ message: "Failed to set option" });
		}
	});

	// Configure multer for file uploads
	const uploadDir = path.join(process.cwd(), "uploads");

	// Ensure upload directory exists
	try {
		await fs.access(uploadDir);
	} catch {
		await fs.mkdir(uploadDir, { recursive: true });
	}

	const upload = multer({
		storage: multer.diskStorage({
			destination: (req, file, cb) => {
				cb(null, uploadDir);
			},
			filename: (req, file, cb) => {
				const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
				const ext = path.extname(file.originalname);
				const name = path.basename(file.originalname, ext);
				cb(null, name + "-" + uniqueSuffix + ext);
			},
		}),
		limits: {
			fileSize: CONFIG.UPLOAD.LIMIT,
		},
		fileFilter: (req, file, cb) => {
			if (CONFIG.UPLOAD.ALLOWED_MIME_TYPES.includes(file.mimetype as any)) {
				cb(null, true);
			} else {
				cb(new Error("File type not allowed"));
			}
		},
	});

	// Media API (WordPress compatible)
	app.get("/api/media", async (req, res) => {
		const { err, result } = await safeTryAsync(async () => {
			const { page, per_page, limit, offset } = parsePaginationParams(
				req.query,
				CONFIG.PAGINATION.DEFAULT_MEDIA_PER_PAGE,
			);
			const { mime_type } = req.query;

			const mediaItems = await models.media.findMany({
				limit,
				offset,
				where: "mimeType",
				equals: mime_type as string,
			});

			const total = await models.media.count({
				where: [{ where: "mimeType", equals: mime_type as string }],
			});

			return {
				media: mediaItems,
				total,
				page,
				per_page: limit,
				total_pages: Math.ceil(total / limit),
			};
		});

		if (err) {
			console.error("Error fetching media:", err);
			return res.status(500).json({ message: "Failed to fetch media" });
		}

		res.json(result);
	});

	app.get("/api/media/:id", async (req, res) => {
		try {
			const mediaItem = await models.media.findById(req.params.id);
			if (!mediaItem) {
				return res.status(404).json({ message: "Media not found" });
			}
			res.json(mediaItem);
		} catch (error) {
			console.error("Error fetching media item:", error);
			res.status(500).json({ message: "Failed to fetch media item" });
		}
	});

	app.post(
		"/api/media",
		isAuthenticated,
		upload.single("file"),
		async (req: any, res) => {
			const { err, result } = await safeTryAsync(async () => {
				const userId = authService.getCurrentUserId(req);
				if (!userId) {
					throw new Error("User not authenticated");
				}

				const file = req.file;
				if (!file) {
					throw new Error("No file uploaded");
				}

				const { alt, caption, description } = req.body;

				// Create URL for the uploaded file
				const fileUrl = `/uploads/${file.filename}`;

				const mediaData = insertMediaSchema.parse({
					filename: file.filename,
					originalName: file.originalname,
					mimeType: file.mimetype,
					size: file.size,
					url: fileUrl,
					alt: alt || "",
					caption: caption || "",
					description: description || "",
					authorId: userId,
				});

				const mediaItem = await models.media.create(mediaData);
				hooks.doAction("wp_handle_upload", mediaItem);

				return mediaItem;
			});

			if (err) {
				console.error("Error uploading media:", err);
				return res.status(500).json({ message: "Failed to upload media" });
			}

			res.status(201).json(result);
		},
	);

	app.put("/api/media/:id", isAuthenticated, async (req, res) => {
		try {
			const id = req.params.id;
			const { alt, caption, description } = req.body;

			const mediaItem = await models.media.update(id, {
				alt,
				caption,
				description,
			});

			hooks.doAction("wp_update_attachment_metadata", mediaItem);
			res.json(mediaItem);
		} catch (error) {
			console.error("Error updating media:", error);
			res.status(500).json({ message: "Failed to update media" });
		}
	});

	app.delete("/api/media/:id", isAuthenticated, async (req, res) => {
		try {
			const id = req.params.id;

			// Get media item to delete the file
			const mediaItem = await models.media.findById(id);
			if (mediaItem) {
				const filePath = path.join(uploadDir, mediaItem.filename);
				try {
					await fs.unlink(filePath);
				} catch (error) {
					console.warn("Could not delete file:", filePath, error);
				}
			}

			await models.media.delete(id);
			hooks.doAction("delete_attachment", id);

			res.json({ message: "Media deleted successfully" });
		} catch (error) {
			console.error("Error deleting media:", error);
			res.status(500).json({ message: "Failed to delete media" });
		}
	});

	// Theme rendering routes
	app.get("/posts/:id", async (req, res) => {
		try {
			const postId = req.params.id;
			const post = await models.posts.findById(postId);

			if (!post) {
				const html = themeManager.render404();
				return res.status(404).send(html);
			}

			// Get site settings for theme context
			const siteSettings = getSiteSettings(req);

			const html = await themeManager.renderContent("single-post", {
				post,
				site: siteSettings,
			});

			res.setHeader("Content-Type", "text/html");
			res.send(html);
		} catch (error) {
			console.error("Error rendering post:", error);
			const html = themeManager.render404();
			res.status(500).send(html);
		}
	});

	app.get("/pages/:id", async (req, res) => {
		try {
			const pageId = req.params.id;
			const page = await models.posts.findById(pageId); // Pages use same storage as posts

			if (!page) {
				const html = themeManager.render404();
				return res.status(404).send(html);
			}

			const siteSettings = getSiteSettings(req);

			const html = await themeManager.renderContent("page", {
				page,
				site: siteSettings,
			});

			res.setHeader("Content-Type", "text/html");
			res.send(html);
		} catch (error) {
			console.error("Error rendering page:", error);
			const html = themeManager.render404();
			res.status(500).send(html);
		}
	});

	app.get("/home", async (req, res) => {
		try {
			const posts = await models.posts.findMany({
				where: "status",
				equals: "publish",
				limit: 10,
			});

			const siteSettings = getSiteSettings(req);

			const html = await themeManager.renderContent("home", {
				posts: posts,
				site: siteSettings,
			});

			res.setHeader("Content-Type", "text/html");
			res.send(html);
		} catch (error) {
			console.error("Error rendering home:", error);
			const html = themeManager.render404();
			res.status(500).send(html);
		}
	});

	// Templates API
	app.get("/api/templates", isAuthenticated, async (req, res) => {
		try {
			const { type, page = 1, per_page = 10 } = req.query;
			const limit = parseInt(per_page as string);
			const offset = (parseInt(page as string) - 1) * limit;

			const templates = await models.templates.findMany({
				limit,
				offset,
				where: "type",
				equals: type as string,
			});

			const total = await models.templates.count({
				where: [{ where: "type", equals: type as string }],
			});

			res.json({
				templates,
				total,
				page: parseInt(page as string),
				per_page: limit,
				total_pages: Math.ceil(total / limit),
			});
		} catch (error) {
			console.error("Error fetching templates:", error);
			res.status(500).json({ message: "Failed to fetch templates" });
		}
	});

	app.get("/api/templates/:id", isAuthenticated, async (req, res) => {
		try {
			const template = await models.templates.findById(req.params.id);
			if (!template) {
				return res.status(404).json({ message: "Template not found" });
			}
			res.json(template);
		} catch (error) {
			console.error("Error fetching template:", error);
			res.status(500).json({ message: "Failed to fetch template" });
		}
	});

	app.post("/api/templates", isAuthenticated, async (req: any, res) => {
		const { err, result } = await safeTryAsync(async () => {
			const userId = authService.getCurrentUserId(req);
			if (!userId) {
				throw new Error("User not authenticated");
			}

			const { insertTemplateSchema } = await import("@shared/zod-schema");
			const templateData = insertTemplateSchema.parse({
				...req.body,
				authorId: userId,
			});

			const template = await models.templates.create(templateData);
			return template;
		});

		if (err) {
			console.error("Error creating template:", err);
			return res.status(500).json({ message: "Failed to create template" });
		}

		res.status(201).json(result);
	});

	app.post(
		"/api/templates/:id/duplicate",
		isAuthenticated,
		async (req, res) => {
			try {
				const { name } = req.body;
				if (!name) {
					return res.status(400).json({ message: "Template name is required" });
				}

				const template = await models.templates.duplicate(req.params.id, name);
				res.status(201).json(template);
			} catch (error) {
				console.error("Error duplicating template:", error);
				res.status(500).json({ message: "Failed to duplicate template" });
			}
		},
	);

	app.put("/api/templates/:id", isAuthenticated, async (req, res) => {
		try {
			const id = req.params.id;
			const { updateTemplateSchema } = await import("@shared/zod-schema");
			const templateData = updateTemplateSchema.parse(req.body);

			const template = await models.templates.update(id, templateData);
			res.json(template);
		} catch (error) {
			console.error("Error updating template:", error);
			res.status(500).json({ message: "Failed to update template" });
		}
	});

	app.delete("/api/templates/:id", isAuthenticated, async (req, res) => {
		try {
			const id = req.params.id;
			await models.templates.delete(id);
			res.json({ message: "Template deleted successfully" });
		} catch (error) {
			console.error("Error deleting template:", error);
			res.status(500).json({ message: "Failed to delete template" });
		}
	});

	// Blocks API
	app.get("/api/blocks", isAuthenticated, async (req, res) => {
		try {
			const { type, page = 1, per_page = 10 } = req.query;
			const limit = parseInt(per_page as string);
			const offset = (parseInt(page as string) - 1) * limit;

			const blocks = await models.blocks.findMany({
				limit,
				offset,
				where: "type",
				equals: type as string,
			});

			const total = await models.blocks.count({
				where: [{ where: "type", equals: type as string }],
			});

			res.json({
				blocks,
				total,
				page: parseInt(page as string),
				per_page: limit,
				total_pages: Math.ceil(total / limit),
			});
		} catch (error) {
			console.error("Error fetching blocks:", error);
			res.status(500).json({ message: "Failed to fetch blocks" });
		}
	});

	app.get("/api/blocks/:id", isAuthenticated, async (req, res) => {
		try {
			const block = await models.blocks.findById(req.params.id);
			if (!block) {
				return res.status(404).json({ message: "Block not found" });
			}
			res.json(block);
		} catch (error) {
			console.error("Error fetching block:", error);
			res.status(500).json({ message: "Failed to fetch block" });
		}
	});

	app.post("/api/blocks", isAuthenticated, async (req: any, res) => {
		const { err, result } = await safeTryAsync(async () => {
			const userId = authService.getCurrentUserId(req);
			if (!userId) {
				throw new Error("User not authenticated");
			}

			const blockData = insertBlockSchema.parse({
				...req.body,
				authorId: userId,
			});

			const block = await models.blocks.create(blockData);
			return block;
		});

		if (err) {
			console.error("Error creating block:", err);
			return res.status(500).json({ message: "Failed to create block" });
		}

		res.status(201).json(result);
	});

	app.put("/api/blocks/:id", isAuthenticated, async (req, res) => {
		try {
			const id = req.params.id;
			const blockData = insertBlockSchema.partial().parse(req.body);

			const block = await models.blocks.update(id, blockData);
			res.json(block);
		} catch (error) {
			console.error("Error updating block:", error);
			res.status(500).json({ message: "Failed to update block" });
		}
	});

	app.delete("/api/blocks/:id", isAuthenticated, async (req, res) => {
		try {
			const id = req.params.id;
			await models.blocks.delete(id);
			res.json({ message: "Block deleted successfully" });
		} catch (error) {
			console.error("Error deleting block:", error);
			res.status(500).json({ message: "Failed to delete block" });
		}
	});

	// Preview endpoints - public access for sharing
	app.get("/api/preview/post/:id", async (req, res) => {
		try {
			const post = await models.posts.findById(req.params.id);
			if (!post) {
				return res.status(404).json({ message: "Post not found" });
			}

			// Only allow preview of published posts or posts with status 'preview'
			if (post.status !== "publish" && post.status !== "preview") {
				return res
					.status(404)
					.json({ message: "Post not available for preview" });
			}

			res.json(post);
		} catch (error) {
			console.error("Error fetching post preview:", error);
			res.status(500).json({ message: "Failed to fetch post preview" });
		}
	});

	app.get("/api/preview/page/:id", async (req, res) => {
		try {
			const page = await models.posts.findById(req.params.id);
			if (!page) {
				return res.status(404).json({ message: "Page not found" });
			}

			// Only allow preview of published pages or pages with status 'preview'
			if (page.status !== "publish" && page.status !== "preview") {
				return res
					.status(404)
					.json({ message: "Page not available for preview" });
			}

			res.json(page);
		} catch (error) {
			console.error("Error fetching page preview:", error);
			res.status(500).json({ message: "Failed to fetch page preview" });
		}
	});

	app.get("/api/preview/template/:id", async (req, res) => {
		try {
			const template = await models.templates.findById(req.params.id);
			if (!template) {
				return res.status(404).json({ message: "Template not found" });
			}

			// Template preview is available for all templates

			res.json(template);
		} catch (error) {
			console.error("Error fetching template preview:", error);
			res.status(500).json({ message: "Failed to fetch template preview" });
		}
	});

	// Public endpoints for published content - accessible without authentication
	app.get("/api/public/page/:slug", async (req, res) => {
		try {
			const page = await models.posts.findBySlug(req.params.slug);
			if (!page) {
				return res.status(404).json({ message: "Page not found" });
			}

			// Only allow access to published pages
			if (page.status !== "publish") {
				return res.status(404).json({ message: "Page not found" });
			}

			res.json(page);
		} catch (error) {
			console.error("Error fetching published page:", error);
			res.status(500).json({ message: "Failed to fetch page" });
		}
	});

	app.get("/api/public/post/:slug", async (req, res) => {
		try {
			const post = await models.posts.findBySlug(req.params.slug);
			if (!post) {
				return res.status(404).json({ message: "Post not found" });
			}

			// Only allow access to published posts
			if (post.status !== "publish") {
				return res.status(404).json({ message: "Post not found" });
			}

			res.json(post);
		} catch (error) {
			console.error("Error fetching published post:", error);
			res.status(500).json({ message: "Failed to fetch post" });
		}
	});

	// Homepage endpoint - returns a published page marked as homepage or the first published page
	app.get("/api/public/homepage", async (_req, res) => {
		try {
			// First try to get a page specifically marked as homepage (we'll add this option later)
			const homepage = await models.options.getOption("homepage_page_slug");
			let page: any;

			if (homepage && homepage.value) {
				page = await models.posts.findBySlug(homepage.value);
			}

			// If no specific homepage set, try to get the first published page
			if (!page) {
				page = await models.posts.findFirst([
					{ where: "status", equals: "publish" },
				]);
			}

			if (!page) {
				return res.status(404).json({ message: "No homepage content found" });
			}

			res.json(page);
		} catch (error) {
			console.error("Error fetching homepage:", error);
			res.status(500).json({ message: "Failed to fetch homepage" });
		}
	});

	// Serve admin static assets
	app.use(
		"/admin/assets",
		express.static(path.join(__dirname, "../dist/public/assets")),
	);

	// Serve admin interface
	app.get("/admin", (_req, res) => {
		res.sendFile(path.join(__dirname, "../dist/public/index.html"));
	});

	app.get("/admin/*", (_req, res) => {
		res.sendFile(path.join(__dirname, "../dist/public/index.html"));
	});

	// Serve uploaded files
	app.use("/uploads", express.static(uploadDir));

	const httpServer = createServer(app);

	// Signal that NextPress is fully loaded
	hooks.doAction("wp_loaded");

	return httpServer;
}
