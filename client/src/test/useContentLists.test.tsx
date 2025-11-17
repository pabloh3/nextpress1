import { renderHook, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useContentLists } from '@/hooks/useContentLists';
import type { Post, Template, Theme } from '@shared/schema-types';

// Mock data
const mockPages: Post[] = [
  {
    id: 'page-1',
    title: 'Home Page',
    slug: 'home',
    authorId: 'author-1',
    status: 'published',
    blogId: null,
    excerpt: null,
    password: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    other: null,
    publishedAt: null,
    settings: null,
    featuredImage: null,
    templateId: null,
  },
  {
    id: 'page-2',
    title: 'About Page',
    slug: 'about',
    authorId: 'author-1',
    status: 'draft',
    blogId: null,
    excerpt: null,
    password: null,
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
    other: null,
    publishedAt: null,
    settings: null,
    featuredImage: null,
    templateId: null,
  },
];

const mockPosts: Post[] = [
  {
    id: 'post-1',
    title: 'First Post',
    slug: 'first-post',
    authorId: 'author-1',
    status: 'published',
    blogId: 'blog-1',
    excerpt: null,
    password: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    other: null,
    publishedAt: null,
    settings: null,
    featuredImage: null,
    templateId: null,
  },
  {
    id: 'post-2',
    title: 'Second Post',
    slug: 'second-post',
    authorId: 'author-1',
    status: 'published',
    blogId: 'blog-2',
    excerpt: null,
    password: null,
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
    other: null,
    publishedAt: null,
    settings: null,
    featuredImage: null,
    templateId: null,
  },
  {
    id: 'post-3',
    title: 'Third Post',
    slug: 'third-post',
    authorId: 'author-1',
    status: 'draft',
    blogId: 'blog-1',
    excerpt: null,
    password: null,
    createdAt: new Date('2024-01-03'),
    updatedAt: new Date('2024-01-03'),
    other: null,
    publishedAt: null,
    settings: null,
    featuredImage: null,
    templateId: null,
  },
];

const mockTemplates: Template[] = [
  {
    id: 'template-1',
    name: 'Basic Template',
    type: 'page',
    authorId: 'author-1',
    description: 'A basic page template',
    blocks: [],
    settings: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    other: null,
  },
];

const mockThemes: Theme[] = [
  {
    id: 'theme-1',
    name: 'Default Theme',
    authorId: 'author-1',
    version: '1.0.0',
    status: 'active',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    other: null,
    description: null,
    settings: null,
    requires: '',
    isPaid: null,
    price: null,
    currency: null,
  },
];

describe('useContentLists', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
        },
      },
    });

    // Mock fetch for all API calls
    global.fetch = vi.fn((url: string) => {
      if (url.includes('/api/pages')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockPages,
        } as Response);
      }
      if (url.includes('/api/posts')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockPosts,
        } as Response);
      }
      if (url.includes('/api/templates')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockTemplates,
        } as Response);
      }
      if (url.includes('/api/themes')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockThemes,
        } as Response);
      }
      return Promise.reject(new Error('Unknown endpoint'));
    }) as any;
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  test('fetches and returns all content lists', async () => {
    const { result } = renderHook(() => useContentLists(), { wrapper });

    // Initially loading
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Check that all data is loaded
    expect(result.current.pages).toHaveLength(2);
    expect(result.current.posts).toHaveLength(3);
    expect(result.current.templates).toHaveLength(1);
    expect(result.current.themes).toHaveLength(1);
  });

  test('returns empty arrays while loading', () => {
    const { result } = renderHook(() => useContentLists(), { wrapper });

    expect(result.current.pages).toEqual([]);
    expect(result.current.posts).toEqual([]);
    expect(result.current.templates).toEqual([]);
    expect(result.current.themes).toEqual([]);
  });

  test('filters posts by blogId when provided', async () => {
    const { result } = renderHook(() => useContentLists({ blogId: 'blog-1' }), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should only return posts with blogId 'blog-1'
    expect(result.current.posts).toHaveLength(2);
    expect(result.current.posts.every((post) => post.blogId === 'blog-1')).toBe(
      true
    );
    expect(result.current.posts.map((p) => p.id)).toEqual([
      'post-1',
      'post-3',
    ]);
  });

  test('returns all posts when blogId is not provided', async () => {
    const { result } = renderHook(() => useContentLists(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should return all posts
    expect(result.current.posts).toHaveLength(3);
  });

  test('returns all posts when blogId is null', async () => {
    const { result } = renderHook(() => useContentLists({ blogId: null }), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should return all posts when explicitly null
    expect(result.current.posts).toHaveLength(3);
  });

  test('filters posts correctly for different blogIds', async () => {
    const { result, rerender } = renderHook(
      ({ blogId }: { blogId?: string | null }) => useContentLists({ blogId }),
      {
        wrapper,
        initialProps: { blogId: 'blog-1' },
      }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.posts).toHaveLength(2);
    expect(result.current.posts.map((p) => p.id)).toEqual([
      'post-1',
      'post-3',
    ]);

    // Change to blog-2
    rerender({ blogId: 'blog-2' });

    await waitFor(() => {
      expect(result.current.posts).toHaveLength(1);
    });

    expect(result.current.posts[0].id).toBe('post-2');
  });

  test('provides individual loading states', async () => {
    const { result } = renderHook(() => useContentLists(), { wrapper });

    expect(result.current.pagesLoading).toBe(true);
    expect(result.current.postsLoading).toBe(true);
    expect(result.current.templatesLoading).toBe(true);
    expect(result.current.themesLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.pagesLoading).toBe(false);
      expect(result.current.postsLoading).toBe(false);
      expect(result.current.templatesLoading).toBe(false);
      expect(result.current.themesLoading).toBe(false);
    });
  });

  test('combined loading state is true if any query is loading', () => {
    const { result } = renderHook(() => useContentLists(), { wrapper });

    // At least one should be loading initially
    expect(result.current.isLoading).toBe(true);
  });

  test('hasError is false when all queries succeed', async () => {
    const { result } = renderHook(() => useContentLists(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.hasError).toBe(false);
  });

  test('hasError is true when any query fails', async () => {
    // Mock a failed request
    global.fetch = vi.fn((url: string) => {
      if (url.includes('/api/pages')) {
        return Promise.reject(new Error('Network error'));
      }
      return Promise.resolve({
        ok: true,
        json: async () => [],
      } as Response);
    }) as any;

    const { result } = renderHook(() => useContentLists(), { wrapper });

    await waitFor(() => {
      expect(result.current.hasError).toBe(true);
    });
  });

  test('pages are not affected by blogId filter', async () => {
    const { result } = renderHook(() => useContentLists({ blogId: 'blog-1' }), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Pages should always return all pages regardless of blogId
    expect(result.current.pages).toHaveLength(2);
  });

  test('templates and themes are not affected by blogId filter', async () => {
    const { result } = renderHook(() => useContentLists({ blogId: 'blog-1' }), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Templates and themes should not be affected by blogId
    expect(result.current.templates).toHaveLength(1);
    expect(result.current.themes).toHaveLength(1);
  });
});
