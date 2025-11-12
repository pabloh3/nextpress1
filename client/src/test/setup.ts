import '@testing-library/jest-dom'
import { blockRegistry } from '../components/PageBuilder/blocks';
import type { BlockConfig, BlockContent } from '@shared/schema-types';

// Debug log for blockRegistry
console.log('Test Setup - blockRegistry:', blockRegistry);
import { vi } from 'vitest'

/**
 * Helper function to normalize content for test blocks.
 * Converts legacy content format { text: '...' } to proper format { kind: 'text', value: '...' }
 */
export function normalizeBlockContent(content: any): BlockContent {
  if (!content) return content;
  if (typeof content === 'object' && 'kind' in content) return content;
  if (typeof content === 'string') return { kind: 'text', value: content };
  if (typeof content === 'object' && typeof content.text === 'string') {
    return { kind: 'text', value: content.text };
  }
  return content;
}

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock drag and drop API
Object.defineProperty(window, 'DragEvent', {
  value: class DragEvent extends Event {
    constructor(type: string, options?: any) {
      super(type, options)
    }
  }
})

// Mock document.elementFromPoint for jsdom (returns body)
Object.defineProperty(document, 'elementFromPoint', {
  value: vi.fn().mockImplementation(() => document.body),
  writable: true,
})
