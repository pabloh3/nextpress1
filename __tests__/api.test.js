/**
 * Test suite for NextPress API endpoints
 * Tests WordPress-compatible REST API routes
 */

const request = require('supertest');
const express = require('express');
const { registerRoutes } = require('../server/routes');

// Mock storage
const mockStorage = {
  getPosts: jest.fn(),
  getPost: jest.fn(),
  createPost: jest.fn(),
  updatePost: jest.fn(),
  deletePost: jest.fn(),
  getPostsCount: jest.fn(),
  getComments: jest.fn(),
  createComment: jest.fn(),
  getCommentsCount: jest.fn(),
  getThemes: jest.fn(),
  getActiveTheme: jest.fn(),
  getOption: jest.fn(),
  setOption: jest.fn(),
  getUser: jest.fn(),
  upsertUser: jest.fn(),
};

// Mock dependencies
jest.mock('../server/storage', () => ({
  storage: mockStorage
}));

jest.mock('../server/replitAuth', () => ({
  setupAuth: jest.fn().mockResolvedValue(undefined),
  isAuthenticated: (req, res, next) => {
    req.user = { claims: { sub: 'test-user-id' } };
    next();
  }
}));

jest.mock('../server/hooks', () => ({
  default: {
    doAction: jest.fn(),
    applyFilters: jest.fn((tag, value) => value),
    getActions: jest.fn().mockReturnValue(['init', 'wp_loaded']),
    getFilters: jest.fn().mockReturnValue(['the_content', 'the_title'])
  }
}));

jest.mock('../server/themes', () => ({
  default: {
    activateTheme: jest.fn()
  }
}));

