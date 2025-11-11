import { describe, it, expect } from 'vitest'
import { 
  findBlock,
  findBlockPath, 
  insertNewBlock, 
  moveExistingBlock,
  findBlockDeep,
  updateBlockDeep,
  deleteBlockDeep,
  duplicateBlockDeep
} from '../../lib/handlers/treeUtils'
import type { BlockConfig } from '@shared/schema-types'

describe('Tree Utilities', () => {
  const mockGenerateId = () => `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  const createMockBlock = (id: string, type: string = 'core/paragraph', children?: BlockConfig[]): BlockConfig => ({
    id,
    name: type,
    type: children !== undefined && children.length > 0 ? 'container' : 'block',
    parentId: null,
    content: { text: `Content for ${id}` },
    styles: {},
    children: children || []
  })

  describe('findBlockDeep', () => {
    it('should find block at root level', () => {
      const blocks = [
        createMockBlock('block1'),
        createMockBlock('block2'),
        createMockBlock('block3')
      ]

      const result = findBlockDeep(blocks, 'block2')
      expect(result?.found).toBe(true)
      expect(result?.block?.id).toBe('block2')
      expect(result?.path).toEqual([1])
    })

    it('should find block in nested structure', () => {
      const blocks = [
        createMockBlock('block1'),
        createMockBlock('container1', 'core/group', [
          createMockBlock('nested1'),
          createMockBlock('nested2')
        ]),
        createMockBlock('block3')
      ]

      const result = findBlockDeep(blocks, 'nested2')
      expect(result?.found).toBe(true)
      expect(result?.block?.id).toBe('nested2')
      expect(result?.path).toEqual([1, 1])
    })

    it('should find block in deeply nested structure', () => {
      const blocks = [
        createMockBlock('block1'),
        createMockBlock('container1', 'core/group', [
          createMockBlock('nested1'),
          createMockBlock('container2', 'core/columns', [
            createMockBlock('deep1'),
            createMockBlock('deep2')
          ])
        ])
      ]

      const result = findBlockDeep(blocks, 'deep1')
      expect(result?.found).toBe(true)
      expect(result?.block?.id).toBe('deep1')
      expect(result?.path).toEqual([1, 1, 0])
    })

    it('should return null for non-existent block', () => {
      const blocks = [
        createMockBlock('block1'),
        createMockBlock('block2')
      ]

      const result = findBlockDeep(blocks, 'non-existent')
      expect(result).toBeNull()
    })
  })

  describe('updateBlockDeep', () => {
    it('should update block at root level', () => {
      const blocks = [
        createMockBlock('block1'),
        createMockBlock('block2'),
        createMockBlock('block3')
      ]

      const updates = { content: { text: 'Updated content' } }
      const result = updateBlockDeep(blocks, 'block2', updates)
      
      expect(result.found).toBe(true)
      expect(result.next[1].content.text).toBe('Updated content')
      expect(result.next[0].id).toBe('block1') // Other blocks unchanged
      expect(result.next[2].id).toBe('block3')
    })

    it('should update nested block', () => {
      const blocks = [
        createMockBlock('block1'),
        createMockBlock('container1', 'core/group', [
          createMockBlock('nested1'),
          createMockBlock('nested2')
        ])
      ]

      const updates = { content: { text: 'Updated nested content' } }
      const result = updateBlockDeep(blocks, 'nested1', updates)
      
      expect(result.found).toBe(true)
      expect(result.next[1].children![0].content.text).toBe('Updated nested content')
      expect(result.next[1].children![1].id).toBe('nested2') // Sibling unchanged
    })

    it('should return original blocks if block not found', () => {
      const blocks = [createMockBlock('block1')]
      const result = updateBlockDeep(blocks, 'non-existent', {})
      
      expect(result.found).toBe(false)
      expect(result.next).toBe(blocks)
    })
  })

  describe('deleteBlockDeep', () => {
    it('should delete block at root level', () => {
      const blocks = [
        createMockBlock('block1'),
        createMockBlock('block2'),
        createMockBlock('block3')
      ]

      const result = deleteBlockDeep(blocks, 'block2')
      
      expect(result.found).toBe(true)
      expect(result.next).toHaveLength(2)
      expect(result.next[0].id).toBe('block1')
      expect(result.next[1].id).toBe('block3')
    })

    it('should delete nested block', () => {
      const blocks = [
        createMockBlock('block1'),
        createMockBlock('container1', 'core/group', [
          createMockBlock('nested1'),
          createMockBlock('nested2'),
          createMockBlock('nested3')
        ])
      ]

      const result = deleteBlockDeep(blocks, 'nested2')
      
      expect(result.found).toBe(true)
      expect(result.next[1].children).toHaveLength(2)
      expect(result.next[1].children![0].id).toBe('nested1')
      expect(result.next[1].children![1].id).toBe('nested3')
    })

    it('should return original blocks if block not found', () => {
      const blocks = [createMockBlock('block1')]
      const result = deleteBlockDeep(blocks, 'non-existent')
      
      expect(result.found).toBe(false)
      expect(result.next).toBe(blocks)
    })
  })

  describe('duplicateBlockDeep', () => {
    it('should duplicate block at root level', () => {
      const blocks = [
        createMockBlock('block1'),
        createMockBlock('block2'),
        createMockBlock('block3')
      ]

      const result = duplicateBlockDeep(blocks, 'block2', mockGenerateId)
      
      expect(result.found).toBe(true)
      expect(result.next).toHaveLength(4)
      expect(result.next[1].id).toBe('block2') // Original
      expect(result.next[2].id).toBe(result.duplicatedId) // Duplicate
      expect(result.next[2].content.text).toBe(result.next[1].content.text)
    })

    it('should duplicate nested block with children', () => {
      const blocks = [
        createMockBlock('container1', 'core/group', [
          createMockBlock('nested1'),
          createMockBlock('container2', 'core/columns', [
            createMockBlock('deep1')
          ])
        ])
      ]

      const result = duplicateBlockDeep(blocks, 'container2', mockGenerateId)
      
      expect(result.found).toBe(true)
      expect(result.next[0].children).toHaveLength(3) // Original nested1, original container2, duplicated container2
      
      const duplicated = result.next[0].children![2]
      expect(duplicated.id).toBe(result.duplicatedId)
      expect(duplicated.children).toHaveLength(1)
      expect(duplicated.children![0].id).not.toBe('deep1') // Should have new ID
    })

    it('should return original blocks if block not found', () => {
      const blocks = [createMockBlock('block1')]
      const result = duplicateBlockDeep(blocks, 'non-existent', mockGenerateId)
      
      expect(result.found).toBe(false)
      expect(result.next).toBe(blocks)
      expect(result.duplicatedId).toBe('')
    })

    it('should generate unique IDs for all duplicated blocks', () => {
      const blocks = [
        createMockBlock('container1', 'core/group', [
          createMockBlock('nested1'),
          createMockBlock('nested2')
        ])
      ]

      const result = duplicateBlockDeep(blocks, 'container1', mockGenerateId)
      
      expect(result.found).toBe(true)
      const duplicated = result.next[1]
      
      // All IDs should be different from originals
      expect(duplicated.id).not.toBe('container1')
      expect(duplicated.children![0].id).not.toBe('nested1')
      expect(duplicated.children![1].id).not.toBe('nested2')
      
      // All IDs should be unique
      const allIds = [
        duplicated.id,
        duplicated.children![0].id,
        duplicated.children![1].id
      ]
      expect(new Set(allIds).size).toBe(3)
    })
  })
})