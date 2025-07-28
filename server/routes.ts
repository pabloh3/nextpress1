import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertPostSchema, insertCommentSchema, insertThemeSchema, insertPluginSchema } from "@shared/schema";
import hooks from "./hooks";
import themeManager from "./themes";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Initialize hooks
  hooks.doAction('init');

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      console.log('Auth route - User object:', JSON.stringify(req.user, null, 2));
      const userId = req.user?.claims?.sub;
      
      if (!userId) {
        console.error('No user ID found in auth request');
        return res.status(500).json({ message: "User ID not found" });
      }
      
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Dashboard stats
  app.get('/api/dashboard/stats', isAuthenticated, async (req, res) => {
    try {
      const [postsCount, pagesCount, commentsCount, usersCount] = await Promise.all([
        storage.getPostsCount({ status: 'publish', type: 'post' }),
        storage.getPostsCount({ status: 'publish', type: 'page' }),
        storage.getCommentsCount(undefined, 'approved'),
        1 // Simplified for now
      ]);

      res.json({
        posts: postsCount,
        pages: pagesCount,
        comments: commentsCount,
        users: usersCount
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Posts API (WordPress compatible)
  app.get('/api/posts', async (req, res) => {
    try {
      const { status = 'publish', type = 'post', page = 1, per_page = 10 } = req.query;
      const limit = parseInt(per_page as string);
      const offset = (parseInt(page as string) - 1) * limit;

      const posts = await storage.getPosts({
        status: status as string,
        type: type as string,
        limit,
        offset
      });

      const total = await storage.getPostsCount({
        status: status as string,
        type: type as string
      });

      res.json({
        posts,
        total,
        page: parseInt(page as string),
        per_page: limit,
        total_pages: Math.ceil(total / limit)
      });
    } catch (error) {
      console.error("Error fetching posts:", error);
      res.status(500).json({ message: "Failed to fetch posts" });
    }
  });

  app.get('/api/posts/:id', async (req, res) => {
    try {
      const post = await storage.getPost(parseInt(req.params.id));
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      res.json(post);
    } catch (error) {
      console.error("Error fetching post:", error);
      res.status(500).json({ message: "Failed to fetch post" });
    }
  });

  app.post('/api/posts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Add authorId to request body before parsing
      const requestData = { ...req.body, authorId: userId };
      const postData = insertPostSchema.parse(requestData);
      
      // Generate slug if not provided
      if (!postData.slug) {
        postData.slug = postData.title.toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');
      }

      const post = await storage.createPost(postData);
      hooks.doAction('save_post', post);
      
      if (post.status === 'publish') {
        hooks.doAction('publish_post', post);
      }

      res.status(201).json(post);
    } catch (error) {
      console.error("Error creating post:", error);
      res.status(500).json({ message: "Failed to create post" });
    }
  });

  app.put('/api/posts/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const postData = insertPostSchema.partial().parse(req.body);
      
      const existingPost = await storage.getPost(id);
      if (!existingPost) {
        return res.status(404).json({ message: "Post not found" });
      }

      const wasPublished = existingPost.status === 'publish';
      const post = await storage.updatePost(id, postData);
      
      hooks.doAction('save_post', post);
      
      if (!wasPublished && post.status === 'publish') {
        hooks.doAction('publish_post', post);
      }

      res.json(post);
    } catch (error) {
      console.error("Error updating post:", error);
      res.status(500).json({ message: "Failed to update post" });
    }
  });

  app.delete('/api/posts/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const post = await storage.getPost(id);
      
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      await storage.deletePost(id);
      hooks.doAction('delete_post', id);
      
      res.json({ message: "Post deleted successfully" });
    } catch (error) {
      console.error("Error deleting post:", error);
      res.status(500).json({ message: "Failed to delete post" });
    }
  });

  // Comments API
  app.get('/api/comments', async (req, res) => {
    try {
      const { post_id, status = 'approved', page = 1, per_page = 10 } = req.query;
      const limit = parseInt(per_page as string);
      const offset = (parseInt(page as string) - 1) * limit;

      const comments = await storage.getComments(
        post_id ? parseInt(post_id as string) : undefined,
        { status: status as string, limit, offset }
      );

      const total = await storage.getCommentsCount(
        post_id ? parseInt(post_id as string) : undefined,
        status as string
      );

      res.json({
        comments,
        total,
        page: parseInt(page as string),
        per_page: limit,
        total_pages: Math.ceil(total / limit)
      });
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  app.post('/api/comments', async (req, res) => {
    try {
      const commentData = insertCommentSchema.parse(req.body);
      const comment = await storage.createComment(commentData);
      res.status(201).json(comment);
    } catch (error) {
      console.error("Error creating comment:", error);
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  // Themes API
  app.get('/api/themes', isAuthenticated, async (req, res) => {
    try {
      const themes = await storage.getThemes();
      res.json(themes);
    } catch (error) {
      console.error("Error fetching themes:", error);
      res.status(500).json({ message: "Failed to fetch themes" });
    }
  });

  app.get('/api/themes/active', async (req, res) => {
    try {
      const theme = await storage.getActiveTheme();
      res.json(theme);
    } catch (error) {
      console.error("Error fetching active theme:", error);
      res.status(500).json({ message: "Failed to fetch active theme" });
    }
  });

  app.post('/api/themes/:id/activate', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const theme = await themeManager.activateTheme(id);
      res.json(theme);
    } catch (error) {
      console.error("Error activating theme:", error);
      res.status(500).json({ message: "Failed to activate theme" });
    }
  });

  // Plugins API
  app.get('/api/plugins', isAuthenticated, async (req, res) => {
    try {
      const plugins = await storage.getPlugins();
      res.json(plugins);
    } catch (error) {
      console.error("Error fetching plugins:", error);
      res.status(500).json({ message: "Failed to fetch plugins" });
    }
  });

  // Hooks API (for development/debugging)
  app.get('/api/hooks', isAuthenticated, async (req, res) => {
    try {
      res.json({
        actions: hooks.getActions(),
        filters: hooks.getFilters()
      });
    } catch (error) {
      console.error("Error fetching hooks:", error);
      res.status(500).json({ message: "Failed to fetch hooks" });
    }
  });

  // Options API (WordPress compatible)
  app.get('/api/options/:name', async (req, res) => {
    try {
      const option = await storage.getOption(req.params.name);
      if (!option) {
        return res.status(404).json({ message: "Option not found" });
      }
      res.json(option);
    } catch (error) {
      console.error("Error fetching option:", error);
      res.status(500).json({ message: "Failed to fetch option" });
    }
  });

  app.post('/api/options', isAuthenticated, async (req, res) => {
    try {
      const { name, value } = req.body;
      const option = await storage.setOption({ name, value });
      res.json(option);
    } catch (error) {
      console.error("Error setting option:", error);
      res.status(500).json({ message: "Failed to set option" });
    }
  });

  const httpServer = createServer(app);
  
  // Signal that NextPress is fully loaded
  hooks.doAction('wp_loaded');
  
  return httpServer;
}
