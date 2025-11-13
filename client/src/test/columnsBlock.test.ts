import { describe, it, expect, beforeEach, vi } from 'vitest';
import { insertNewBlock, moveExistingBlock } from '@/lib/handlers/treeUtils';
import type { BlockConfig } from '@shared/schema-types';

// Mock the block registry
vi.mock('@/components/PageBuilder/blocks', () => ({
  blockRegistry: {
    'core/text': {
      id: 'core/text',
      label: 'Text',
      isContainer: false,
      defaultContent: { kind: 'text', value: '' },
      defaultStyles: {},
      category: 'basic'
    },
    'core/heading': {
      id: 'core/heading',
      label: 'Heading',
      isContainer: false,
      defaultContent: { kind: 'text', value: '', level: 1 },
      defaultStyles: {},
      category: 'basic'
    },
    'core/button': {
      id: 'core/button',
      label: 'Button',
      isContainer: false,
      defaultContent: { kind: 'text', value: 'Button' },
      defaultStyles: {},
      category: 'basic'
    },
    'core/group': {
      id: 'core/group',
      label: 'Group',
      isContainer: true,
      defaultContent: { kind: 'structured', data: {} },
      defaultStyles: {},
      category: 'layout'
    }
  },
  getDefaultBlock: (type: string, id: string) => {
    const registry: any = {
      'core/text': {
        id,
        name: 'core/text',
        type: 'block',
        parentId: null,
        label: 'Text',
        category: 'basic',
        content: { kind: 'text', value: '' },
        styles: {},
        settings: {}
      },
      'core/heading': {
        id,
        name: 'core/heading',
        type: 'block',
        parentId: null,
        label: 'Heading',
        category: 'basic',
        content: { kind: 'text', value: '', level: 1 },
        styles: {},
        settings: {}
      },
      'core/button': {
        id,
        name: 'core/button',
        type: 'block',
        parentId: null,
        label: 'Button',
        category: 'basic',
        content: { kind: 'text', value: 'Button' },
        styles: {},
        settings: {}
      },
      'core/group': {
        id,
        name: 'core/group',
        type: 'container',
        parentId: null,
        label: 'Group',
        category: 'layout',
        content: { kind: 'structured', data: {} },
        styles: {},
        settings: {},
        children: []
      }
    };
    return registry[type] || null;
  }
}));

interface ColumnLayout {
  columnId: string;
  width?: string;
  blockIds: string[];
}

