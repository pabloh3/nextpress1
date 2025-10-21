import { describe, it, expect, beforeEach } from "vitest";
import { testDb } from "./setup";
import {
	createUserModel,
	createPostModel,
	createCommentModel,
	createPageModel,
	createMediaModel,
	createThemeModel,
	createPluginModel,
	createOptionModel,
	createTemplateModel,
	createBlockModel,
} from "../storage";
import { blogs } from "@shared/schema";

describe("Specialized Model Factories", () => {
	// Test data
	const testUser = {
		id: "user-1",
		username: "testuser",
		email: "test@example.com",
		password: "hashedpassword",
		firstName: "Test",
		lastName: "User",
		status: "active",
	};

	const testBlog = {
		id: "blog-1",
		name: "Test Blog",
		description: "A test blog",
	};

	beforeEach(async () => {
		// Clean up tables before each test
		await testDb.delete(blogs);
		await testDb.insert(blogs).values(testBlog);
		await testDb
			.insert(blogs)
			.values({
				id: "blog-2",
				name: "Another Blog",
				description: "Another test blog",
			});
	});

	describe("User Model Specialized Methods", () => {
		const userModel = createUserModel(testDb);

		beforeEach(async () => {
			await testDb.delete(userModel as any);
			await testDb.insert(userModel as any).values(testUser);
			await testDb.insert(userModel as any).values({
				id: "user-2",
				username: "admin",
				email: "admin@example.com",
				password: "password",
				status: "active",
			});
		});

		it("should find user by username", async () => {
			const user = await userModel.findByUsername("testuser");
			expect(user).toBeDefined();
			expect(user?.username).toBe("testuser");
			expect(user?.email).toBe("test@example.com");
		});

		it("should find user by email", async () => {
			const user = await userModel.findByEmail("test@example.com");
			expect(user).toBeDefined();
			expect(user?.username).toBe("testuser");
			expect(user?.email).toBe("test@example.com");
		});

		it("should find users by status", async () => {
			const activeUsers = await userModel.findByStatus("active");
			expect(activeUsers).toHaveLength(2);
			expect(activeUsers.every((user) => user.status === "active")).toBe(true);
		});

		it("should return undefined for non-existent username", async () => {
			const user = await userModel.findByUsername("nonexistent");
			expect(user).toBeUndefined();
		});

		it("should return undefined for non-existent email", async () => {
			const user = await userModel.findByEmail("nonexistent@example.com");
			expect(user).toBeUndefined();
		});
	});

	describe("Post Model Specialized Methods", () => {
		const postModel = createPostModel(testDb);

		beforeEach(async () => {
			await testDb.delete(postModel as any);
			await testDb.insert(postModel as any).values({
				id: "post-1",
				title: "Test Post",
				slug: "test-post",
				content: "This is a test post",
				status: "draft",
				authorId: "user-1",
				blogId: "blog-1",
			});
			await testDb.insert(postModel as any).values({
				id: "post-2",
				title: "Published Post",
				slug: "published-post",
				content: "This is a published post",
				status: "publish",
				authorId: "user-1",
				blogId: "blog-1",
				publishedAt: new Date(),
			});
		});

		it("should find post by slug", async () => {
			const post = await postModel.findBySlug("test-post");
			expect(post).toBeDefined();
			expect(post?.title).toBe("Test Post");
			expect(post?.slug).toBe("test-post");
		});

		it("should find posts by status", async () => {
			const draftPosts = await postModel.findByStatus("draft");
			expect(draftPosts).toHaveLength(1);
			expect(draftPosts[0].title).toBe("Test Post");

			const publishedPosts = await postModel.findByStatus("publish");
			expect(publishedPosts).toHaveLength(1);
			expect(publishedPosts[0].title).toBe("Published Post");
		});

		it("should find posts by author", async () => {
			const userPosts = await postModel.findByAuthor("user-1");
			expect(userPosts).toHaveLength(2);
			expect(userPosts.every((post) => post.authorId === "user-1")).toBe(true);
		});

		it("should find posts by blog", async () => {
			const blogPosts = await postModel.findByBlog("blog-1");
			expect(blogPosts).toHaveLength(2);
			expect(blogPosts.every((post) => post.blogId === "blog-1")).toBe(true);
		});

		it("should publish a post", async () => {
			const publishedPost = await postModel.publish("post-1");
			expect(publishedPost.status).toBe("publish");
			expect(publishedPost.publishedAt).toBeDefined();
		});

		it("should return undefined for non-existent slug", async () => {
			const post = await postModel.findBySlug("non-existent");
			expect(post).toBeUndefined();
		});
	});

	describe("Comment Model Specialized Methods", () => {
		const commentModel = createCommentModel(testDb);

		beforeEach(async () => {
			await testDb.delete(commentModel as any);
			await testDb.insert(commentModel as any).values({
				id: "comment-1",
				content: "This is a test comment",
				authorName: "Commenter",
				authorEmail: "commenter@example.com",
				postId: "post-1",
				status: "pending",
			});
			await testDb.insert(commentModel as any).values({
				id: "comment-2",
				content: "This is an approved comment",
				authorName: "Approver",
				authorEmail: "approver@example.com",
				postId: "post-1",
				status: "approved",
			});
		});

		it("should find comments by post", async () => {
			const postComments = await commentModel.findByPost("post-1");
			expect(postComments).toHaveLength(2);
			expect(postComments.every((comment) => comment.postId === "post-1")).toBe(
				true,
			);
		});

		it("should find comments by status", async () => {
			const pendingComments = await commentModel.findByStatus("pending");
			expect(pendingComments).toHaveLength(1);
			expect(pendingComments[0].status).toBe("pending");

			const approvedComments = await commentModel.findByStatus("approved");
			expect(approvedComments).toHaveLength(1);
			expect(approvedComments[0].status).toBe("approved");
		});

		it("should approve a comment", async () => {
			const approvedComment = await commentModel.approve("comment-1");
			expect(approvedComment.status).toBe("approved");
		});

		it("should mark comment as spam", async () => {
			const spamComment = await commentModel.spam("comment-1");
			expect(spamComment.status).toBe("spam");
		});
	});

	describe("Page Model Specialized Methods", () => {
		const pageModel = createPageModel(testDb);

		beforeEach(async () => {
			await testDb.delete(pageModel as any);
			await testDb.insert(pageModel as any).values({
				id: "page-1",
				title: "About Us",
				slug: "about-us",
				content: "About us content",
				status: "draft",
				authorId: "user-1",
			});
		});

		it("should find page by slug", async () => {
			const page = await pageModel.findBySlug("about-us");
			expect(page).toBeDefined();
			expect(page?.title).toBe("About Us");
			expect(page?.slug).toBe("about-us");
		});

		it("should find pages by status", async () => {
			const draftPages = await pageModel.findByStatus("draft");
			expect(draftPages).toHaveLength(1);
			expect(draftPages[0].title).toBe("About Us");
		});

		it("should find pages by author", async () => {
			const userPages = await pageModel.findByAuthor("user-1");
			expect(userPages).toHaveLength(1);
			expect(userPages[0].authorId).toBe("user-1");
		});

		it("should publish a page", async () => {
			const publishedPage = await pageModel.publish("page-1");
			expect(publishedPage.status).toBe("publish");
			expect(publishedPage.publishedAt).toBeDefined();
		});
	});

	describe("Media Model Specialized Methods", () => {
		const mediaModel = createMediaModel(testDb);

		beforeEach(async () => {
			await testDb.delete(mediaModel as any);
			await testDb.insert(mediaModel as any).values({
				id: "media-1",
				filename: "test.jpg",
				originalName: "test-image.jpg",
				mimeType: "image/jpeg",
				size: 1024,
				url: "/uploads/test.jpg",
				authorId: "user-1",
			});
			await testDb.insert(mediaModel as any).values({
				id: "media-2",
				filename: "video.mp4",
				originalName: "test-video.mp4",
				mimeType: "video/mp4",
				size: 2048,
				url: "/uploads/video.mp4",
				authorId: "user-1",
			});
		});

		it("should find media by author", async () => {
			const userMedia = await mediaModel.findByAuthor("user-1");
			expect(userMedia).toHaveLength(2);
			expect(userMedia.every((media) => media.authorId === "user-1")).toBe(
				true,
			);
		});

		it("should find media by MIME type", async () => {
			const images = await mediaModel.findByMimeType("image/jpeg");
			expect(images).toHaveLength(1);
			expect(images[0].mimeType).toBe("image/jpeg");

			const videos = await mediaModel.findByMimeType("video/mp4");
			expect(videos).toHaveLength(1);
			expect(videos[0].mimeType).toBe("video/mp4");
		});
	});

	describe("Theme Model Specialized Methods", () => {
		const themeModel = createThemeModel(testDb);

		beforeEach(async () => {
			await testDb.delete(themeModel as any);
			await testDb.insert(themeModel as any).values({
				id: "theme-1",
				name: "Test Theme",
				version: "1.0.0",
				description: "A test theme",
				status: "inactive",
			});
			await testDb.insert(themeModel as any).values({
				id: "theme-2",
				name: "Active Theme",
				version: "2.0.0",
				description: "An active theme",
				status: "active",
			});
		});

		it("should find active theme", async () => {
			const activeTheme = await themeModel.findActiveTheme();
			expect(activeTheme).toBeDefined();
			expect(activeTheme?.status).toBe("active");
			expect(activeTheme?.name).toBe("Active Theme");
		});

		it("should set active theme", async () => {
			const activatedTheme = await themeModel.setActiveTheme("theme-1");
			expect(activatedTheme.status).toBe("active");

			// Check that other themes are deactivated
			const activeTheme = await themeModel.findActiveTheme();
			expect(activeTheme?.id).toBe("theme-1");
		});

		it("should find theme by name", async () => {
			const theme = await themeModel.findByName("Test Theme");
			expect(theme).toBeDefined();
			expect(theme?.name).toBe("Test Theme");
		});
	});

	describe("Plugin Model Specialized Methods", () => {
		const pluginModel = createPluginModel(testDb);

		beforeEach(async () => {
			await testDb.delete(pluginModel as any);
			await testDb.insert(pluginModel as any).values({
				id: "plugin-1",
				name: "Test Plugin",
				version: "1.0.0",
				description: "A test plugin",
				status: "inactive",
			});
			await testDb.insert(pluginModel as any).values({
				id: "plugin-2",
				name: "Active Plugin",
				version: "2.0.0",
				description: "An active plugin",
				status: "active",
			});
		});

		it("should find active plugins", async () => {
			const activePlugins = await pluginModel.findActivePlugins();
			expect(activePlugins).toHaveLength(1);
			expect(activePlugins[0].status).toBe("active");
			expect(activePlugins[0].name).toBe("Active Plugin");
		});

		it("should find plugin by name", async () => {
			const plugin = await pluginModel.findByName("Test Plugin");
			expect(plugin).toBeDefined();
			expect(plugin?.name).toBe("Test Plugin");
		});

		it("should activate plugin", async () => {
			const activatedPlugin = await pluginModel.activate("plugin-1");
			expect(activatedPlugin.status).toBe("active");
		});

		it("should deactivate plugin", async () => {
			const deactivatedPlugin = await pluginModel.deactivate("plugin-2");
			expect(deactivatedPlugin.status).toBe("inactive");
		});
	});

	describe("Option Model Specialized Methods", () => {
		const optionModel = createOptionModel(testDb);

		beforeEach(async () => {
			await testDb.delete(optionModel as any);
		});

		it("should get option", async () => {
			await testDb.insert(optionModel as any).values({
				id: "option-1",
				name: "site_title",
				value: "My Site",
			});

			const option = await optionModel.getOption("site_title");
			expect(option).toBeDefined();
			expect(option?.name).toBe("site_title");
			expect(option?.value).toBe("My Site");
		});

		it("should set new option", async () => {
			const newOption = await optionModel.setOption({
				name: "site_description",
				value: "My site description",
			});

			expect(newOption.name).toBe("site_description");
			expect(newOption.value).toBe("My site description");
		});

		it("should update existing option", async () => {
			await testDb.insert(optionModel as any).values({
				id: "option-1",
				name: "site_title",
				value: "Old Title",
			});

			const updatedOption = await optionModel.setOption({
				name: "site_title",
				value: "New Title",
			});

			expect(updatedOption.name).toBe("site_title");
			expect(updatedOption.value).toBe("New Title");
		});

		it("should return undefined for non-existent option", async () => {
			const option = await optionModel.getOption("non_existent");
			expect(option).toBeUndefined();
		});
	});

	describe("Template Model Specialized Methods", () => {
		const templateModel = createTemplateModel(testDb);

		beforeEach(async () => {
			await testDb.delete(templateModel as any);
			await testDb.insert(templateModel as any).values({
				id: "template-1",
				name: "Page Template",
				type: "page",
				content: "Page template content",
			});
			await testDb.insert(templateModel as any).values({
				id: "template-2",
				name: "Post Template",
				type: "post",
				content: "Post template content",
			});
		});

		it("should find templates by type", async () => {
			const pageTemplates = await templateModel.findByType("page");
			expect(pageTemplates).toHaveLength(1);
			expect(pageTemplates[0].type).toBe("page");

			const postTemplates = await templateModel.findByType("post");
			expect(postTemplates).toHaveLength(1);
			expect(postTemplates[0].type).toBe("post");
		});

		it("should find global templates", async () => {
			const globalTemplates = await templateModel.findGlobalTemplates();
			expect(globalTemplates).toHaveLength(2);
		});

		it("should find active templates", async () => {
			const activeTemplates = await templateModel.findActiveTemplates();
			expect(activeTemplates).toHaveLength(2);
		});

		it("should find templates by priority", async () => {
			const priorityTemplates = await templateModel.findByPriority(1);
			expect(priorityTemplates).toHaveLength(0); // No priority property
		});

		it("should duplicate template", async () => {
			const duplicatedTemplate = await templateModel.duplicate(
				"template-1",
				"Duplicated Template",
			);
			expect(duplicatedTemplate.name).toBe("Duplicated Template");
			expect(duplicatedTemplate.type).toBe("page");
			expect(duplicatedTemplate.content).toBe("Page template content");
			expect(duplicatedTemplate.id).not.toBe("template-1");
		});

		it("should throw error when duplicating non-existent template", async () => {
			await expect(
				templateModel.duplicate("non-existent", "New Template"),
			).rejects.toThrow("Template not found");
		});
	});

	describe("Block Model Specialized Methods", () => {
		const blockModel = createBlockModel(testDb);

		beforeEach(async () => {
			await testDb.delete(blockModel as any);
			await testDb.insert(blockModel as any).values({
				id: "block-1",
				type: "text",
				content: "Text block content",
			});
			await testDb.insert(blockModel as any).values({
				id: "block-2",
				type: "image",
				content: "Image block content",
			});
		});

		it("should find blocks by type", async () => {
			const textBlocks = await blockModel.findByType("text");
			expect(textBlocks).toHaveLength(1);
			expect(textBlocks[0].type).toBe("text");

			const imageBlocks = await blockModel.findByType("image");
			expect(imageBlocks).toHaveLength(1);
			expect(imageBlocks[0].type).toBe("image");
		});

		it("should find reusable blocks", async () => {
			const reusableBlocks = await blockModel.findReusableBlocks();
			expect(reusableBlocks).toHaveLength(2);
		});
	});
});