describe('NextPress API Endpoints', () => {
  let app;
  let server;

  beforeEach(async () => {
    app = express();
    app.use(express.json());
    server = await registerRoutes(app);
    jest.clearAllMocks();
  });

  describe('Posts API', () => {
    describe('GET /api/posts', () => {
      test('should return posts with pagination', async () => {
        const mockPosts = [
          { id: 1, title: 'Test Post 1', content: 'Content 1', status: 'publish' },
          { id: 2, title: 'Test Post 2', content: 'Content 2', status: 'publish' }
        ];
        
        mockStorage.getPosts.mockResolvedValue(mockPosts);
        mockStorage.getPostsCount.mockResolvedValue(2);

        const response = await request(app)
          .get('/api/posts')
          .expect(200);

        expect(response.body).toMatchObject({
          posts: mockPosts,
          total: 2,
          page: 1,
          per_page: 10,
          total_pages: 1
        });

        expect(mockStorage.getPosts).toHaveBeenCalledWith({
          status: 'publish',
          type: 'post',
          limit: 10,
          offset: 0
        });
      });

      test('should filter posts by status and type', async () => {
        const mockPosts = [];
        mockStorage.getPosts.mockResolvedValue(mockPosts);
        mockStorage.getPostsCount.mockResolvedValue(0);

        await request(app)
          .get('/api/posts?status=draft&type=page&per_page=5')
          .expect(200);

        expect(mockStorage.getPosts).toHaveBeenCalledWith({
          status: 'draft',
          type: 'page',
          limit: 5,
          offset: 0
        });
      });
    });

    describe('GET /api/posts/:id', () => {
      test('should return single post', async () => {
        const mockPost = { id: 1, title: 'Test Post', content: 'Content' };
        mockStorage.getPost.mockResolvedValue(mockPost);

        const response = await request(app)
          .get('/api/posts/1')
          .expect(200);

        expect(response.body).toEqual(mockPost);
        expect(mockStorage.getPost).toHaveBeenCalledWith(1);
      });

      test('should return 404 for nonexistent post', async () => {
        mockStorage.getPost.mockResolvedValue(undefined);

        await request(app)
          .get('/api/posts/999')
          .expect(404);
      });
    });

    describe('POST /api/posts', () => {
      test('should create new post', async () => {
        const newPost = {
          title: 'New Post',
          content: 'New content',
          status: 'draft'
        };
        
        const createdPost = { 
          id: 1, 
          ...newPost, 
          slug: 'new-post',
          authorId: 'test-user-id'
        };
        
        mockStorage.createPost.mockResolvedValue(createdPost);

        const response = await request(app)
          .post('/api/posts')
          .send(newPost)
          .expect(201);

        expect(response.body).toEqual(createdPost);
        expect(mockStorage.createPost).toHaveBeenCalledWith({
          ...newPost,
          slug: 'new-post',
          authorId: 'test-user-id'
        });
      });

      test('should auto-generate slug from title', async () => {
        const newPost = {
          title: 'Post With Special Characters!@#',
          content: 'Content'
        };

        mockStorage.createPost.mockResolvedValue({ id: 1, ...newPost });

        await request(app)
          .post('/api/posts')
          .send(newPost);

        expect(mockStorage.createPost).toHaveBeenCalledWith(
          expect.objectContaining({
            slug: 'post-with-special-characters'
          })
        );
      });
    });

    describe('PUT /api/posts/:id', () => {
      test('should update existing post', async () => {
        const existingPost = { id: 1, title: 'Old Title', status: 'draft' };
        const updatedData = { title: 'New Title', status: 'publish' };
        const updatedPost = { ...existingPost, ...updatedData };

        mockStorage.getPost.mockResolvedValue(existingPost);
        mockStorage.updatePost.mockResolvedValue(updatedPost);

        const response = await request(app)
          .put('/api/posts/1')
          .send(updatedData)
          .expect(200);

        expect(response.body).toEqual(updatedPost);
        expect(mockStorage.updatePost).toHaveBeenCalledWith(1, updatedData);
      });

      test('should return 404 for nonexistent post', async () => {
        mockStorage.getPost.mockResolvedValue(undefined);

        await request(app)
          .put('/api/posts/999')
          .send({ title: 'Updated' })
          .expect(404);
      });
    });

    describe('DELETE /api/posts/:id', () => {
      test('should delete existing post', async () => {
        const existingPost = { id: 1, title: 'Post to Delete' };
        mockStorage.getPost.mockResolvedValue(existingPost);
        mockStorage.deletePost.mockResolvedValue();

        await request(app)
          .delete('/api/posts/1')
          .expect(200);

        expect(mockStorage.deletePost).toHaveBeenCalledWith(1);
      });

      test('should return 404 for nonexistent post', async () => {
        mockStorage.getPost.mockResolvedValue(undefined);

        await request(app)
          .delete('/api/posts/999')
          .expect(404);
      });
    });
  });

  describe('Comments API', () => {
    describe('GET /api/comments', () => {
      test('should return comments with pagination', async () => {
        const mockComments = [
          { id: 1, postId: 1, content: 'Great post!', status: 'approved' },
          { id: 2, postId: 1, content: 'Thanks for sharing', status: 'approved' }
        ];

        mockStorage.getComments.mockResolvedValue(mockComments);
        mockStorage.getCommentsCount.mockResolvedValue(2);

        const response = await request(app)
          .get('/api/comments')
          .expect(200);

        expect(response.body).toMatchObject({
          comments: mockComments,
          total: 2,
          page: 1,
          per_page: 10,
          total_pages: 1
        });
      });

      test('should filter comments by post ID', async () => {
        mockStorage.getComments.mockResolvedValue([]);
        mockStorage.getCommentsCount.mockResolvedValue(0);

        await request(app)
          .get('/api/comments?post_id=1')
          .expect(200);

        expect(mockStorage.getComments).toHaveBeenCalledWith(1, {
          status: 'approved',
          limit: 10,
          offset: 0
        });
      });
    });

    describe('POST /api/comments', () => {
      test('should create new comment', async () => {
        const newComment = {
          postId: 1,
          content: 'New comment',
          authorName: 'John Doe',
          authorEmail: 'john@example.com'
        };

        const createdComment = { id: 1, ...newComment, status: 'pending' };
        mockStorage.createComment.mockResolvedValue(createdComment);

        const response = await request(app)
          .post('/api/comments')
          .send(newComment)
          .expect(201);

        expect(response.body).toEqual(createdComment);
        expect(mockStorage.createComment).toHaveBeenCalledWith(newComment);
      });
    });
  });

  describe('Themes API', () => {
    describe('GET /api/themes', () => {
      test('should return all themes', async () => {
        const mockThemes = [
          { id: 1, name: 'Next Theme', isActive: true, renderer: 'nextjs' },
          { id: 2, name: 'React Theme', isActive: false, renderer: 'react' }
        ];

        mockStorage.getThemes.mockResolvedValue(mockThemes);

        const response = await request(app)
          .get('/api/themes')
          .expect(200);

        expect(response.body).toEqual(mockThemes);
      });
    });

    describe('GET /api/themes/active', () => {
      test('should return active theme', async () => {
        const activeTheme = { id: 1, name: 'Next Theme', isActive: true };
        mockStorage.getActiveTheme.mockResolvedValue(activeTheme);

        const response = await request(app)
          .get('/api/themes/active')
          .expect(200);

        expect(response.body).toEqual(activeTheme);
      });
    });
  });

  describe('Options API', () => {
    describe('GET /api/options/:name', () => {
      test('should return option value', async () => {
        const option = { name: 'site_title', value: 'My NextPress Site' };
        mockStorage.getOption.mockResolvedValue(option);

        const response = await request(app)
          .get('/api/options/site_title')
          .expect(200);

        expect(response.body).toEqual(option);
      });

      test('should return 404 for nonexistent option', async () => {
        mockStorage.getOption.mockResolvedValue(undefined);

        await request(app)
          .get('/api/options/nonexistent')
          .expect(404);
      });
    });

    describe('POST /api/options', () => {
      test('should set option value', async () => {
        const optionData = { name: 'site_title', value: 'New Site Title' };
        const savedOption = { ...optionData, id: 1 };
        
        mockStorage.setOption.mockResolvedValue(savedOption);

        const response = await request(app)
          .post('/api/options')
          .send(optionData)
          .expect(200);

        expect(response.body).toEqual(savedOption);
        expect(mockStorage.setOption).toHaveBeenCalledWith(optionData);
      });
    });
  });

  describe('Dashboard Stats', () => {
    test('should return dashboard statistics', async () => {
      mockStorage.getPostsCount
        .mockResolvedValueOnce(5) // posts count
        .mockResolvedValueOnce(3); // pages count
      mockStorage.getCommentsCount.mockResolvedValue(12);

      const response = await request(app)
        .get('/api/dashboard/stats')
        .expect(200);

      expect(response.body).toEqual({
        posts: 5,
        pages: 3,
        comments: 12,
        users: 1
      });
    });
  });

  describe('Hooks API', () => {
    test('should return registered hooks', async () => {
      const response = await request(app)
        .get('/api/hooks')
        .expect(200);

      expect(response.body).toMatchObject({
        actions: expect.arrayContaining(['init', 'wp_loaded']),
        filters: expect.arrayContaining(['the_content', 'the_title'])
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle storage errors gracefully', async () => {
      mockStorage.getPosts.mockRejectedValue(new Error('Database error'));

      await request(app)
        .get('/api/posts')
        .expect(500);
    });

    test('should validate request data', async () => {
      // Invalid post data (missing required fields)
      await request(app)
        .post('/api/posts')
        .send({ invalid: 'data' })
        .expect(500); // Should fail validation
    });
  });
});
