import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertPostSchema, insertCommentSchema, insertThemeSchema, insertPluginSchema, insertMediaSchema } from "@shared/schema";
import hooks from "./hooks";
import themeManager from "./themes";
import multer from "multer";
import path from "path";
import { promises as fs } from "fs";
import express from "express";

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
      hooks.doAction('new_comment', comment);
      res.status(201).json(comment);
    } catch (error) {
      console.error("Error creating comment:", error);
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  app.get('/api/comments/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const comment = await storage.getComment(id);
      
      if (!comment) {
        return res.status(404).json({ message: "Comment not found" });
      }
      
      res.json(comment);
    } catch (error) {
      console.error("Error fetching comment:", error);
      res.status(500).json({ message: "Failed to fetch comment" });
    }
  });

  app.put('/api/comments/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const existingComment = await storage.getComment(id);
      
      if (!existingComment) {
        return res.status(404).json({ message: "Comment not found" });
      }

      const { content, status, authorName, authorEmail } = req.body;
      const updatedComment = await storage.updateComment(id, {
        content,
        status,
        authorName,
        authorEmail
      });

      hooks.doAction('edit_comment', updatedComment);
      res.json(updatedComment);
    } catch (error) {
      console.error("Error updating comment:", error);
      res.status(500).json({ message: "Failed to update comment" });
    }
  });

  app.delete('/api/comments/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const existingComment = await storage.getComment(id);
      
      if (!existingComment) {
        return res.status(404).json({ message: "Comment not found" });
      }

      await storage.deleteComment(id);
      hooks.doAction('delete_comment', id);
      
      res.json({ message: "Comment deleted successfully" });
    } catch (error) {
      console.error("Error deleting comment:", error);
      res.status(500).json({ message: "Failed to delete comment" });
    }
  });

  app.patch('/api/comments/:id/approve', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const comment = await storage.approveComment(id);
      hooks.doAction('approve_comment', comment);
      res.json(comment);
    } catch (error) {
      console.error("Error approving comment:", error);
      res.status(500).json({ message: "Failed to approve comment" });
    }
  });

  app.patch('/api/comments/:id/spam', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const comment = await storage.spamComment(id);
      hooks.doAction('spam_comment', comment);
      res.json(comment);
    } catch (error) {
      console.error("Error marking comment as spam:", error);
      res.status(500).json({ message: "Failed to mark comment as spam" });
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

  // Configure multer for file uploads
  const uploadDir = path.join(process.cwd(), 'uploads');
  
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
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        const name = path.basename(file.originalname, ext);
        cb(null, name + '-' + uniqueSuffix + ext);
      }
    }),
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
      const allowedTypes = [
        'image/jpeg',
        'image/jpg', 
        'image/png',
        'image/gif',
        'image/webp',
        'video/mp4',
        'video/webm',
        'audio/mp3',
        'audio/wav',
        'application/pdf',
        'text/plain'
      ];
      
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('File type not allowed'));
      }
    }
  });

  // Media API (WordPress compatible)
  app.get('/api/media', async (req, res) => {
    try {
      const { page = 1, per_page = 20, mime_type } = req.query;
      const limit = parseInt(per_page as string);
      const offset = (parseInt(page as string) - 1) * limit;

      const mediaItems = await storage.getMedia({
        limit,
        offset,
        mimeType: mime_type as string
      });

      const total = await storage.getMediaCount(mime_type as string);

      res.json({
        media: mediaItems,
        total,
        page: parseInt(page as string),
        per_page: limit,
        total_pages: Math.ceil(total / limit)
      });
    } catch (error) {
      console.error("Error fetching media:", error);
      res.status(500).json({ message: "Failed to fetch media" });
    }
  });

  app.get('/api/media/:id', async (req, res) => {
    try {
      const mediaItem = await storage.getMediaItem(parseInt(req.params.id));
      if (!mediaItem) {
        return res.status(404).json({ message: "Media not found" });
      }
      res.json(mediaItem);
    } catch (error) {
      console.error("Error fetching media item:", error);
      res.status(500).json({ message: "Failed to fetch media item" });
    }
  });

  app.post('/api/media', isAuthenticated, upload.single('file'), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const file = req.file;
      
      if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
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
        alt: alt || '',
        caption: caption || '',
        description: description || '',
        authorId: userId
      });

      const mediaItem = await storage.createMedia(mediaData);
      hooks.doAction('wp_handle_upload', mediaItem);

      res.status(201).json(mediaItem);
    } catch (error) {
      console.error("Error uploading media:", error);
      res.status(500).json({ message: "Failed to upload media" });
    }
  });

  app.put('/api/media/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { alt, caption, description } = req.body;
      
      const mediaItem = await storage.updateMedia(id, {
        alt,
        caption,
        description
      });
      
      hooks.doAction('wp_update_attachment_metadata', mediaItem);
      res.json(mediaItem);
    } catch (error) {
      console.error("Error updating media:", error);
      res.status(500).json({ message: "Failed to update media" });
    }
  });

  app.delete('/api/media/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Get media item to delete the file
      const mediaItem = await storage.getMediaItem(id);
      if (mediaItem) {
        const filePath = path.join(uploadDir, mediaItem.filename);
        try {
          await fs.unlink(filePath);
        } catch (error) {
          console.warn("Could not delete file:", filePath, error);
        }
      }
      
      await storage.deleteMedia(id);
      hooks.doAction('delete_attachment', id);
      
      res.json({ message: "Media deleted successfully" });
    } catch (error) {
      console.error("Error deleting media:", error);
      res.status(500).json({ message: "Failed to delete media" });
    }
  });

  // Theme rendering routes
  app.get('/posts/:id', async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      const post = await storage.getPost(postId);
      
      if (!post) {
        const html = themeManager.render404();
        return res.status(404).send(html);
      }

      // Get site settings for theme context
      const siteSettings = {
        name: 'NextPress',
        description: 'A modern WordPress alternative',
        url: `${req.protocol}://${req.get('host')}`
      };

      const html = await themeManager.renderContent('single-post', {
        post,
        site: siteSettings
      });

      res.setHeader('Content-Type', 'text/html');
      res.send(html);
    } catch (error) {
      console.error("Error rendering post:", error);
      const html = themeManager.render404();
      res.status(500).send(html);
    }
  });

  app.get('/pages/:id', async (req, res) => {
    try {
      const pageId = parseInt(req.params.id);
      const page = await storage.getPost(pageId); // Pages use same storage as posts
      
      if (!page || page.type !== 'page') {
        const html = themeManager.render404();
        return res.status(404).send(html);
      }

      const siteSettings = {
        name: 'NextPress',
        description: 'A modern WordPress alternative',
        url: `${req.protocol}://${req.get('host')}`
      };

      const html = await themeManager.renderContent('page', {
        page,
        site: siteSettings
      });

      res.setHeader('Content-Type', 'text/html');
      res.send(html);
    } catch (error) {
      console.error("Error rendering page:", error);
      const html = themeManager.render404();
      res.status(500).send(html);
    }
  });

  app.get('/home', async (req, res) => {
    try {
      const posts = await storage.getPosts(1, 10, 'published');
      
      const siteSettings = {
        name: 'NextPress',
        description: 'A modern WordPress alternative',
        url: `${req.protocol}://${req.get('host')}`
      };

      const html = await themeManager.renderContent('home', {
        posts: posts.posts,
        site: siteSettings
      });

      res.setHeader('Content-Type', 'text/html');
      res.send(html);
    } catch (error) {
      console.error("Error rendering home:", error);
      const html = themeManager.render404();
      res.status(500).send(html);
    }
  });

  // Serve uploaded files
  app.use('/uploads', express.static(uploadDir));

  const httpServer = createServer(app);
  
  // Signal that NextPress is fully loaded
  hooks.doAction('wp_loaded');
  
  return httpServer;
}
