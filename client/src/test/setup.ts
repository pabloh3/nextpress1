import '@testing-library/jest-dom'
import { blockRegistry } from '../components/PageBuilder/blocks';
import type { BlockConfig, BlockContent } from '@shared/schema-types';

// Debug log for blockRegistry
console.log('Test Setup - blockRegistry:', blockRegistry);
import { vi } from 'vitest'

// Legacy content normalization for tests: wrap plain text content into { kind: 'text', value }
function normalizeContent(content: any): BlockContent {
  if (!content) return content;
  if (typeof content === 'object' && 'kind' in content) return content;
  if (typeof content === 'string') return { kind: 'text', value: content };
  if (typeof content === 'object' && typeof content.text === 'string') {
    return { kind: 'text', value: content.text };
  }
  return content;
}

// Patch test helpers that may construct blocks directly
const originalAssign = Object.assign;
Object.assign = function(target: any, ...sources: any[]) {
  const result = originalAssign(target, ...sources);
  // Best-effort normalize common test shapes
  if (result && typeof result === 'object') {
    if ('content' in result) {
      // @ts-expect-error runtime patch for tests
      result.content = normalizeContent(result.content);
    }
    if (Array.isArray((result as any).children)) {
      (result as any).children = (result as any).children.map((c: any) => {
        if (c && typeof c === 'object') {
          if ('content' in c) {
            // @ts-expect-error runtime patch for tests
            c.content = normalizeContent(c.content);
          }
          if (Array.isArray(c.children)) {
            c.children = c.children.map((gc: any) => ({ ...gc, content: normalizeContent(gc.content) }));
          }
        }
        return c;
      });
    }
  }
  return result;
} as typeof Object.assign;

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
