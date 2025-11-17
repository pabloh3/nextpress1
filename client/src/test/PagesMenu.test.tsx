import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PagesMenu } from '@/components/PageBuilder/EditorBar/PagesMenu';

// Mock wouter's useLocation hook
const mockSetLocation = vi.fn();
vi.mock('wouter', () => ({
  useLocation: () => ['/', mockSetLocation],
}));

// Mock useContentLists hook
vi.mock('@/hooks/useContentLists', () => ({
  useContentLists: vi.fn(() => ({
    pages: [
      { id: 'page-1', title: 'Home Page', status: 'published' },
      { id: 'page-2', title: 'About Page', status: 'draft' },
      { id: 'page-3', title: 'Contact Page', status: 'published' },
    ],
    pagesLoading: false,
  })),
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

describe('PagesMenu', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    mockSetLocation.mockClear();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  const renderPagesMenu = (props = {}) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <PagesMenu {...props}>
          <button>Pages</button>
        </PagesMenu>
      </QueryClientProvider>
    );
  };

  test('renders trigger button', () => {
    renderPagesMenu();
    expect(screen.getByText('Pages')).toBeInTheDocument();
  });

  test('opens dropdown menu on trigger click', () => {
    renderPagesMenu();
    const trigger = screen.getByText('Pages');
    fireEvent.click(trigger);

    expect(screen.getByText('Browse Pages')).toBeInTheDocument();
    expect(screen.getByText('Create New Page')).toBeInTheDocument();
  });

  test('opens command palette when Browse Pages is clicked', async () => {
    renderPagesMenu();
    
    const trigger = screen.getByText('Pages');
    fireEvent.click(trigger);

    const browseItem = screen.getByText('Browse Pages');
    fireEvent.click(browseItem);

    // Command palette should be visible with pages
    await waitFor(() => {
      expect(screen.getByText('Home Page')).toBeInTheDocument();
    });
    expect(screen.getByText('About Page')).toBeInTheDocument();
    expect(screen.getByText('Contact Page')).toBeInTheDocument();
  });

  test('navigates to page edit view when page is selected', async () => {
    renderPagesMenu();
    
    const trigger = screen.getByText('Pages');
    fireEvent.click(trigger);

    const browseItem = screen.getByText('Browse Pages');
    fireEvent.click(browseItem);

    await waitFor(() => {
      expect(screen.getByText('Home Page')).toBeInTheDocument();
    });

    const pageItem = screen.getByText('Home Page');
    fireEvent.click(pageItem);

    expect(mockSetLocation).toHaveBeenCalledWith('/pages/page-1/edit');
  });

  test('opens create dialog when Create New Page is clicked', () => {
    renderPagesMenu();
    
    const trigger = screen.getByText('Pages');
    fireEvent.click(trigger);

    const createItem = screen.getByText('Create New Page');
    fireEvent.click(createItem);

    const dialog = screen.getByTestId('create-dialog');
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute('data-type', 'page');
  });

  test('highlights current page in command palette', async () => {
    renderPagesMenu({ currentPageId: 'page-2' });
    
    const trigger = screen.getByText('Pages');
    fireEvent.click(trigger);

    const browseItem = screen.getByText('Browse Pages');
    fireEvent.click(browseItem);

    await waitFor(() => {
      expect(screen.getByText('About Page')).toBeInTheDocument();
    });

    const currentPageItem = screen.getByText('About Page').closest('[role]');
    expect(currentPageItem).toHaveClass('bg-accent');
  });

  test('displays page status in command palette', async () => {
    renderPagesMenu();
    
    const trigger = screen.getByText('Pages');
    fireEvent.click(trigger);

    const browseItem = screen.getByText('Browse Pages');
    fireEvent.click(browseItem);

    await waitFor(() => {
      expect(screen.getByText('published')).toBeInTheDocument();
    });
    expect(screen.getByText('draft')).toBeInTheDocument();
  });
});
