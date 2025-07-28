import {
  users,
  posts,
  comments,
  themes,
  plugins,
  options,
  media,
  type User,
  type UpsertUser,
  type Post,
  type InsertPost,
  type Comment,
  type InsertComment,
  type Theme,
  type InsertTheme,
  type Plugin,
  type InsertPlugin,
  type Option,
  type InsertOption,
  type Media,
  type InsertMedia,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, ilike, count } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getUserByUsername(username: string): Promise<User | undefined>;
  
  // Post operations
  getPosts(options?: { status?: string; type?: string; limit?: number; offset?: number }): Promise<Post[]>;
  getPost(id: number): Promise<Post | undefined>;
  getPostBySlug(slug: string): Promise<Post | undefined>;
  createPost(post: InsertPost): Promise<Post>;
  updatePost(id: number, post: Partial<InsertPost>): Promise<Post>;
  deletePost(id: number): Promise<void>;
  getPostsCount(options?: { status?: string; type?: string }): Promise<number>;
  
  // Comment operations
  getComments(postId?: number, options?: { status?: string; limit?: number; offset?: number }): Promise<Comment[]>;
  getComment(id: number): Promise<Comment | undefined>;
  createComment(comment: InsertComment): Promise<Comment>;
  updateComment(id: number, comment: Partial<InsertComment>): Promise<Comment>;
  deleteComment(id: number): Promise<void>;
  getCommentsCount(postId?: number, status?: string): Promise<number>;
  
  // Theme operations
  getThemes(): Promise<Theme[]>;
  getTheme(id: number): Promise<Theme | undefined>;
  getActiveTheme(): Promise<Theme | undefined>;
  createTheme(theme: InsertTheme): Promise<Theme>;
  updateTheme(id: number, theme: Partial<InsertTheme>): Promise<Theme>;
  deleteTheme(id: number): Promise<void>;
  activateTheme(id: number): Promise<void>;
  
  // Plugin operations
  getPlugins(): Promise<Plugin[]>;
  getPlugin(id: number): Promise<Plugin | undefined>;
  createPlugin(plugin: InsertPlugin): Promise<Plugin>;
  updatePlugin(id: number, plugin: Partial<InsertPlugin>): Promise<Plugin>;
  deletePlugin(id: number): Promise<void>;
  activatePlugin(id: number): Promise<void>;
  deactivatePlugin(id: number): Promise<void>;
  
  // Options operations
  getOption(name: string): Promise<Option | undefined>;
  setOption(option: InsertOption): Promise<Option>;
  deleteOption(name: string): Promise<void>;
  
  // Media operations
  getMedia(options?: { limit?: number; offset?: number; mimeType?: string }): Promise<Media[]>;
  getMediaItem(id: number): Promise<Media | undefined>;
  createMedia(mediaItem: InsertMedia): Promise<Media>;
  updateMedia(id: number, mediaItem: Partial<InsertMedia>): Promise<Media>;
  deleteMedia(id: number): Promise<void>;
  getMediaCount(mimeType?: string): Promise<number>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  // Post operations
  async getPosts(options: { status?: string; type?: string; limit?: number; offset?: number } = {}): Promise<Post[]> {
    const { status, type, limit = 10, offset = 0 } = options;
    let query = db.select().from(posts);
    
    const conditions = [];
    if (status) conditions.push(eq(posts.status, status));
    if (type) conditions.push(eq(posts.type, type));
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query.orderBy(desc(posts.createdAt)).limit(limit).offset(offset);
  }

  async getPost(id: number): Promise<Post | undefined> {
    const [post] = await db.select().from(posts).where(eq(posts.id, id));
    return post;
  }

  async getPostBySlug(slug: string): Promise<Post | undefined> {
    const [post] = await db.select().from(posts).where(eq(posts.slug, slug));
    return post;
  }

  async createPost(post: InsertPost): Promise<Post> {
    const [newPost] = await db.insert(posts).values(post).returning();
    return newPost;
  }

  async updatePost(id: number, post: Partial<InsertPost>): Promise<Post> {
    const [updatedPost] = await db
      .update(posts)
      .set({ ...post, updatedAt: new Date() })
      .where(eq(posts.id, id))
      .returning();
    return updatedPost;
  }

  async deletePost(id: number): Promise<void> {
    await db.delete(posts).where(eq(posts.id, id));
  }

  async getPostsCount(options: { status?: string; type?: string } = {}): Promise<number> {
    const { status, type } = options;
    let query = db.select({ count: count() }).from(posts);
    
    const conditions = [];
    if (status) conditions.push(eq(posts.status, status));
    if (type) conditions.push(eq(posts.type, type));
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    const [result] = await query;
    return result.count;
  }

  // Comment operations
  async getComments(postId?: number, options: { status?: string; limit?: number; offset?: number } = {}): Promise<Comment[]> {
    const { status, limit = 10, offset = 0 } = options;
    let query = db.select().from(comments);
    
    const conditions = [];
    if (postId) conditions.push(eq(comments.postId, postId));
    if (status) conditions.push(eq(comments.status, status));
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query.orderBy(desc(comments.createdAt)).limit(limit).offset(offset);
  }

  async getComment(id: number): Promise<Comment | undefined> {
    const [comment] = await db.select().from(comments).where(eq(comments.id, id));
    return comment;
  }

  async createComment(comment: InsertComment): Promise<Comment> {
    const [newComment] = await db.insert(comments).values(comment).returning();
    return newComment;
  }

  async updateComment(id: number, comment: Partial<InsertComment>): Promise<Comment> {
    const [updatedComment] = await db
      .update(comments)
      .set({ ...comment, updatedAt: new Date() })
      .where(eq(comments.id, id))
      .returning();
    return updatedComment;
  }

  async deleteComment(id: number): Promise<void> {
    await db.delete(comments).where(eq(comments.id, id));
  }

  async getCommentsCount(postId?: number, status?: string): Promise<number> {
    let query = db.select({ count: count() }).from(comments);
    
    const conditions = [];
    if (postId) conditions.push(eq(comments.postId, postId));
    if (status) conditions.push(eq(comments.status, status));
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    const [result] = await query;
    return result.count;
  }

  // Theme operations
  async getThemes(): Promise<Theme[]> {
    return await db.select().from(themes).orderBy(themes.name);
  }

  async getTheme(id: number): Promise<Theme | undefined> {
    const [theme] = await db.select().from(themes).where(eq(themes.id, id));
    return theme;
  }

  async getActiveTheme(): Promise<Theme | undefined> {
    const [theme] = await db.select().from(themes).where(eq(themes.isActive, true));
    return theme;
  }

  async createTheme(theme: InsertTheme): Promise<Theme> {
    const [newTheme] = await db.insert(themes).values(theme).returning();
    return newTheme;
  }

  async updateTheme(id: number, theme: Partial<InsertTheme>): Promise<Theme> {
    const [updatedTheme] = await db
      .update(themes)
      .set({ ...theme, updatedAt: new Date() })
      .where(eq(themes.id, id))
      .returning();
    return updatedTheme;
  }

  async deleteTheme(id: number): Promise<void> {
    await db.delete(themes).where(eq(themes.id, id));
  }

  async activateTheme(id: number): Promise<void> {
    // Deactivate all themes first
    await db.update(themes).set({ isActive: false });
    // Activate the selected theme
    await db.update(themes).set({ isActive: true }).where(eq(themes.id, id));
  }

  // Plugin operations
  async getPlugins(): Promise<Plugin[]> {
    return await db.select().from(plugins).orderBy(plugins.name);
  }

  async getPlugin(id: number): Promise<Plugin | undefined> {
    const [plugin] = await db.select().from(plugins).where(eq(plugins.id, id));
    return plugin;
  }

  async createPlugin(plugin: InsertPlugin): Promise<Plugin> {
    const [newPlugin] = await db.insert(plugins).values(plugin).returning();
    return newPlugin;
  }

  async updatePlugin(id: number, plugin: Partial<InsertPlugin>): Promise<Plugin> {
    const [updatedPlugin] = await db
      .update(plugins)
      .set({ ...plugin, updatedAt: new Date() })
      .where(eq(plugins.id, id))
      .returning();
    return updatedPlugin;
  }

  async deletePlugin(id: number): Promise<void> {
    await db.delete(plugins).where(eq(plugins.id, id));
  }

  async activatePlugin(id: number): Promise<void> {
    await db.update(plugins).set({ isActive: true }).where(eq(plugins.id, id));
  }

  async deactivatePlugin(id: number): Promise<void> {
    await db.update(plugins).set({ isActive: false }).where(eq(plugins.id, id));
  }

  // Options operations
  async getOption(name: string): Promise<Option | undefined> {
    const [option] = await db.select().from(options).where(eq(options.name, name));
    return option;
  }

  async setOption(option: InsertOption): Promise<Option> {
    const [newOption] = await db
      .insert(options)
      .values(option)
      .onConflictDoUpdate({
        target: options.name,
        set: { value: option.value },
      })
      .returning();
    return newOption;
  }

  async deleteOption(name: string): Promise<void> {
    await db.delete(options).where(eq(options.name, name));
  }

  // Media operations
  async getMedia(options?: { limit?: number; offset?: number; mimeType?: string }): Promise<Media[]> {
    const { limit = 50, offset = 0, mimeType } = options || {};
    
    let query = db.select().from(media).orderBy(desc(media.createdAt));
    
    if (mimeType) {
      query = query.where(eq(media.mimeType, mimeType));
    }
    
    return await query.limit(limit).offset(offset);
  }

  async getMediaItem(id: number): Promise<Media | undefined> {
    const [mediaItem] = await db.select().from(media).where(eq(media.id, id));
    return mediaItem;
  }

  async createMedia(mediaItem: InsertMedia): Promise<Media> {
    const [newMedia] = await db.insert(media).values(mediaItem).returning();
    return newMedia;
  }

  async updateMedia(id: number, mediaItem: Partial<InsertMedia>): Promise<Media> {
    const [updatedMedia] = await db
      .update(media)
      .set({ ...mediaItem, updatedAt: new Date() })
      .where(eq(media.id, id))
      .returning();
    return updatedMedia;
  }

  async deleteMedia(id: number): Promise<void> {
    await db.delete(media).where(eq(media.id, id));
  }

  async getMediaCount(mimeType?: string): Promise<number> {
    let query = db.select({ count: count() }).from(media);
    
    if (mimeType) {
      query = query.where(eq(media.mimeType, mimeType));
    }
    
    const [result] = await query;
    return result.count;
  }

  // Comment operations
  async getComments(postId?: number, options?: { status?: string; limit?: number; offset?: number }): Promise<Comment[]> {
    const { status = 'approved', limit = 50, offset = 0 } = options || {};
    
    let query = db.select().from(comments).orderBy(desc(comments.createdAt));
    
    const conditions = [];
    if (postId) {
      conditions.push(eq(comments.postId, postId));
    }
    if (status) {
      conditions.push(eq(comments.status, status));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query.limit(limit).offset(offset);
  }

  async getComment(id: number): Promise<Comment | undefined> {
    const [comment] = await db.select().from(comments).where(eq(comments.id, id));
    return comment;
  }

  async createComment(comment: InsertComment): Promise<Comment> {
    const [newComment] = await db.insert(comments).values(comment).returning();
    return newComment;
  }

  async updateComment(id: number, comment: Partial<InsertComment>): Promise<Comment> {
    const [updatedComment] = await db
      .update(comments)
      .set({ ...comment, updatedAt: new Date() })
      .where(eq(comments.id, id))
      .returning();
    return updatedComment;
  }

  async deleteComment(id: number): Promise<void> {
    await db.delete(comments).where(eq(comments.id, id));
  }

  async approveComment(id: number): Promise<Comment> {
    const [approvedComment] = await db
      .update(comments)
      .set({ status: 'approved', updatedAt: new Date() })
      .where(eq(comments.id, id))
      .returning();
    return approvedComment;
  }

  async spamComment(id: number): Promise<Comment> {
    const [spamComment] = await db
      .update(comments)
      .set({ status: 'spam', updatedAt: new Date() })
      .where(eq(comments.id, id))
      .returning();
    return spamComment;
  }

  async getCommentsCount(postId?: number, status?: string): Promise<number> {
    let query = db.select({ count: count() }).from(comments);
    
    const conditions = [];
    if (postId) {
      conditions.push(eq(comments.postId, postId));
    }
    if (status) {
      conditions.push(eq(comments.status, status));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    const [result] = await query;
    return result.count;
  }
}

export const storage = new DatabaseStorage();
