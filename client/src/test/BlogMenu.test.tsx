import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BlogMenu } from '@/components/PageBuilder/EditorBar/BlogMenu';

// Mock wouter's useLocation hook
const mockSetLocation = vi.fn();
vi.mock('wouter', () => ({
  useLocation: () => ['/', mockSetLocation],
}));

// Mock useContentLists hook
const mockUseContentLists = vi.fn();
vi.mock('@/hooks/useContentLists', () => ({
  useContentLists: mockUseContentLists,
}));

// Mock CreateContentDialog
vi.mock('@/components/PageBuilder/EditorBar/CreateContentDialog', () => ({
  CreateContentDialog: ({ open, onOpenChange, type }: any) =>
    open ? (
      <div data-testid="create-dialog" data-type={type}>
        Create Dialog
        <button onClick={() => onOpenChange(false)}>Close</button>
      </div>
    ) : null,
}));

describe('BlogMenu', () => {
  let queryClient: QueryClient;

  const mockPosts = [
    { id: 'post-1', title: 'First Blog Post', status: 'published' },
    { id: 'post-2', title: 'Second Blog Post', status: 'draft' },
    { id: 'post-3', title: 'Third Blog Post', status: 'published' },
  ];

  beforeEach(() => {
    mockSetLocation.mockClear();
    mockUseContentLists.mockReturnValue({
      posts: mockPosts,
      postsLoading: false,
    });
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  const renderBlogMenu = (props = {}) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <BlogMenu {...props}>
          <button>Blog</button>
        </BlogMenu>
      </QueryClientProvider>
    );
  };

  test('renders trigger button', () => {
    renderBlogMenu();
    expect(screen.getByText('Blog')).toBeInTheDocument();
  });

  test('opens dropdown menu on trigger click', () => {
    renderBlogMenu();
    const trigger = screen.getByText('Blog');
    fireEvent.click(trigger);

    expect(screen.getByText('Browse Posts')).toBeInTheDocument();
    expect(screen.getByText('Create New Post')).toBeInTheDocument();
  });

  test('opens command palette when Browse Posts is clicked', async () => {
    renderBlogMenu();
    
    const trigger = screen.getByText('Blog');
    fireEvent.click(trigger);

    const browseItem = screen.getByText('Browse Posts');
    fireEvent.click(browseItem);

    // Command palette should be visible with posts
    await waitFor(() => {
      expect(screen.getByText('First Blog Post')).toBeInTheDocument();
    });
    expect(screen.getByText('Second Blog Post')).toBeInTheDocument();
    expect(screen.getByText('Third Blog Post')).toBeInTheDocument();
  });

  test('navigates to post edit view when post is selected', async () => {
    renderBlogMenu();
    
    const trigger = screen.getByText('Blog');
    fireEvent.click(trigger);

    const browseItem = screen.getByText('Browse Posts');
    fireEvent.click(browseItem);

    await waitFor(() => {
      expect(screen.getByText('First Blog Post')).toBeInTheDocument();
    });

    const postItem = screen.getByText('First Blog Post');
    fireEvent.click(postItem);

    expect(mockSetLocation).toHaveBeenCalledWith('/posts/post-1/edit');
  });

  test('opens create dialog when Create New Post is clicked', () => {
    renderBlogMenu();
    
    const trigger = screen.getByText('Blog');
    fireEvent.click(trigger);

    const createItem = screen.getByText('Create New Post');
    fireEvent.click(createItem);

    const dialog = screen.getByTestId('create-dialog');
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute('data-type', 'post');
  });

  test('highlights current post in command palette', async () => {
    renderBlogMenu({ currentPostId: 'post-2' });
    
    const trigger = screen.getByText('Blog');
    fireEvent.click(trigger);

    const browseItem = screen.getByText('Browse Posts');
    fireEvent.click(browseItem);

    await waitFor(() => {
      expect(screen.getByText('Second Blog Post')).toBeInTheDocument();
    });

    const currentPostItem = screen.getByText('Second Blog Post').closest('[role]');
    expect(currentPostItem).toHaveClass('bg-accent');
  });

  test('displays post status in command palette', async () => {
    renderBlogMenu();
    
    const trigger = screen.getByText('Blog');
    fireEvent.click(trigger);

    const browseItem = screen.getByText('Browse Posts');
    fireEvent.click(browseItem);

    await waitFor(() => {
      expect(screen.getByText('published')).toBeInTheDocument();
    });
    expect(screen.getByText('draft')).toBeInTheDocument();
  });

  test('shows "All Posts" heading when no blogId is provided', async () => {
    renderBlogMenu();
    
    const trigger = screen.getByText('Blog');
    fireEvent.click(trigger);

    const browseItem = screen.getByText('Browse Posts');
    fireEvent.click(browseItem);

    await waitFor(() => {
      expect(screen.getByText('All Posts')).toBeInTheDocument();
    });
  });

  test('shows "Blog Posts" heading when blogId is provided', async () => {
    renderBlogMenu({ blogId: 'blog-123' });
    
    const trigger = screen.getByText('Blog');
    fireEvent.click(trigger);

    const browseItem = screen.getByText('Browse Posts');
    fireEvent.click(browseItem);

    await waitFor(() => {
      expect(screen.getByText('Blog Posts')).toBeInTheDocument();
    });
  });

  test('passes blogId to useContentLists for filtering', () => {
    renderBlogMenu({ blogId: 'blog-123' });
    
    expect(mockUseContentLists).toHaveBeenCalledWith({ blogId: 'blog-123' });
  });

  test('calls useContentLists without blogId when not provided', () => {
    renderBlogMenu();
    
    expect(mockUseContentLists).toHaveBeenCalledWith({ blogId: undefined });
  });

  test('displays loading state when posts are loading', async () => {
    mockUseContentLists.mockReturnValue({
      posts: [],
      postsLoading: true,
    });

    renderBlogMenu();
    
    const trigger = screen.getByText('Blog');
    fireEvent.click(trigger);

    const browseItem = screen.getByText('Browse Posts');
    fireEvent.click(browseItem);

    await waitFor(() => {
      expect(screen.getByText('Loading posts...')).toBeInTheDocument();
    });
  });

  test('displays "No posts found" when posts array is empty', async () => {
    mockUseContentLists.mockReturnValue({
      posts: [],
      postsLoading: false,
    });

    renderBlogMenu();
    
    const trigger = screen.getByText('Blog');
    fireEvent.click(trigger);

    const browseItem = screen.getByText('Browse Posts');
    fireEvent.click(browseItem);

    await waitFor(() => {
      expect(screen.getByText('No posts found.')).toBeInTheDocument();
    });
  });
});
