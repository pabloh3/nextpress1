import { useState, useCallback } from 'react';
import type { BlockConfig } from '@shared/schema';
import { findBlock, updateBlockDeep as updateBlockDeepTree, deleteBlockDeep as deleteBlockDeepTree, duplicateBlockDeep as duplicateBlockDeepTree } from '@/lib/handlers/treeUtils';

export function useBlockManager(initialBlocks: BlockConfig[] = []) {
  const [blocks, setBlocks] = useState<BlockConfig[]>(initialBlocks);

  const findBlockById = useCallback((blockId: string) => {
    return findBlock(blocks, blockId);
  }, [blocks]);

  const updateBlock = useCallback((blockId: string, updates: Partial<BlockConfig>) => {
    let wasUpdated = false;
    setBlocks(prev => {
      const { found, next } = updateBlockDeepTree(prev, blockId, updates);
      wasUpdated = found;
      return next;
    });
    return { status: wasUpdated, data: null };
  }, []);

  const duplicateBlock = useCallback((blockId: string, generateBlockId: () => string) => {
    let newId: string | undefined;
    let didDuplicate = false;
    setBlocks(prev => {
      const { found, next, duplicatedId } = duplicateBlockDeepTree(prev, blockId, generateBlockId);
      newId = duplicatedId || undefined;
      didDuplicate = Boolean(found && duplicatedId);
      return next;
    });
    return { status: didDuplicate, data: didDuplicate ? { newId } : null };
  }, []);

  const deleteBlock = useCallback((blockId: string) => {
    let wasRemoved = false;
    setBlocks(prev => {
      const { removed, next } = deleteBlockDeepTree(prev, blockId);
      wasRemoved = removed;
      return next;
    });
    return { status: wasRemoved, data: null };
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
