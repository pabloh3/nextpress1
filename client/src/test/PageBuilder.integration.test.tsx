import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DragDropContext } from '@/lib/dnd'
import PageBuilder from '../components/PageBuilder/PageBuilder'
import type { BlockConfig } from '@shared/schema'

// Mock dependencies
vi.mock('../hooks/usePageSave', () => ({
  usePageSave: () => ({
    mutate: vi.fn(),
    isPending: false
  })
}))

vi.mock('../components/PageBuilder/blocks', () => ({
  blockRegistry: {
    'core/paragraph': {
      id: 'core/paragraph',
      name: 'Paragraph',
      renderer: ({ block }: { block: BlockConfig }) => (
        <p data-testid={`paragraph-${block.id}`}>{block.content?.text}</p>
      ),
      settings: ({ block, onUpdate }: any) => (
        <div data-testid={`settings-${block.id}`}>
          <input
            data-testid="text-input"
            value={block.content?.text || ''}
            onChange={(e) => onUpdate({ content: { text: e.target.value } })}
          />
        </div>
      ),
      isContainer: false
    },
    'core/group': {
      id: 'core/group',
      name: 'Group',
      renderer: ({ block }: { block: BlockConfig }) => (
        <div data-testid={`group-${block.id}`}>Group Container</div>
      ),
      settings: ({ block }: any) => (
        <div data-testid={`group-settings-${block.id}`}>Group Settings</div>
      ),
      isContainer: true
    }
  }
}))

