import { describe, it, expect } from 'vitest';
import { setParentIds, findParentBlock } from '@/lib/handlers/treeUtils';
import type { BlockConfig } from '@shared/schema-types';

const makeBlock = (id: string, children?: BlockConfig[]): BlockConfig => ({
  id,
  name: 'text',
  type: children !== undefined ? 'container' : 'block',
  parentId: 'wrong-initial-value', // Intentionally wrong to test correction
  content: {},
  ...(children !== undefined && { children })
});

describe('ParentId Management', () => {
  describe('setParentIds', () => {
    it('should set parentId to null for root blocks', () => {
      const blocks: BlockConfig[] = [
        makeBlock('a'),
        makeBlock('b')
      ];
      
      const result = setParentIds(blocks, null);
      
      expect(result[0].parentId).toBeNull();
      expect(result[1].parentId).toBeNull();
    });
    
    it('should recursively set parentId for nested blocks', () => {
      const blocks: BlockConfig[] = [
        makeBlock('parent', [
          makeBlock('child1'),
          makeBlock('child2')
        ])
      ];
      
      const result = setParentIds(blocks, null);
      
      expect(result[0].parentId).toBeNull();
      expect(result[0].children?.[0].parentId).toBe('parent');
      expect(result[0].children?.[1].parentId).toBe('parent');
    });
    
    it('should handle deeply nested structures', () => {
      const blocks: BlockConfig[] = [
        makeBlock('level1', [
          makeBlock('level2', [
            makeBlock('level3')
          ])
        ])
      ];
      
      const result = setParentIds(blocks, null);
      
      expect(result[0].parentId).toBeNull();
      expect(result[0].children?.[0].parentId).toBe('level1');
      expect(result[0].children?.[0].children?.[0].parentId).toBe('level2');
    });
    
    it('should handle empty children arrays', () => {
      const blocks: BlockConfig[] = [
        makeBlock('empty-container', [])
      ];
      
      const result = setParentIds(blocks, null);
      
      expect(result[0].children).toEqual([]);
      expect(result[0].parentId).toBeNull();
    });
    
    it('should handle mixed structures', () => {
      const blocks: BlockConfig[] = [
        makeBlock('block1'), // No children
        makeBlock('container1', [
          makeBlock('nested1'),
          makeBlock('nested2')
        ]),
        makeBlock('block2') // No children
      ];
      
      const result = setParentIds(blocks, null);
      
      expect(result[0].parentId).toBeNull();
      expect(result[1].parentId).toBeNull();
      expect(result[1].children?.[0].parentId).toBe('container1');
      expect(result[1].children?.[1].parentId).toBe('container1');
      expect(result[2].parentId).toBeNull();
    });
  });
  
  describe('findParentBlock', () => {
    it('should find direct parent at root level', () => {
      const blocks: BlockConfig[] = [
        {
          id: 'parent',
          name: 'group',
          type: 'container',
          parentId: null,
          content: {},
          children: [
            { id: 'child', name: 'text', type: 'block', parentId: 'parent', content: {} }
          ]
        }
      ];
      
      const parent = findParentBlock(blocks, 'child');
      
      expect(parent?.id).toBe('parent');
    });
    
    it('should find parent in nested structure', () => {
      const blocks: BlockConfig[] = [
        {
          id: 'grandparent',
          name: 'group',
          type: 'container',
          parentId: null,
          content: {},
          children: [{
            id: 'parent',
            name: 'group',
            type: 'container',
            parentId: 'grandparent',
            content: {},
            children: [
              { id: 'child', name: 'text', type: 'block', parentId: 'parent', content: {} }
            ]
          }]
        }
      ];
      
      const parent = findParentBlock(blocks, 'child');
      
      expect(parent?.id).toBe('parent');
    });
    
    it('should return null for root block', () => {
      const blocks: BlockConfig[] = [
        { id: 'root', name: 'text', type: 'block', parentId: null, content: {} }
      ];
      
      const parent = findParentBlock(blocks, 'root');
      
      expect(parent).toBeNull();
    });
    
    it('should return null for non-existent block', () => {
      const blocks: BlockConfig[] = [
        {
          id: 'parent',
          name: 'group',
          type: 'container',
          parentId: null,
          content: {},
          children: [
            { id: 'child', name: 'text', type: 'block', parentId: 'parent', content: {} }
          ]
        }
      ];
      
      const parent = findParentBlock(blocks, 'non-existent');
      
      expect(parent).toBeNull();
    });
    
    it('should find correct parent among multiple containers', () => {
      const blocks: BlockConfig[] = [
        {
          id: 'container1',
          name: 'group',
          type: 'container',
          parentId: null,
          content: {},
          children: [
            { id: 'child1', name: 'text', type: 'block', parentId: 'container1', content: {} }
          ]
        },
        {
          id: 'container2',
          name: 'group',
          type: 'container',
          parentId: null,
          content: {},
          children: [
            { id: 'child2', name: 'text', type: 'block', parentId: 'container2', content: {} }
          ]
        }
      ];
      
      const parent1 = findParentBlock(blocks, 'child1');
      const parent2 = findParentBlock(blocks, 'child2');
      
      expect(parent1?.id).toBe('container1');
      expect(parent2?.id).toBe('container2');
    });
  });
});

