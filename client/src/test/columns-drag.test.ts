import { vi } from 'vitest';
import { insertNewBlock, moveExistingBlock } from '../lib/handlers/treeUtils';
import type { BlockConfig } from '@shared/schema';

// Mock the blockRegistry used by treeUtils
vi.mock('../components/PageBuilder/blocks', () => ({
  blockRegistry: {
    'core/heading': {
      id: 'core/heading',
      name: 'Heading',
      isContainer: false,
      defaultContent: { text: 'New heading', level: 1 },
      defaultStyles: {}
    }
  }
}));

describe('Columns Block Tree Utilities', () => {
  const testBlocks: BlockConfig[] = [
    {
      id: 'root-1',
      type: 'core/paragraph',
      content: { text: 'Root paragraph' },
      children: []
    },
    {
      id: 'columns-1',
      type: 'core/columns',
      content: {
        columns: [
          {
            id: 'col-1',
            width: 50,
            children: [
              {
                id: 'child-1',
                type: 'core/paragraph',
                content: { text: 'Child in column 1' },
                children: []
              }
            ]
          },
          {
            id: 'col-2', 
            width: 50,
            children: []
          }
        ]
      },
      children: []
    }
  ];

  beforeEach(() => {
    // Mock crypto.randomUUID
    Object.defineProperty(global, 'crypto', {
      value: {
        randomUUID: () => 'test-id-123'
      }
    });
  });

  test('should insert new block into column', () => {
    const result = insertNewBlock(testBlocks, 'col-2', 0, 'core/heading');
    
    expect(result.blocks).not.toBe(testBlocks);
    expect(result.newId).toBe('test-id-123');
    
    // Check if the block was actually inserted into col-2
    const columnsBlock = result.blocks[1] as any;
    const col2 = columnsBlock.content.columns[1];
    expect(col2.children).toHaveLength(1);
    expect(col2.children[0].type).toBe('core/heading');
  });

  test('should move block from one column to another', () => {
    // First insert a block into col-2
    const setupResult = insertNewBlock(testBlocks, 'col-2', 0, 'core/heading');
    
    // Then move the block from col-1 to col-2
    const moveResult = moveExistingBlock(setupResult.blocks, 'col-1', 0, 'col-2', 1);
    
    expect(moveResult).not.toBe(setupResult.blocks);
    
    // Check source column is now empty
    const columnsBlock = moveResult[1] as any;
    const sourceCol = columnsBlock.content.columns[0];
    expect(sourceCol.children).toHaveLength(0);
    
    // Check destination column has 2 blocks
    const destCol = columnsBlock.content.columns[1];
    expect(destCol.children).toHaveLength(2);
  });

  test('should prevent moving block to original location', () => {
    const result = moveExistingBlock(testBlocks, 'col-1', 0, 'col-1', 0);
    
    // Should return original blocks unchanged
    expect(result).toBe(testBlocks);
  });
});