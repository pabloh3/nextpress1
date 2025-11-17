import { render, screen } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import { EditorBar } from '@/components/PageBuilder/EditorBar/EditorBar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock the sub-components to test EditorBar in isolation
vi.mock('@/components/PageBuilder/EditorBar/SiteMenu', () => ({
  SiteMenu: ({ children }: any) => <div data-testid="site-menu">{children}</div>,
}));

vi.mock('@/components/PageBuilder/EditorBar/PagesMenu', () => ({
  PagesMenu: ({ children, currentPageId }: any) => (
    <div data-testid="pages-menu" data-current-page={currentPageId}>
      {children}
    </div>
  ),
}));

vi.mock('@/components/PageBuilder/EditorBar/BlogMenu', () => ({
  BlogMenu: ({ children, currentPostId, blogId }: any) => (
    <div
      data-testid="blog-menu"
      data-current-post={currentPostId}
      data-blog-id={blogId}
    >
      {children}
    </div>
  ),
}));

vi.mock('@/components/PageBuilder/EditorBar/DesignMenu', () => ({
  DesignMenu: ({ children, currentPostId, currentType }: any) => (
    <div
      data-testid="design-menu"
      data-current-post={currentPostId}
      data-current-type={currentType}
    >
      {children}
    </div>
  ),
}));

describe('EditorBar', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  const renderEditorBar = (props = {}) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <EditorBar {...props} />
      </QueryClientProvider>
    );
  };

  test('renders all four menu components', () => {
    renderEditorBar();

    expect(screen.getByTestId('site-menu')).toBeInTheDocument();
    expect(screen.getByTestId('pages-menu')).toBeInTheDocument();
    expect(screen.getByTestId('blog-menu')).toBeInTheDocument();
    expect(screen.getByTestId('design-menu')).toBeInTheDocument();
  });

  test('renders menu buttons with correct labels', () => {
    renderEditorBar();

    expect(screen.getByText('Site')).toBeInTheDocument();
    expect(screen.getByText('Pages')).toBeInTheDocument();
    expect(screen.getByText('Blog')).toBeInTheDocument();
    expect(screen.getByText('Design')).toBeInTheDocument();
  });

  test('passes currentPostId to PagesMenu correctly', () => {
    renderEditorBar({ currentPostId: 'page-123' });

    const pagesMenu = screen.getByTestId('pages-menu');
    expect(pagesMenu).toHaveAttribute('data-current-page', 'page-123');
  });

  test('passes currentPostId and blogId to BlogMenu correctly', () => {
    renderEditorBar({ currentPostId: 'post-456', currentBlogId: 'blog-789' });

    const blogMenu = screen.getByTestId('blog-menu');
    expect(blogMenu).toHaveAttribute('data-current-post', 'post-456');
    expect(blogMenu).toHaveAttribute('data-blog-id', 'blog-789');
  });

  test('passes currentPostId and currentType to DesignMenu correctly', () => {
    renderEditorBar({ currentPostId: 'post-123', currentType: 'post' });

    const designMenu = screen.getByTestId('design-menu');
    expect(designMenu).toHaveAttribute('data-current-post', 'post-123');
    expect(designMenu).toHaveAttribute('data-current-type', 'post');
  });

  test('handles all props together', () => {
    renderEditorBar({
      currentPostId: 'content-999',
      currentType: 'page',
      currentBlogId: 'blog-111',
    });

    const pagesMenu = screen.getByTestId('pages-menu');
    const blogMenu = screen.getByTestId('blog-menu');
    const designMenu = screen.getByTestId('design-menu');

    expect(pagesMenu).toHaveAttribute('data-current-page', 'content-999');
    expect(blogMenu).toHaveAttribute('data-current-post', 'content-999');
    expect(blogMenu).toHaveAttribute('data-blog-id', 'blog-111');
    expect(designMenu).toHaveAttribute('data-current-post', 'content-999');
    expect(designMenu).toHaveAttribute('data-current-type', 'page');
  });

  test('renders without any props', () => {
    renderEditorBar();

    // Should render all menus even without props
    expect(screen.getByTestId('site-menu')).toBeInTheDocument();
    expect(screen.getByTestId('pages-menu')).toBeInTheDocument();
    expect(screen.getByTestId('blog-menu')).toBeInTheDocument();
    expect(screen.getByTestId('design-menu')).toBeInTheDocument();
  });
});
