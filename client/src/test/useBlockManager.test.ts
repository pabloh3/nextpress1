import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useBlockManager } from '../hooks/useBlockManager'
import type { BlockConfig } from '@shared/schema'

describe('useBlockManager', () => {
  const mockGenerateId = () => `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  const createMockBlock = (id: string, type: string = 'core/paragraph', children?: BlockConfig[]): BlockConfig => ({
    id,
    type,
    content: { text: `Content for ${id}` },
    styles: {},
    children: children || [],
    settings: {}
  })

  let initialBlocks: BlockConfig[]

  beforeEach(() => {
    initialBlocks = [
      createMockBlock('block1'),
      createMockBlock('container1', 'core/group', [
        createMockBlock('nested1'),
        createMockBlock('nested2')
      ]),
      createMockBlock('block3')
    ]
  })

  describe('initialization', () => {
    it('should initialize with provided blocks', () => {
      const { result } = renderHook(() => useBlockManager(initialBlocks))
      
      expect(result.current.blocks).toEqual(initialBlocks)
    })

    it('should initialize with empty array if no blocks provided', () => {
      const { result } = renderHook(() => useBlockManager())
      
      expect(result.current.blocks).toEqual([])
    })
  })

  describe('updateBlock', () => {
    it('should update block at root level', () => {
      const { result } = renderHook(() => useBlockManager(initialBlocks))
      
      act(() => {
        const updateResult = result.current.updateBlock('block1', { 
          content: { text: 'Updated content' } 
        })
        expect(updateResult.status).toBe(true)
      })

      const updatedBlock = result.current.blocks.find(b => b.id === 'block1')
      expect(updatedBlock?.content.text).toBe('Updated content')
    })

    it('should update nested block', () => {
      const { result } = renderHook(() => useBlockManager(initialBlocks))
      
      act(() => {
        const updateResult = result.current.updateBlock('nested1', { 
          content: { text: 'Updated nested content' } 
        })
        expect(updateResult.status).toBe(true)
      })

      const container = result.current.blocks.find(b => b.id === 'container1')
      const nestedBlock = container?.children?.find(b => b.id === 'nested1')
      expect(nestedBlock?.content.text).toBe('Updated nested content')
    })

    it('should return failure status for non-existent block', () => {
      const { result } = renderHook(() => useBlockManager(initialBlocks))
      
      act(() => {
        const updateResult = result.current.updateBlock('non-existent', { 
          content: { text: 'Should not work' } 
        })
        expect(updateResult.status).toBe(false)
      })

      // Blocks should remain unchanged
      expect(result.current.blocks).toEqual(initialBlocks)
    })
  })

  describe('duplicateBlock', () => {
    it('should duplicate block at root level', () => {
      const { result } = renderHook(() => useBlockManager(initialBlocks))
      
      let newId: string = ''
      act(() => {
        const duplicateResult = result.current.duplicateBlock('block1', mockGenerateId)
        expect(duplicateResult.status).toBe(true)
        newId = (duplicateResult.data as any)?.newId
        expect(newId).toBeTruthy()
      })

      expect(result.current.blocks).toHaveLength(4)
      const duplicatedBlock = result.current.blocks.find(b => b.id === newId)
      const originalBlock = result.current.blocks.find(b => b.id === 'block1')
      
      expect(duplicatedBlock).toBeTruthy()
      expect(duplicatedBlock?.content.text).toBe(originalBlock?.content.text)
      expect(duplicatedBlock?.type).toBe(originalBlock?.type)
    })

    it('should duplicate nested block with children', () => {
      const { result } = renderHook(() => useBlockManager(initialBlocks))
      
      let newId: string = ''
      act(() => {
        const duplicateResult = result.current.duplicateBlock('container1', mockGenerateId)
        expect(duplicateResult.status).toBe(true)
        newId = (duplicateResult.data as any)?.newId
      })

      expect(result.current.blocks).toHaveLength(4)
      const duplicatedContainer = result.current.blocks.find(b => b.id === newId)
      
      expect(duplicatedContainer).toBeTruthy()
      expect(duplicatedContainer?.children).toHaveLength(2)
      expect(duplicatedContainer?.children?.[0].id).not.toBe('nested1') // Should have new ID
      expect(duplicatedContainer?.children?.[1].id).not.toBe('nested2') // Should have new ID
    })

    it('should return failure status for non-existent block', () => {
      const { result } = renderHook(() => useBlockManager(initialBlocks))
      
      act(() => {
        const duplicateResult = result.current.duplicateBlock('non-existent', mockGenerateId)
        expect(duplicateResult.status).toBe(false)
      })

      expect(result.current.blocks).toEqual(initialBlocks)
    })
  })

  describe('deleteBlock', () => {
    it('should delete block at root level', () => {
      const { result } = renderHook(() => useBlockManager(initialBlocks))
      
      act(() => {
        const deleteResult = result.current.deleteBlock('block1')
        expect(deleteResult.status).toBe(true)
      })

      expect(result.current.blocks).toHaveLength(2)
      expect(result.current.blocks.find(b => b.id === 'block1')).toBeUndefined()
    })

    it('should delete nested block', () => {
      const { result } = renderHook(() => useBlockManager(initialBlocks))
      
      act(() => {
        const deleteResult = result.current.deleteBlock('nested1')
        expect(deleteResult.status).toBe(true)
      })

      const container = result.current.blocks.find(b => b.id === 'container1')
      expect(container?.children).toHaveLength(1)
      expect(container?.children?.find(b => b.id === 'nested1')).toBeUndefined()
      expect(container?.children?.find(b => b.id === 'nested2')).toBeTruthy()
    })

    it('should return failure status for non-existent block', () => {
      const { result } = renderHook(() => useBlockManager(initialBlocks))
      
      act(() => {
        const deleteResult = result.current.deleteBlock('non-existent')
        expect(deleteResult.status).toBe(false)
      })

      expect(result.current.blocks).toEqual(initialBlocks)
    })
  })

  describe('setBlocks', () => {
    it('should replace all blocks', () => {
      const { result } = renderHook(() => useBlockManager(initialBlocks))
      
      const newBlocks = [createMockBlock('new1'), createMockBlock('new2')]
      
      act(() => {
        result.current.setBlocks(newBlocks)
      })

      expect(result.current.blocks).toEqual(newBlocks)
    })

    it('should accept function to update blocks', () => {
      const { result } = renderHook(() => useBlockManager(initialBlocks))
      
      act(() => {
        result.current.setBlocks(prev => [
          ...prev,
          createMockBlock('additional')
        ])
      })

      expect(result.current.blocks).toHaveLength(4)
      expect(result.current.blocks[3].id).toBe('additional')
    })
  })
})