describe('ColumnsBlock with New Structure', () => {
  let columnsBlock: BlockConfig;

  beforeEach(() => {
    columnsBlock = {
      id: 'columns-1',
      name: 'core/columns',
      type: 'container',
      parentId: null,
      label: 'Columns',
      content: { kind: 'structured', data: { gap: '20px', direction: 'row', verticalAlignment: 'top', horizontalAlignment: 'left' } },
      settings: {
        columnLayout: [
          { columnId: 'col-1', width: '50%', blockIds: [] },
          { columnId: 'col-2', width: '50%', blockIds: [] }
        ] as ColumnLayout[]
      },
      children: []
    };
  });

  describe('Structure Validation', () => {
    it('should have columnLayout in settings, not content', () => {
      expect(columnsBlock.settings?.columnLayout).toBeDefined();
      expect((columnsBlock.content as any).columns).toBeUndefined();
    });

    it('should have empty children array for containers', () => {
      expect(columnsBlock.type).toBe('container');
      expect(columnsBlock.children).toEqual([]);
    });

    it('should store column metadata separately from children', () => {
      const layout = columnsBlock.settings?.columnLayout as ColumnLayout[];
      
      expect(layout).toHaveLength(2);
      expect(layout[0]).toHaveProperty('columnId');
      expect(layout[0]).toHaveProperty('width');
      expect(layout[0]).toHaveProperty('blockIds');
    });
  });

  describe('Adding Blocks to Columns', () => {
    it('should add block to columns children array', () => {
      const testBlocks: BlockConfig[] = [columnsBlock];
      
      // Insert block into columns (it becomes a child of columns)
      const result = insertNewBlock(testBlocks, 'columns-1', 0, 'core/text');
      
      const updatedColumns = result.blocks[0];
      expect(updatedColumns.children).toHaveLength(1);
      expect(updatedColumns.children?.[0].parentId).toBe('columns-1');
    });

    it('should allow multiple blocks in columns children', () => {
      const testBlocks: BlockConfig[] = [columnsBlock];
      
      let result = insertNewBlock(testBlocks, 'columns-1', 0, 'core/text');
      result = insertNewBlock(result.blocks, 'columns-1', 1, 'core/heading');
      result = insertNewBlock(result.blocks, 'columns-1', 2, 'core/button');
      
      const updatedColumns = result.blocks[0];
      expect(updatedColumns.children).toHaveLength(3);
      expect(updatedColumns.children?.every(c => c.parentId === 'columns-1')).toBe(true);
    });
  });

  describe('Column Layout Management', () => {
    it('should filter children by columnLayout.blockIds', () => {
      // Simulate a columns block with children and layout
      const populated: BlockConfig = {
        ...columnsBlock,
        children: [
          {
            id: 'text-1',
            name: 'core/text',
            type: 'block',
            parentId: 'columns-1',
            content: { kind: 'text', value: 'Text 1' }
          },
          {
            id: 'text-2',
            name: 'core/text',
            type: 'block',
            parentId: 'columns-1',
            content: { kind: 'text', value: 'Text 2' }
          },
          {
            id: 'text-3',
            name: 'core/text',
            type: 'block',
            parentId: 'columns-1',
            content: { kind: 'text', value: 'Text 3' }
          }
        ],
        settings: {
          columnLayout: [
            { columnId: 'col-1', width: '50%', blockIds: ['text-1', 'text-2'] },
            { columnId: 'col-2', width: '50%', blockIds: ['text-3'] }
          ]
        }
      };

      // Simulate renderer logic
      const columnLayout = populated.settings?.columnLayout as ColumnLayout[];
      const children = populated.children || [];

      const col1Children = children.filter(child =>
        columnLayout[0].blockIds.includes(child.id)
      );
      const col2Children = children.filter(child =>
        columnLayout[1].blockIds.includes(child.id)
      );

      expect(col1Children).toHaveLength(2);
      expect(col1Children.map(c => c.id)).toEqual(['text-1', 'text-2']);
      expect(col2Children).toHaveLength(1);
      expect(col2Children[0].id).toBe('text-3');
    });

    it('should handle moving block between columns by updating blockIds', () => {
      const populated: BlockConfig = {
        ...columnsBlock,
        children: [
          {
            id: 'text-1',
            name: 'core/text',
            type: 'block',
            parentId: 'columns-1',
            content: { kind: 'text', value: 'Text 1' }
          }
        ],
        settings: {
          columnLayout: [
            { columnId: 'col-1', width: '50%', blockIds: ['text-1'] },
            { columnId: 'col-2', width: '50%', blockIds: [] }
          ]
        }
      };

      // Simulate moving text-1 from col-1 to col-2
      const updated = {
        ...populated,
        settings: {
          columnLayout: [
            { columnId: 'col-1', width: '50%', blockIds: [] },
            { columnId: 'col-2', width: '50%', blockIds: ['text-1'] }
          ]
        }
      };

      const layout = updated.settings?.columnLayout as ColumnLayout[];
      expect(layout[0].blockIds).toHaveLength(0);
      expect(layout[1].blockIds).toContain('text-1');
      
      // ParentId should remain the same (still child of columns)
      expect(updated.children?.[0].parentId).toBe('columns-1');
    });
  });

  describe('Column Operations', () => {
    it('should add new column to columnLayout', () => {
      const layout = columnsBlock.settings?.columnLayout as ColumnLayout[];
      
      const newLayout = [
        ...layout,
        { columnId: 'col-3', width: '33.33%', blockIds: [] }
      ];

      expect(newLayout).toHaveLength(3);
      expect(newLayout[2].columnId).toBe('col-3');
    });

    it('should remove column from columnLayout', () => {
      const populated: BlockConfig = {
        ...columnsBlock,
        children: [
          {
            id: 'text-1',
            name: 'core/text',
            type: 'block',
            parentId: 'columns-1',
            content: { kind: 'text', value: 'Text 1' }
          }
        ],
        settings: {
          columnLayout: [
            { columnId: 'col-1', width: '50%', blockIds: ['text-1'] },
            { columnId: 'col-2', width: '50%', blockIds: [] }
          ]
        }
      };

      // Remove first column and its blocks
      const layout = populated.settings?.columnLayout as ColumnLayout[];
      const blocksToRemove = layout[0].blockIds;
      
      const updated = {
        ...populated,
        settings: {
          columnLayout: layout.filter((_, i) => i !== 0)
        },
        children: populated.children?.filter(c => !blocksToRemove.includes(c.id))
      };

      expect(updated.settings?.columnLayout).toHaveLength(1);
      expect(updated.children).toHaveLength(0);
    });

    it('should adjust column widths', () => {
      const layout = columnsBlock.settings?.columnLayout as ColumnLayout[];
      
      // Change to 3 equal columns
      const updatedLayout = layout.map(col => ({
        ...col,
        width: '33.33%'
      }));
      updatedLayout.push({ columnId: 'col-3', width: '33.33%', blockIds: [] });

      expect(updatedLayout).toHaveLength(3);
      expect(updatedLayout.every(col => col.width === '33.33%')).toBe(true);
    });
  });

  describe('Integration with Tree Operations', () => {
    it('should maintain parentId when moving blocks within columns', () => {
      const testBlocks: BlockConfig[] = [{
        ...columnsBlock,
        children: [
          {
            id: 'text-1',
            name: 'core/text',
            type: 'block',
            parentId: 'columns-1',
            content: { kind: 'text', value: 'Text 1' }
          },
          {
            id: 'text-2',
            name: 'core/text',
            type: 'block',
            parentId: 'columns-1',
            content: { kind: 'text', value: 'Text 2' }
          },
          {
            id: 'text-3',
            name: 'core/text',
            type: 'block',
            parentId: 'columns-1',
            content: { kind: 'text', value: 'Text 3' }
          }
        ]
      }];

      // Move within same parent (reorder) - move first to end
      const result = moveExistingBlock(testBlocks, 'columns-1', 0, 'columns-1', 3);
      
      const columns = result[0];
      expect(columns.children?.[0].id).toBe('text-2');
      expect(columns.children?.[1].id).toBe('text-3');
      expect(columns.children?.[2].id).toBe('text-1');
      
      // All should still have same parentId
      expect(columns.children?.[0].parentId).toBe('columns-1');
      expect(columns.children?.[1].parentId).toBe('columns-1');
      expect(columns.children?.[2].parentId).toBe('columns-1');
    });

    it('should handle nested containers in columns', () => {
      const testBlocks: BlockConfig[] = [columnsBlock];
      
      // Add group block to columns
      const result = insertNewBlock(testBlocks, 'columns-1', 0, 'core/group');
      const groupId = result.newId;
      
      // Add text to group
      const result2 = insertNewBlock(result.blocks, groupId, 0, 'core/text');
      
      const columns = result2.blocks[0];
      const group = columns.children?.[0];
      const text = group?.children?.[0];
      
      expect(group?.parentId).toBe('columns-1');
      expect(text?.parentId).toBe(groupId);
    });
  });
});

