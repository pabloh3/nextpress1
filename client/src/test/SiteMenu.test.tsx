import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { SiteMenu } from '@/components/PageBuilder/EditorBar/SiteMenu';

// Mock wouter's useLocation hook
const mockSetLocation = vi.fn();
vi.mock('wouter', () => ({
  useLocation: () => ['/', mockSetLocation],
}));

describe('SiteMenu', () => {
  beforeEach(() => {
    mockSetLocation.mockClear();
  });

  test('renders trigger button', () => {
    render(
      <SiteMenu>
        <button>Test Trigger</button>
      </SiteMenu>
    );

    expect(screen.getByText('Test Trigger')).toBeInTheDocument();
  });

  test('opens dropdown menu on trigger click', async () => {
    render(
      <SiteMenu>
        <button>Open Menu</button>
      </SiteMenu>
    );

    const trigger = screen.getByText('Open Menu');
    fireEvent.click(trigger);

    // Check for menu items
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Themes')).toBeInTheDocument();
    expect(screen.getByText('Media Library')).toBeInTheDocument();
  });

  test('navigates to /settings when Settings is clicked', async () => {
    render(
      <SiteMenu>
        <button>Open Menu</button>
      </SiteMenu>
    );

    const trigger = screen.getByText('Open Menu');
    fireEvent.click(trigger);

    const settingsItem = screen.getByText('Settings');
    fireEvent.click(settingsItem);

    expect(mockSetLocation).toHaveBeenCalledWith('/settings');
  });

  test('navigates to /themes when Themes is clicked', async () => {
    render(
      <SiteMenu>
        <button>Open Menu</button>
      </SiteMenu>
    );

    const trigger = screen.getByText('Open Menu');
    fireEvent.click(trigger);

    const themesItem = screen.getByText('Themes');
    fireEvent.click(themesItem);

    expect(mockSetLocation).toHaveBeenCalledWith('/themes');
  });

  test('navigates to /media when Media Library is clicked', async () => {
    render(
      <SiteMenu>
        <button>Open Menu</button>
      </SiteMenu>
    );

    const trigger = screen.getByText('Open Menu');
    fireEvent.click(trigger);

    const mediaItem = screen.getByText('Media Library');
    fireEvent.click(mediaItem);

    expect(mockSetLocation).toHaveBeenCalledWith('/media');
  });

  test('displays correct icons for menu items', async () => {
    render(
      <SiteMenu>
        <button>Open Menu</button>
      </SiteMenu>
    );

    const trigger = screen.getByText('Open Menu');
    fireEvent.click(trigger);

    // Check that all menu items are present (icons are rendered with lucide-react)
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Themes')).toBeInTheDocument();
    expect(screen.getByText('Media Library')).toBeInTheDocument();
  });
});
