import { useCallback } from 'react';
import type { BlockConfig } from '@shared/schema';
import { insertNewBlock, moveExistingBlock } from '@/lib/handlers/treeUtils';

export function useDragAndDropHandler(
  blocks: BlockConfig[],
  setBlocks: (blocks: BlockConfig[]) => void,
  setSelectedBlockId: (id: string) => void,
  setActiveTab: (tab: 'blocks' | 'settings') => void
) {
  const handleDragEnd = useCallback(
    (result: any) => {
      if (!result.destination) return;
      const { source, destination, draggableId } = result;

      const isFromLibrary = source.droppableId === 'block-library';
      const sourceParentId = source.droppableId === 'canvas' ? null : source.droppableId === 'block-library' ? null : source.droppableId;
      const destParentId = destination.droppableId === 'canvas' ? null : destination.droppableId === 'block-library' ? null : destination.droppableId;

      if (isFromLibrary) {
        const inserted = insertNewBlock(blocks, destParentId, destination.index, draggableId);
        setBlocks(inserted.blocks);
        if (inserted.newId) {
          setSelectedBlockId(inserted.newId);
          setActiveTab('settings');
        }
        return;
      }

      // Reorder or move existing
      const updated = moveExistingBlock(blocks, sourceParentId, source.index, destParentId, destination.index);
      setBlocks(updated);
    },
    [blocks, setBlocks, setSelectedBlockId, setActiveTab]
  );

  return { handleDragEnd };
}
