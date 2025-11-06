import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import HeadingBlock from '../components/PageBuilder/blocks/heading/HeadingBlock'
import type { BlockConfig } from '@shared/schema-types'

// Mock the useBlockManager hook
const mockUpdateBlockContent = vi.fn()
const mockUpdateBlockStyles = vi.fn()

vi.mock('@/hooks/useBlockManager', () => ({
  useBlockManager: () => ({
    updateBlockContent: mockUpdateBlockContent,
    updateBlockStyles: mockUpdateBlockStyles,
  })
}))

describe('HeadingBlock', () => {
  const createHeadingBlock = (content: any): BlockConfig => ({
    id: 'test-heading',
    type: 'core/heading', 
    content,
    styles: {},
    children: [],
    settings: {}
  })

  describe('HeadingRenderer', () => {
    it('should render heading with default content', () => {
      const block = createHeadingBlock({ content: 'Test Heading', level: 2 })
      const Renderer = HeadingBlock.renderer!
      
      render(<Renderer block={block} isPreview={false} />)
      
      const heading = screen.getByRole('heading', { level: 2 })
      expect(heading).toHaveTextContent('Test Heading')
      expect(heading.tagName).toBe('H2')
    })

    it('should render different heading levels', () => {
      const levels = [1, 2, 3, 4, 5, 6] as const
      
      levels.forEach(level => {
        const block = createHeadingBlock({ content: `H${level} Heading`, level })
        const Renderer = HeadingBlock.renderer!
        
        const { container } = render(<Renderer block={block} isPreview={false} />)
        const heading = container.querySelector(`h${level}`)
        
        expect(heading).toBeInTheDocument()
        expect(heading).toHaveTextContent(`H${level} Heading`)
      })
    })

    it('should apply text alignment styles', () => {
      const block = createHeadingBlock({ 
        content: 'Centered Heading', 
        level: 2, 
        textAlign: 'center' 
      })
      const Renderer = HeadingBlock.renderer!
      
      render(<Renderer block={block} isPreview={false} />)
      
      const heading = screen.getByRole('heading')
      expect(heading).toHaveClass('has-text-align-center')
    })

    it('should apply custom anchor ID', () => {
      const block = createHeadingBlock({ 
        content: 'Anchored Heading', 
        level: 2, 
        anchor: 'my-anchor' 
      })
      const Renderer = HeadingBlock.renderer!
      
      render(<Renderer block={block} isPreview={false} />)
      
      const heading = screen.getByRole('heading')
      expect(heading).toHaveAttribute('id', 'my-anchor')
    })

    it('should apply custom CSS classes', () => {
      const block = createHeadingBlock({ 
        content: 'Custom Heading', 
        level: 2, 
        className: 'my-custom-class' 
      })
      const Renderer = HeadingBlock.renderer!
      
      render(<Renderer block={block} isPreview={false} />)
      
      const heading = screen.getByRole('heading')
      expect(heading).toHaveClass('my-custom-class')
    })

    it('should apply inline styles', () => {
      const block = createHeadingBlock({ content: 'Styled Heading', level: 2 })
      block.styles = { color: 'red', fontSize: '24px' }
      
      const Renderer = HeadingBlock.renderer!
      
      render(<Renderer block={block} isPreview={false} />)
      
      const heading = screen.getByRole('heading')
      // Accept either literal or computed rgb equivalent
      expect(getComputedStyle(heading).color).toBe('rgb(255, 0, 0)')
      expect(getComputedStyle(heading).fontSize).toBe('24px')
    })

    it('should handle legacy text property', () => {
      const block = createHeadingBlock({ text: 'Legacy Text', level: 2 })
      const Renderer = HeadingBlock.renderer!
      
      render(<Renderer block={block} isPreview={false} />)
      
      const heading = screen.getByRole('heading')
      expect(heading).toHaveTextContent('Legacy Text')
    })

    it('should prefer content over text property', () => {
      const block = createHeadingBlock({ 
        content: 'New Content', 
        text: 'Old Text', 
        level: 2 
      })
      const Renderer = HeadingBlock.renderer!
      
      render(<Renderer block={block} isPreview={false} />)
      
      const heading = screen.getByRole('heading')
      expect(heading).toHaveTextContent('New Content')
    })
  })

  describe('HeadingSettings', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should render all setting controls', () => {
      const block = createHeadingBlock({ content: 'Test', level: 2 })
      const Settings = HeadingBlock.settings!
      const mockOnUpdate = vi.fn()
      
      render(<Settings block={block} onUpdate={mockOnUpdate} />)
      
      // Check for elements that are visible by default (in open collapsible cards)
      expect(screen.getByLabelText(/heading text/i)).toBeInTheDocument()
      expect(screen.getByText(/heading level/i)).toBeInTheDocument() // Label text, not form control
      
      // Check for heading level buttons
      expect(screen.getByLabelText('Heading level 1')).toBeInTheDocument()
      expect(screen.getByLabelText('Heading level 2')).toBeInTheDocument()
      
      // Content section and Settings section should be visible (defaultOpen=true)
      expect(screen.getByText('Content')).toBeInTheDocument()
      expect(screen.getByText('Settings')).toBeInTheDocument()
    })

    it('should call onUpdate when text changes', () => {
      const block = createHeadingBlock({ content: 'Test', level: 2 })
      const Settings = HeadingBlock.settings!
      const mockOnUpdate = vi.fn()
      
      render(<Settings block={block} onUpdate={mockOnUpdate} />)
      
      const textInput = screen.getByLabelText(/heading text/i)
      fireEvent.change(textInput, { target: { value: 'New Text' } })
      
      expect(mockOnUpdate).toHaveBeenCalledWith({
        content: {
          content: 'New Text',
          level: 2,
          text: undefined
        }
      })
    })

    it('should call onUpdate when level changes', () => {
      const block = createHeadingBlock({ content: 'Test', level: 2 })
      const Settings = HeadingBlock.settings!
      const mockOnUpdate = vi.fn()
      
      render(<Settings block={block} onUpdate={mockOnUpdate} />)
      
      // Click H3 button
      const h3Button = screen.getByLabelText('Heading level 3')
      fireEvent.click(h3Button)
      
      expect(mockOnUpdate).toHaveBeenCalledWith({
        content: {
          content: 'Test',
          level: 3
        }
      })
    })

    it('should display current values in form fields', () => {
      const block = createHeadingBlock({ 
        content: 'Current Text', 
        level: 3,
        textAlign: 'center',
        anchor: 'test-anchor',
        className: 'test-class'
      })
      const Settings = HeadingBlock.settings!
      const mockOnUpdate = vi.fn()
      
      render(<Settings block={block} onUpdate={mockOnUpdate} />)
      
      // Check visible fields (in always-open sections)
      const textInput = screen.getByDisplayValue('Current Text')
      expect(textInput).toBeInTheDocument()
      
      // Check that H3 button is selected (has different styling)
      const h3Button = screen.getByLabelText('Heading level 3')
      expect(h3Button).toHaveClass('bg-gray-200') // Selected state class
      
      // Note: Advanced section (anchor, className) is collapsed by default (defaultOpen=false)
      // So those fields won't be visible without expanding the collapsible
      
      // Verify the advanced section is present but collapsed
      expect(screen.getByText('Advanced')).toBeInTheDocument()
    })
  })

  describe('Block Definition', () => {
    it('should have correct metadata', () => {
      expect(HeadingBlock.id).toBe('core/heading')
      expect(HeadingBlock.name).toBe('Heading')
      expect(HeadingBlock.category).toBe('basic')
      expect(HeadingBlock.description).toBe('Add a heading text')
    })

    it('should have default content', () => {
      expect(HeadingBlock.defaultContent).toEqual({
        content: 'Your heading here',
        level: 2,
        textAlign: 'left',
        anchor: '',
        className: '',
      })
    })

    it('should have default styles', () => {
      expect(HeadingBlock.defaultStyles).toEqual({
        fontSize: '2rem',
        fontWeight: 'bold',
        margin: '1rem 0'
      })
    })

    it('should not be a container block', () => {
      expect(HeadingBlock.isContainer).toBeFalsy()
    })
  })
})