describe('PageBuilder Integration', () => {
  const initialBlocks: BlockConfig[] = [
    {
      id: 'block-1',
      type: 'core/paragraph',
      content: { text: 'Initial paragraph' },
      styles: {},
      children: [],
      settings: {}
    },
    {
      id: 'container-1',
      type: 'core/group',
      content: { tagName: 'div' },
      styles: {},
      settings: {},
      children: [
        {
          id: 'nested-1',
          type: 'core/paragraph',
          content: { text: 'Nested paragraph' },
          styles: {},
          children: [],
          settings: {}
        }
      ]
    }
  ]

  const renderPageBuilder = (blocks = initialBlocks) => {
    return render(
      <PageBuilder
        blocks={blocks}
        onBlocksChange={vi.fn()}
        onSave={vi.fn()}
      />
    )
  }

  describe('Initial Rendering', () => {
    it('should render all blocks correctly', () => {
      renderPageBuilder()

      expect(screen.getByTestId('paragraph-block-1')).toBeInTheDocument()
      expect(screen.getByTestId('group-container-1')).toBeInTheDocument()
      expect(screen.getByTestId('paragraph-nested-1')).toBeInTheDocument()
      
      expect(screen.getByText('Initial paragraph')).toBeInTheDocument()
      expect(screen.getByText('Nested paragraph')).toBeInTheDocument()
    })

    it('should show block library sidebar', () => {
      renderPageBuilder()

      expect(screen.getByText('Add Blocks')).toBeInTheDocument()
      expect(screen.getByText('Paragraph')).toBeInTheDocument()
      expect(screen.getByText('Group')).toBeInTheDocument()
    })

    it('should show canvas area', () => {
      renderPageBuilder()

      const canvas = screen.getByRole('region', { name: /canvas/i })
      expect(canvas).toBeInTheDocument()
    })
  })

  describe('Block Selection and Editing', () => {
    it('should select block when clicked', () => {
      renderPageBuilder()

      const paragraphBlock = screen.getByTestId('paragraph-block-1')
      fireEvent.click(paragraphBlock)

      // Should show settings panel
      expect(screen.getByTestId('settings-block-1')).toBeInTheDocument()
    })

    it('should update block content through settings', () => {
      const onBlocksChange = vi.fn()
      render(
        <PageBuilder
          blocks={initialBlocks}
          onBlocksChange={onBlocksChange}
          onSave={vi.fn()}
        />
      )

      // Select block
      const paragraphBlock = screen.getByTestId('paragraph-block-1')
      fireEvent.click(paragraphBlock)

      // Update text through settings
      const textInput = screen.getByTestId('text-input')
      fireEvent.change(textInput, { target: { value: 'Updated text' } })

      // Should trigger blocks change
      expect(onBlocksChange).toHaveBeenCalled()
    })

    it('should select nested blocks correctly', () => {
      renderPageBuilder()

      const nestedBlock = screen.getByTestId('paragraph-nested-1')
      fireEvent.click(nestedBlock)

      // Should show settings for the nested block, not the container
      expect(screen.getByTestId('settings-nested-1')).toBeInTheDocument()
    })
  })

  describe('Block Operations', () => {
    it('should duplicate block when duplicate button clicked', () => {
      const onBlocksChange = vi.fn()
      render(
        <PageBuilder
          blocks={initialBlocks}
          onBlocksChange={onBlocksChange}
          onSave={vi.fn()}
        />
      )

      // Select block and hover to show controls
      const paragraphBlock = screen.getByTestId('paragraph-block-1')
      fireEvent.click(paragraphBlock)
      fireEvent.mouseEnter(paragraphBlock)

      // Click duplicate button
      const duplicateButton = screen.getByLabelText(/duplicate|copy/i)
      fireEvent.click(duplicateButton)

      expect(onBlocksChange).toHaveBeenCalled()
    })

    it('should delete block when delete button clicked', () => {
      const onBlocksChange = vi.fn()
      render(
        <PageBuilder
          blocks={initialBlocks}
          onBlocksChange={onBlocksChange}
          onSave={vi.fn()}
        />
      )

      // Select block and hover to show controls
      const paragraphBlock = screen.getByTestId('paragraph-block-1')
      fireEvent.click(paragraphBlock)
      fireEvent.mouseEnter(paragraphBlock)

      // Click delete button
      const deleteButton = screen.getByLabelText(/delete|trash/i)
      fireEvent.click(deleteButton)

      expect(onBlocksChange).toHaveBeenCalled()
    })
  })

  describe('Device Preview', () => {
    it('should switch between device views', () => {
      renderPageBuilder()

      // Should start in desktop view
      const desktopButton = screen.getByLabelText(/desktop/i)
      expect(desktopButton).toHaveClass('active')

      // Switch to tablet
      const tabletButton = screen.getByLabelText(/tablet/i)
      fireEvent.click(tabletButton)
      expect(tabletButton).toHaveClass('active')

      // Switch to mobile
      const mobileButton = screen.getByLabelText(/mobile/i)
      fireEvent.click(mobileButton)
      expect(mobileButton).toHaveClass('active')
    })
  })

  describe('Sidebar Tabs', () => {
    it('should switch between blocks and settings tabs', () => {
      renderPageBuilder()

      // Should start with blocks tab active
      expect(screen.getByText('Add Blocks')).toBeInTheDocument()

      // Select a block to show settings
      const paragraphBlock = screen.getByTestId('paragraph-block-1')
      fireEvent.click(paragraphBlock)

      // Should switch to settings tab
      expect(screen.getByTestId('settings-block-1')).toBeInTheDocument()

      // Click blocks tab to go back
      const blocksTab = screen.getByText('Blocks')
      fireEvent.click(blocksTab)
      expect(screen.getByText('Add Blocks')).toBeInTheDocument()
    })
  })

  describe('Empty State', () => {
    it('should show empty state when no blocks', () => {
      render(
        <PageBuilder
          blocks={[]}
          onBlocksChange={vi.fn()}
          onSave={vi.fn()}
        />
      )

      expect(screen.getByText('Drag blocks from the sidebar to start building your page')).toBeInTheDocument()
    })
  })

  describe('Save Functionality', () => {
    it('should trigger save when save button clicked', () => {
      const onSave = vi.fn()
      render(
        <PageBuilder
          blocks={initialBlocks}
          onBlocksChange={vi.fn()}
          onSave={onSave}
        />
      )

      const saveButton = screen.getByText(/save|publish/i)
      fireEvent.click(saveButton)

      expect(onSave).toHaveBeenCalled()
    })
  })

  describe('Nested Block Management', () => {
    it('should handle deeply nested structures', () => {
      const deeplyNestedBlocks: BlockConfig[] = [
        {
           id: 'root',
           type: 'core/group',
           content: { tagName: 'div' },
           styles: {},
           settings: {},
           children: [
        {
          id: 'level-1',
          type: 'core/group',
          content: { tagName: 'div' },
          styles: {},
          settings: {},
          children: [
                {
                  id: 'level-2',
                  type: 'core/paragraph',
                  content: { text: 'Deep nested text' },
                  styles: {},
      children: [],
      settings: {}
                }
              ]
            }
          ]
        }
      ]

      render(
        <PageBuilder
          blocks={deeplyNestedBlocks}
          onBlocksChange={vi.fn()}
          onSave={vi.fn()}
        />
      )

      expect(screen.getByText('Deep nested text')).toBeInTheDocument()

      // Should be able to select the deeply nested block
      const deepBlock = screen.getByTestId('paragraph-level-2')
      fireEvent.click(deepBlock)
      expect(screen.getByTestId('settings-level-2')).toBeInTheDocument()
    })

    it('should maintain block hierarchy during operations', () => {
      const onBlocksChange = vi.fn()
      render(
        <PageBuilder
          blocks={initialBlocks}
          onBlocksChange={onBlocksChange}
          onSave={vi.fn()}
        />
      )

      // Perform operations on nested blocks
      const nestedBlock = screen.getByTestId('paragraph-nested-1')
      fireEvent.click(nestedBlock)

      // Update the nested block
      const textInput = screen.getByTestId('text-input')
      fireEvent.change(textInput, { target: { value: 'Updated nested text' } })

      expect(onBlocksChange).toHaveBeenCalled()

      // Verify the structure is maintained
      const lastCall = onBlocksChange.mock.calls[onBlocksChange.mock.calls.length - 1]
      const updatedBlocks = lastCall[0]
      
      expect(updatedBlocks).toHaveLength(2)
      expect(updatedBlocks[1].children).toHaveLength(1)
      expect(updatedBlocks[1].children[0].content.text).toBe('Updated nested text')
    })
  })
})