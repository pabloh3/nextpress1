import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DesignMenu } from '@/components/PageBuilder/EditorBar/DesignMenu';
import * as queryClient from '@/lib/queryClient';

// Mock useContentLists hook
const mockUseContentLists = vi.fn();
vi.mock('@/hooks/useContentLists', () => ({
  useContentLists: mockUseContentLists,
}));

// Mock useToast hook
const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

// Mock apiRequest
vi.spyOn(queryClient, 'apiRequest');

describe('DesignMenu', () => {
  let queryClientInstance: QueryClient;

  const mockTemplates = [
    { id: 'template-1', name: 'Blog Post Template', type: 'post' },
    { id: 'template-2', name: 'Landing Page Template', type: 'page' },
    { id: 'template-3', name: 'Portfolio Template', type: 'page' },
  ];

  const mockThemes = [
    { id: 'theme-1', name: 'Light Theme', status: 'active' },
    { id: 'theme-2', name: 'Dark Theme', status: 'inactive' },
    { id: 'theme-3', name: 'Modern Theme', status: 'inactive' },
  ];

  beforeEach(() => {
    mockToast.mockClear();
    vi.mocked(queryClient.apiRequest).mockClear();
    mockUseContentLists.mockReturnValue({
      templates: mockTemplates,
      themes: mockThemes,
    });
    queryClientInstance = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  const renderDesignMenu = (props = {}) => {
    return render(
      <QueryClientProvider client={queryClientInstance}>
        <DesignMenu {...props}>
          <button>Design</button>
        </DesignMenu>
      </QueryClientProvider>
    );
  };

  test('renders trigger button', () => {
    renderDesignMenu();
    expect(screen.getByText('Design')).toBeInTheDocument();
  });

  test('opens dropdown menu on trigger click', () => {
    renderDesignMenu();
    const trigger = screen.getByText('Design');
    fireEvent.click(trigger);

    expect(screen.getByText('Templates')).toBeInTheDocument();
    expect(screen.getByText('Themes')).toBeInTheDocument();
  });

  test('displays templates and themes in dropdown', () => {
    renderDesignMenu();
    const trigger = screen.getByText('Design');
    fireEvent.click(trigger);

    // Check templates
    expect(screen.getByText('Blog Post Template')).toBeInTheDocument();
    expect(screen.getByText('Landing Page Template')).toBeInTheDocument();
    expect(screen.getByText('Portfolio Template')).toBeInTheDocument();

    // Check themes
    expect(screen.getByText('Light Theme')).toBeInTheDocument();
    expect(screen.getByText('Dark Theme')).toBeInTheDocument();
    expect(screen.getByText('Modern Theme')).toBeInTheDocument();
  });

  test('displays "No templates" when templates array is empty', () => {
    mockUseContentLists.mockReturnValue({
      templates: [],
      themes: mockThemes,
    });

    renderDesignMenu();
    const trigger = screen.getByText('Design');
    fireEvent.click(trigger);

    expect(screen.getByText('No templates')).toBeInTheDocument();
  });

  test('displays "No themes" when themes array is empty', () => {
    mockUseContentLists.mockReturnValue({
      templates: mockTemplates,
      themes: [],
    });

    renderDesignMenu();
    const trigger = screen.getByText('Design');
    fireEvent.click(trigger);

    expect(screen.getByText('No themes')).toBeInTheDocument();
  });

  test('applies template when template is clicked', async () => {
    vi.mocked(queryClient.apiRequest).mockResolvedValue({});

    renderDesignMenu({ currentPostId: 'post-123', currentType: 'post' });
    const trigger = screen.getByText('Design');
    fireEvent.click(trigger);

    const templateItem = screen.getByText('Blog Post Template');
    fireEvent.click(templateItem);

    await waitFor(() => {
      expect(queryClient.apiRequest).toHaveBeenCalledWith(
        'PUT',
        '/api/posts/post-123',
        { templateId: 'template-1' }
      );
    });

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Template Applied',
        description: 'Successfully applied "Blog Post Template" template',
      });
    });
  });

  test('shows error toast when template application fails', async () => {
    vi.mocked(queryClient.apiRequest).mockRejectedValue(
      new Error('Template application failed')
    );

    renderDesignMenu({ currentPostId: 'post-123', currentType: 'post' });
    const trigger = screen.getByText('Design');
    fireEvent.click(trigger);

    const templateItem = screen.getByText('Blog Post Template');
    fireEvent.click(templateItem);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Error',
        description: 'Template application failed',
        variant: 'destructive',
      });
    });
  });

  test('shows error toast when applying template without currentPostId', () => {
    renderDesignMenu({ currentType: 'post' });
    const trigger = screen.getByText('Design');
    fireEvent.click(trigger);

    const templateItem = screen.getByText('Blog Post Template');
    fireEvent.click(templateItem);

    expect(mockToast).toHaveBeenCalledWith({
      title: 'Error',
      description: 'No post/page selected for template application',
      variant: 'destructive',
    });
  });

  test('applies theme when theme is clicked', async () => {
    vi.mocked(queryClient.apiRequest).mockResolvedValue({});

    renderDesignMenu({ currentPostId: 'post-123', currentType: 'post' });
    const trigger = screen.getByText('Design');
    fireEvent.click(trigger);

    const themeItem = screen.getByText('Dark Theme');
    fireEvent.click(themeItem);

    await waitFor(() => {
      expect(queryClient.apiRequest).toHaveBeenCalledWith(
        'POST',
        '/api/themes/theme-2/activate',
        {}
      );
    });

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Theme Activated',
        description: 'Successfully activated "Dark Theme" theme',
      });
    });
  });

  test('shows error toast when theme activation fails', async () => {
    vi.mocked(queryClient.apiRequest).mockRejectedValue(
      new Error('Theme activation failed')
    );

    renderDesignMenu({ currentPostId: 'post-123', currentType: 'post' });
    const trigger = screen.getByText('Design');
    fireEvent.click(trigger);

    const themeItem = screen.getByText('Dark Theme');
    fireEvent.click(themeItem);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Error',
        description: 'Theme activation failed',
        variant: 'destructive',
      });
    });
  });

  test('disables template items when no currentPostId is provided', () => {
    renderDesignMenu({ currentType: 'post' });
    const trigger = screen.getByText('Design');
    fireEvent.click(trigger);

    const templateItem = screen.getByText('Blog Post Template').closest('div');
    expect(templateItem).toHaveAttribute('data-disabled', 'true');
  });

  test('does not render when currentType is template', () => {
    const { container } = renderDesignMenu({ currentType: 'template' });
    expect(container.firstChild).toBeNull();
  });

  test('invalidates queries after successful template application', async () => {
    vi.mocked(queryClient.apiRequest).mockResolvedValue({});
    const invalidateQueriesSpy = vi.spyOn(queryClientInstance, 'invalidateQueries');

    renderDesignMenu({ currentPostId: 'post-123', currentType: 'post' });
    const trigger = screen.getByText('Design');
    fireEvent.click(trigger);

    const templateItem = screen.getByText('Blog Post Template');
    fireEvent.click(templateItem);

    await waitFor(() => {
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['/api/posts/post-123'],
      });
    });
  });

  test('invalidates queries after successful theme activation', async () => {
    vi.mocked(queryClient.apiRequest).mockResolvedValue({});
    const invalidateQueriesSpy = vi.spyOn(queryClientInstance, 'invalidateQueries');

    renderDesignMenu({ currentPostId: 'post-123', currentType: 'post' });
    const trigger = screen.getByText('Design');
    fireEvent.click(trigger);

    const themeItem = screen.getByText('Dark Theme');
    fireEvent.click(themeItem);

    await waitFor(() => {
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['/api/themes'],
      });
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['/api/themes/active'],
      });
    });
  });

  test('limits templates display to 5 items', () => {
    const manyTemplates = Array.from({ length: 10 }, (_, i) => ({
      id: `template-${i}`,
      name: `Template ${i}`,
      type: 'post',
    }));

    mockUseContentLists.mockReturnValue({
      templates: manyTemplates,
      themes: mockThemes,
    });

    renderDesignMenu();
    const trigger = screen.getByText('Design');
    fireEvent.click(trigger);

    // Should only show first 5 templates
    expect(screen.getByText('Template 0')).toBeInTheDocument();
    expect(screen.getByText('Template 4')).toBeInTheDocument();
    expect(screen.queryByText('Template 5')).not.toBeInTheDocument();
  });

  test('limits themes display to 5 items', () => {
    const manyThemes = Array.from({ length: 10 }, (_, i) => ({
      id: `theme-${i}`,
      name: `Theme ${i}`,
      status: 'inactive',
    }));

    mockUseContentLists.mockReturnValue({
      templates: mockTemplates,
      themes: manyThemes,
    });

    renderDesignMenu();
    const trigger = screen.getByText('Design');
    fireEvent.click(trigger);

    // Should only show first 5 themes
    expect(screen.getByText('Theme 0')).toBeInTheDocument();
    expect(screen.getByText('Theme 4')).toBeInTheDocument();
    expect(screen.queryByText('Theme 5')).not.toBeInTheDocument();
  });
});
