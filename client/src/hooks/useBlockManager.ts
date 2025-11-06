import { useState, useCallback, useEffect } from 'react';
import type { BlockConfig } from '@shared/schema-types';
import { 
  findBlock, 
  updateBlockDeep as updateBlockDeepTree, 
  deleteBlockDeep as deleteBlockDeepTree, 
  duplicateBlockDeep as duplicateBlockDeepTree,
  setParentIds 
} from '@/lib/handlers/treeUtils';

export function useBlockManager(initialBlocks: BlockConfig[] = []) {
  const [blocks, setBlocks] = useState<BlockConfig[]>(() => {
    // Initialize parentIds when loading blocks
    return setParentIds(initialBlocks, null);
  });

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
      const { found, next } = deleteBlockDeepTree(prev, blockId);
      wasRemoved = found;
      return next;
    });
    return { status: wasRemoved, data: null };
  }, []);

  const updateBlockContent = useCallback((blockId: string, contentUpdates: any) => {
    const block = findBlockById(blockId);
    if (!block) return { status: false, data: null };
    
    // Merge content updates with existing content
    const mergedContent = { ...block.content, ...contentUpdates };
    return updateBlock(blockId, { content: mergedContent });
  }, [updateBlock, findBlockById]);

  const updateBlockStyles = useCallback((blockId: string, styleUpdates: Record<string, any>) => {
    const block = findBlockById(blockId);
    if (!block) return { status: false, data: null };
    
    // Merge style updates with existing styles
    const mergedStyles = { ...block.styles, ...styleUpdates };
    return updateBlock(blockId, { styles: mergedStyles });
  }, [updateBlock, findBlockById]);

  return {
    blocks,
    setBlocks,
    findBlockById,
    updateBlock,
    updateBlockContent,
    updateBlockStyles,
    duplicateBlock,
    deleteBlock,
  };
}
