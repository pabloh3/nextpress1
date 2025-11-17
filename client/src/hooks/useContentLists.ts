import { useQuery } from '@tanstack/react-query';
import type { Post, Template, Theme } from '@shared/schema-types';

interface UseContentListsOptions {
  blogId?: string | null;
}

/**
 * Centralized hook for fetching content lists used in EditorBar
 * Provides data for Pages, Blog Posts, Templates, and Themes menus
 * 
 * @param options.blogId - Optional blog ID to filter posts by specific blog
 */
export function useContentLists(options: UseContentListsOptions = {}) {
  const { blogId } = options;

  // Fetch all pages (posts with type='page')
  const {
    data: pages,
    isLoading: pagesLoading,
    error: pagesError,
  } = useQuery<Post[] | { pages: Post[] }, Error, Post[]>({
    queryKey: ['/api/pages'],
    // The /api/pages endpoint returns an object { pages, total, ... }
    // but some tests/mock setups may return just an array. Normalize both.
    select: (data) => {
      if (!data) return [] as Post[];
      if (Array.isArray(data)) return data as Post[];
      const maybePages = (data as any).pages;
      return Array.isArray(maybePages) ? maybePages : ([] as Post[]);
    },
  });

  // Fetch posts with optional blog filtering
  const {
    data: posts,
    isLoading: postsLoading,
    error: postsError,
  } = useQuery<Post[] | { posts: Post[] }, Error, Post[]>({
    queryKey: blogId ? ['/api/posts', { blogId }] : ['/api/posts'],
    // Normalize API shape and apply client-side filtering if needed
    select: (data) => {
      let list: Post[];
      if (!data) list = [] as Post[];
      else if (Array.isArray(data)) list = data as Post[];
      else list = Array.isArray((data as any).posts) ? (data as any).posts : ([] as Post[]);
      if (!blogId) return list;
      return list.filter((post) => post.blogId === blogId);
    },
  });

  // Fetch all templates
  const {
    data: templates,
    isLoading: templatesLoading,
    error: templatesError,
  } = useQuery<Template[] | { templates: Template[] }, Error, Template[]>({
    queryKey: ['/api/templates'],
    // Normalize { templates, ... } to an array
    select: (data) => {
      if (!data) return [] as Template[];
      if (Array.isArray(data)) return data as Template[];
      const maybe = (data as any).templates;
      return Array.isArray(maybe) ? maybe : ([] as Template[]);
    },
  });

  // Fetch all themes
  const {
    data: themes,
    isLoading: themesLoading,
    error: themesError,
  } = useQuery<Theme[]>({
    queryKey: ['/api/themes'],
  });

  return {
    // Pages data
    pages: pages || [],
    pagesLoading,
    pagesError,

    // Posts data
    posts: posts || [],
    postsLoading,
    postsError,

    // Templates data
    templates: templates || [],
    templatesLoading,
    templatesError,

    // Themes data
    themes: themes || [],
    themesLoading,
    themesError,

    // Combined loading state
    isLoading:
      pagesLoading || postsLoading || templatesLoading || themesLoading,

    // Combined error state
    hasError: !!(pagesError || postsError || templatesError || themesError),
  };
}
