import { useState, useCallback } from 'react';
import type { BlockConfig } from '@shared/schema';
import { findBlock } from '@/lib/handlers/treeUtils';

// Helper functions for deep tree operations
function deepClone<T>(obj: T): T { return structuredClone(obj); }

function updateBlockDeep(list: BlockConfig[], blockId: string, updates: Partial<BlockConfig>): BlockConfig[] {
  let changed = false;
  const next = list.map(b => {
    if (b.id === blockId) { changed = true; return { ...b, ...updates }; }
    if (b.children) {
      const updatedChildren = updateBlockDeep(b.children, blockId, updates);
      if (updatedChildren !== b.children) { changed = true; return { ...b, children: updatedChildren }; }
    }
    return b;
  });
  return changed ? next : list;
}

function deleteBlockDeep(list: BlockConfig[], blockId: string): { next: BlockConfig[]; removed: boolean } {
  let removed = false;
  const filtered = list
    .map(b => {
      if (b.id === blockId) { removed = true; return null; }
      if (b.children) {
        const { next: childNext, removed: childRemoved } = deleteBlockDeep(b.children, blockId);
        if (childRemoved) { removed = true; return { ...b, children: childNext }; }
      }
      return b;
    })
    .filter(Boolean) as BlockConfig[];
  return { next: removed ? filtered : list, removed };
}

function duplicateBlockDeep(list: BlockConfig[], blockId: string, generateBlockId: () => string): { next: BlockConfig[]; duplicatedId?: string } {
  for (let i = 0; i < list.length; i++) {
    const b = list[i];
    if (b.id === blockId) {
      const clone = deepClone(b);
      const remapIds = (blk: BlockConfig) => {
        blk.id = generateBlockId();
        if (Array.isArray(blk.children)) blk.children.forEach(remapIds);
      };
      remapIds(clone);
      const next = [...list];
      next.splice(i + 1, 0, clone);
      return { next, duplicatedId: clone.id };
    }
    if (b.children) {
      const { next: childNext, duplicatedId } = duplicateBlockDeep(b.children, blockId, generateBlockId);
      if (duplicatedId) {
        const next = [...list];
        next[i] = { ...b, children: childNext };
        return { next, duplicatedId };
      }
    }
  }
  return { next: list };
}

export function useBlockManager(initialBlocks: BlockConfig[] = []) {
  const [blocks, setBlocks] = useState<BlockConfig[]>(initialBlocks);

  const findBlockById = useCallback((blockId: string) => {
    return findBlock(blocks, blockId);
  }, [blocks]);

  const updateBlock = useCallback((blockId: string, updates: Partial<BlockConfig>) => {
    setBlocks(prev => updateBlockDeep(prev, blockId, updates));
    return { status: true, data: null };
  }, []);

  const duplicateBlock = useCallback((blockId: string, generateBlockId: () => string) => {
    let newId: string | undefined;
    setBlocks(prev => {
      const { next, duplicatedId } = duplicateBlockDeep(prev, blockId, generateBlockId);
      newId = duplicatedId;
      return next;
    });
    return { status: true, data: { newId } };
  }, []);

  const deleteBlock = useCallback((blockId: string) => {
    setBlocks(prev => deleteBlockDeep(prev, blockId).next);
    return { status: true, data: null };
  }, []);

  return {
    blocks,
    setBlocks,
    findBlockById,
    updateBlock,
    duplicateBlock,
    deleteBlock,
  };
}
