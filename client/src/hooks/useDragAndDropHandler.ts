import { useCallback } from 'react';
import type { DropResult } from '@hello-pangea/dnd';
import type { BlockConfig } from '@shared/schema';
import { insertNewBlock, moveExistingBlock } from '@/lib/handlers/treeUtils';
import { useToast } from '@/hooks/use-toast';

export function useDragAndDropHandler(
  blocks: BlockConfig[],
  setBlocks: (blocks: BlockConfig[]) => void,
  setSelectedBlockId: (id: string) => void,
  setActiveTab: (tab: 'blocks' | 'settings') => void
) {
  const { toast } = useToast();

  const handleDragEnd = useCallback(
    (result: DropResult) => {
      if (!result.destination) return;
      const { source, destination, draggableId } = result;

      try {
        const isFromLibrary = source.droppableId === 'block-library';
        const sourceParentId = source.droppableId === 'canvas' ? null : source.droppableId === 'block-library' ? null : source.droppableId;
        const destParentId = destination.droppableId === 'canvas' ? null : destination.droppableId === 'block-library' ? null : destination.droppableId;

        if (isFromLibrary) {
          const result = insertNewBlock(blocks, destParentId, destination.index, draggableId);
          // Check if insertion failed (returned original blocks without changes)
          if (result.blocks === blocks) {
            toast({
              title: "Failed to add block",
              description: "Could not insert block at the specified location",
              variant: "destructive",
            });
            return;
          }
          setBlocks(result.blocks);
          if (result.newId) {
            setSelectedBlockId(result.newId);
            setActiveTab('settings');
          }
          return;
        }

        // Reorder or move existing
        const result = moveExistingBlock(blocks, sourceParentId, source.index, destParentId, destination.index);
        // Check if move failed (returned original blocks without changes)
        if (result === blocks) {
          toast({
            title: "Failed to move block",
            description: "Could not move block to the specified location",
            variant: "destructive",
          });
          return;
        }
        setBlocks(result);
      } catch (error) {
        console.error('Drag and drop error:', error);
        toast({
          title: "Drag operation failed",
          description: "An unexpected error occurred while moving the block.",
          variant: "destructive",
        });
      }
    },
    [blocks, setBlocks, setSelectedBlockId, setActiveTab, toast]
  );

  return { handleDragEnd };
}
