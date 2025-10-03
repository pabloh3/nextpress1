import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import HeadingBlock from '../components/PageBuilder/blocks/heading/HeadingBlock';
import TextBlock from '../components/PageBuilder/blocks/text/TextBlock';
import ButtonBlock from '../components/PageBuilder/blocks/button/ButtonBlock';
import SpacerBlock from '../components/PageBuilder/blocks/spacer/SpacerBlock';
import type { BlockConfig } from '@shared/schema';

describe('Block Editing', () => {
  let mockOnUpdate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnUpdate = vi.fn();
  });

  describe('HeadingBlock Editing', () => {
    it('should update heading text when input changes', () => {
      const block: BlockConfig = {
        id: 'heading-1',
        type: 'core/heading',
        content: { content: 'Original Heading', level: 2 },
        styles: {},
        children: [],
        settings: {},
      };

      const Settings = HeadingBlock.settings!;
      render(<Settings block={block} onUpdate={mockOnUpdate} />);

      const input = screen.getByLabelText(/heading text/i);
      fireEvent.change(input, { target: { value: 'Updated Heading' } });

      expect(mockOnUpdate).toHaveBeenCalledWith({
        content: {
          content: 'Updated Heading',
          level: 2,
          text: undefined,
        },
      });
    });

    it('should update heading level when button clicked', () => {
      const block: BlockConfig = {
        id: 'heading-1',
        type: 'core/heading',
        content: { content: 'Test', level: 2 },
        styles: {},
        children: [],
        settings: {},
      };

      const Settings = HeadingBlock.settings!;
      render(<Settings block={block} onUpdate={mockOnUpdate} />);

      const h4Button = screen.getByLabelText('Heading level 4');
      fireEvent.click(h4Button);

      expect(mockOnUpdate).toHaveBeenCalledWith({
        content: {
          content: 'Test',
          level: 4,
        },
      });
    });

    it('should update text alignment', () => {
      const block: BlockConfig = {
        id: 'heading-1',
        type: 'core/heading',
        content: { content: 'Test', level: 2 },
        styles: {},
        children: [],
        settings: {},
      };

      const Settings = HeadingBlock.settings!;
      render(<Settings block={block} onUpdate={mockOnUpdate} />);

      // Click on Alignment header to expand it (defaultOpen=false)
      const alignmentHeader = screen.getByText('Alignment');
      fireEvent.click(alignmentHeader);

      const centerButton = screen.getByLabelText('Text align Center');
      fireEvent.click(centerButton);

      expect(mockOnUpdate).toHaveBeenCalledWith({
        content: {
          content: 'Test',
          level: 2,
          textAlign: 'center',
        },
      });
    });
  });

  describe('TextBlock Editing', () => {
    it('should update text content when textarea changes', () => {
      const block: BlockConfig = {
        id: 'text-1',
        type: 'core/paragraph',
        content: { content: 'Original text' },
        styles: {},
        children: [],
        settings: {},
      };

      const Settings = TextBlock.settings!;
      render(<Settings block={block} onUpdate={mockOnUpdate} />);

      const textarea = screen.getByLabelText(/text content/i);
      fireEvent.change(textarea, { target: { value: 'Updated text' } });

      expect(mockOnUpdate).toHaveBeenCalledWith({
        content: {
          content: 'Updated text',
          text: undefined,
        },
      });
    });

    it('should update text alignment', () => {
      const block: BlockConfig = {
        id: 'text-1',
        type: 'core/paragraph',
        content: { content: 'Test text' },
        styles: {},
        children: [],
        settings: {},
      };

      const Settings = TextBlock.settings!;
      render(<Settings block={block} onUpdate={mockOnUpdate} />);

      const rightButton = screen.getByRole('button', { name: /right/i });
      fireEvent.click(rightButton);

      expect(mockOnUpdate).toHaveBeenCalledWith({
        content: {
          content: 'Test text',
          align: 'right',
        },
      });
    });
  });

  describe('ButtonBlock Editing', () => {
    it('should update button text', () => {
      const block: BlockConfig = {
        id: 'button-1',
        type: 'core/button',
        content: { text: 'Click me', url: 'https://example.com' },
        styles: {},
        children: [],
        settings: {},
      };

      const Settings = ButtonBlock.settings!;
      render(<Settings block={block} onUpdate={mockOnUpdate} />);

      const input = screen.getByLabelText(/button text/i);
      fireEvent.change(input, { target: { value: 'New button text' } });

      expect(mockOnUpdate).toHaveBeenCalledWith({
        content: {
          text: 'New button text',
          url: 'https://example.com',
        },
      });
    });

    it('should update button URL', () => {
      const block: BlockConfig = {
        id: 'button-1',
        type: 'core/button',
        content: { text: 'Click me', url: 'https://example.com' },
        styles: {},
        children: [],
        settings: {},
      };

      const Settings = ButtonBlock.settings!;
      render(<Settings block={block} onUpdate={mockOnUpdate} />);

      const input = screen.getByLabelText(/link url/i);
      fireEvent.change(input, { target: { value: 'https://newurl.com' } });

      expect(mockOnUpdate).toHaveBeenCalledWith({
        content: {
          text: 'Click me',
          url: 'https://newurl.com',
        },
      });
    });
  });

  describe('SpacerBlock Editing', () => {
    it('should update spacer height via input', () => {
      const block: BlockConfig = {
        id: 'spacer-1',
        type: 'core/spacer',
        content: { height: 100 },
        styles: {},
        children: [],
        settings: {},
      };

      const Settings = SpacerBlock.settings!;
      render(<Settings block={block} onUpdate={mockOnUpdate} />);

      const input = screen.getByRole('spinbutton', { name: /height/i });
      fireEvent.change(input, { target: { value: '150' } });

      expect(mockOnUpdate).toHaveBeenCalledWith({
        content: {
          height: 150,
        },
      });
    });
  });

  describe('Content Merging', () => {
    it('should preserve existing content properties when updating', () => {
      const block: BlockConfig = {
        id: 'heading-1',
        type: 'core/heading',
        content: {
          content: 'Test',
          level: 2,
          textAlign: 'center',
          anchor: 'my-anchor',
          className: 'custom-class',
        },
        styles: {},
        children: [],
        settings: {},
      };

      const Settings = HeadingBlock.settings!;
      render(<Settings block={block} onUpdate={mockOnUpdate} />);

      // Update only the heading text
      const input = screen.getByLabelText(/heading text/i);
      fireEvent.change(input, { target: { value: 'New Text' } });

      // Should merge with existing properties
      expect(mockOnUpdate).toHaveBeenCalledWith({
        content: {
          content: 'New Text',
          level: 2,
          textAlign: 'center',
          anchor: 'my-anchor',
          className: 'custom-class',
          text: undefined,
        },
      });
    });

    it('should allow overwriting specific properties', () => {
      const block: BlockConfig = {
        id: 'heading-1',
        type: 'core/heading',
        content: {
          content: 'Test',
          level: 2,
          textAlign: 'left',
        },
        styles: {},
        children: [],
        settings: {},
      };

      const Settings = HeadingBlock.settings!;
      render(<Settings block={block} onUpdate={mockOnUpdate} />);

      // Update the level
      const h5Button = screen.getByLabelText('Heading level 5');
      fireEvent.click(h5Button);

      expect(mockOnUpdate).toHaveBeenCalledWith({
        content: {
          content: 'Test',
          level: 5,
          textAlign: 'left',
        },
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty content gracefully', () => {
      const block: BlockConfig = {
        id: 'heading-1',
        type: 'core/heading',
        content: {},
        styles: {},
        children: [],
        settings: {},
      };

      const Settings = HeadingBlock.settings!;
      render(<Settings block={block} onUpdate={mockOnUpdate} />);

      const input = screen.getByLabelText(/heading text/i);
      expect(input).toHaveValue('');

      fireEvent.change(input, { target: { value: 'New content' } });

      expect(mockOnUpdate).toHaveBeenCalledWith({
        content: {
          content: 'New content',
          text: undefined,
        },
      });
    });

    it('should handle undefined content', () => {
      const block: BlockConfig = {
        id: 'heading-1',
        type: 'core/heading',
        content: {},
        styles: {},
        children: [],
        settings: {},
      };

      const Settings = HeadingBlock.settings!;
      
      // Should render without crashing
      expect(() => {
        render(<Settings block={block} onUpdate={mockOnUpdate} />);
      }).not.toThrow();
    });
  });
});
