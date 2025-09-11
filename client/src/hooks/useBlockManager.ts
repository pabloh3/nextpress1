import { useState, useCallback } from 'react';
import type { BlockConfig } from '@shared/schema';

export function useBlockManager(initialBlocks: BlockConfig[] = []) {
  const [blocks, setBlocks] = useState<BlockConfig[]>(initialBlocks);

  const updateBlock = useCallback((blockId: string, updates: Partial<BlockConfig>) => {
    setBlocks(blocks => blocks.map(block => block.id === blockId ? { ...block, ...updates } : block));
    return { status: true, data: null };
  }, []);

  const duplicateBlock = useCallback((blockId: string, generateBlockId: () => string) => {
    setBlocks(blocks => {
      const blockIndex = blocks.findIndex(block => block.id === blockId);
      if (blockIndex < 0) return blocks;
      const blockToDuplicate = blocks[blockIndex];
      const duplicatedBlock = { ...blockToDuplicate, id: generateBlockId() };
      const newBlocks = [...blocks];
      newBlocks.splice(blockIndex + 1, 0, duplicatedBlock);
      return newBlocks;
    });
    return { status: true, data: null };
  }, []);

  const deleteBlock = useCallback((blockId: string) => {
    setBlocks(blocks => blocks.filter(block => block.id !== blockId));
    return { status: true, data: null };
  }, []);

  return {
    blocks,
    setBlocks,
    updateBlock,
    duplicateBlock,
    deleteBlock,
  };
}
