import { describe, it, expect } from 'vitest';
import { findBlock, findBlockPath, insertNewBlock, moveExistingBlock } from '@/lib/handlers/treeUtils';
import type { BlockConfig } from '@shared/schema';

// Helpers
const makeBlock = (id: string, type: string = 'core/paragraph', children?: BlockConfig[]): BlockConfig => ({
  id,
  type,
  content: type === 'core/paragraph' ? { text: id } : {},
  styles: {},
  settings: {},
  children
});

describe('treeUtils', () => {
  describe('findBlock', () => {
    it('finds a root block', () => {
      const blocks = [makeBlock('a'), makeBlock('b')];
      const result = findBlock(blocks, 'b');
      expect(result?.id).toBe('b');
    });

    it('finds a nested block', () => {
      const blocks = [makeBlock('group', 'core/group', [makeBlock('child')])];
      const result = findBlock(blocks, 'child');
      expect(result?.id).toBe('child');
    });

    it('returns null when absent', () => {
      const blocks = [makeBlock('x')];
      expect(findBlock(blocks, 'missing')).toBeNull();
    });
  });

  describe('findBlockPath', () => {
    it('returns indices path for nested block', () => {
      const blocks = [
        makeBlock('outer', 'core/group', [
          makeBlock('inner', 'core/group', [
            makeBlock('leaf')
          ])
        ])
      ];
      const path = findBlockPath(blocks, 'leaf');
      expect(path).not.toBeNull();
      // Path includes -1 markers; ensure final index chain ends with leaf index
      expect(path?.filter(i => i !== -1)).toEqual([0,0,0]);
    });

    it('returns null when not found', () => {
      const blocks = [makeBlock('only')];
      expect(findBlockPath(blocks, 'nope')).toBeNull();
    });
  });

  describe('insertNewBlock', () => {
    it('inserts at root', () => {
      const blocks: BlockConfig[] = [];
      const { blocks: next, newId } = insertNewBlock(blocks, null, 0, 'core/paragraph');
      expect(next).toHaveLength(1);
      expect(next[0].id).toBe(newId);
    });

    it('inserts into container at index', () => {
      const blocks: BlockConfig[] = [makeBlock('grp', 'core/group', [])];
      const { blocks: next, newId } = insertNewBlock(blocks, 'grp', 0, 'core/paragraph');
      const grp = next[0];
      expect(grp.children).toHaveLength(1);
      expect(grp.children?.[0].id).toBe(newId);
    });

    it('no-ops for invalid parent id', () => {
      const initial: BlockConfig[] = [makeBlock('root')];
      const { blocks: next } = insertNewBlock(initial, 'missing', 0, 'core/paragraph');
      expect(next).toBe(initial); // unchanged reference
    });
  });

  describe('moveExistingBlock', () => {
    it('reorders upward within same container', () => {
      const blocks: BlockConfig[] = [makeBlock('grp', 'core/group', [makeBlock('a'), makeBlock('b'), makeBlock('c')])];
      const next = moveExistingBlock(blocks, 'grp', 2, 'grp', 0); // move c to front
      const grp = next[0];
      expect(grp.children?.map(c => c.id)).toEqual(['c','a','b']);
    });

    it('reorders downward within same container (regression)', () => {
      const blocks: BlockConfig[] = [makeBlock('grp', 'core/group', [makeBlock('a'), makeBlock('b'), makeBlock('c')])];
      const next = moveExistingBlock(blocks, 'grp', 0, 'grp', 3); // move a to end using dest beyond length
      const grp = next[0];
      expect(grp.children?.map(c => c.id)).toEqual(['b','c','a']);
    });

    it('moves from root to container', () => {
      const blocks: BlockConfig[] = [makeBlock('orphan'), makeBlock('grp', 'core/group', [])];
      const next = moveExistingBlock(blocks, null, 0, 'grp', 0);
      const grp = next.find(b => b.id === 'grp');
      expect(grp?.children?.[0].id).toBe('orphan');
      expect(next.find(b => b.id === 'orphan')).toBeUndefined();
    });

    it('moves from container to root at index', () => {
      const blocks: BlockConfig[] = [makeBlock('grp', 'core/group', [makeBlock('a'), makeBlock('b')])];
      const next = moveExistingBlock(blocks, 'grp', 0, null, 1); // move a to root index 1
      expect(next.map(b => b.id)).toEqual(['grp','a']);
      const grp = next[0];
      expect(grp.children?.map(c => c.id)).toEqual(['b']);
    });

    it('moves between containers', () => {
      const blocks: BlockConfig[] = [
        makeBlock('g1', 'core/group', [makeBlock('x')]),
        makeBlock('g2', 'core/group', [])
      ];
      const next = moveExistingBlock(blocks, 'g1', 0, 'g2', 0);
      const g1 = next.find(b => b.id === 'g1');
      const g2 = next.find(b => b.id === 'g2');
      expect(g1?.children).toHaveLength(0);
      expect(g2?.children?.[0].id).toBe('x');
    });

    it('no-op when dropping in same position', () => {
      const blocks: BlockConfig[] = [makeBlock('grp', 'core/group', [makeBlock('a'), makeBlock('b')])];
      const next = moveExistingBlock(blocks, 'grp', 0, 'grp', 0);
      // Should return original reference indicating no change
      expect(next).toBe(blocks);
    });

    it('no-op when dropping immediately after itself (same container)', () => {
      const blocks: BlockConfig[] = [makeBlock('grp', 'core/group', [makeBlock('a'), makeBlock('b'), makeBlock('c')])];
      const next = moveExistingBlock(blocks, 'grp', 0, 'grp', 1);
      expect(next).toBe(blocks);
    });

    it('clamps negative destination index to 0', () => {
      const blocks: BlockConfig[] = [makeBlock('grp', 'core/group', [makeBlock('a'), makeBlock('b')])];
      const next = moveExistingBlock(blocks, 'grp', 1, 'grp', -5);
      const grp = next[0];
      expect(grp.children?.map(c => c.id)).toEqual(['b','a']);
    });

    it('clamps destination index beyond length to append', () => {
      const blocks: BlockConfig[] = [makeBlock('grp', 'core/group', [makeBlock('a'), makeBlock('b')])];
      const next = moveExistingBlock(blocks, 'grp', 0, 'grp', 999);
      const grp = next[0];
      expect(grp.children?.map(c => c.id)).toEqual(['b','a']);
    });
  });
});
