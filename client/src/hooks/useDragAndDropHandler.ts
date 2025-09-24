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

        // Debug log for DnD flow to help diagnose disappearing blocks
        console.debug('[DnD] DragEnd', {
          draggableId,
          source: { droppableId: source.droppableId, index: source.index },
          destination: { droppableId: destination.droppableId, index: destination.index },
          sourceParentId,
          destParentId,
        });

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

        // Early invalid guard: prevent drops into self container
        if (destParentId === draggableId) {
          console.warn('[DnD] Prevented drop into self container', { draggableId, destParentId });
          toast({
            title: "Invalid drop",
            description: "You can’t drop a block into itself.",
            variant: "destructive",
          });
          return;
        }

        // Early no-op guard: same parent + same index or immediate next index
        const sameParent = sourceParentId === destParentId;
        if (sameParent && (destination.index === source.index || destination.index === source.index + 1)) {
          console.debug('[DnD] No-op drop (same parent + same/next index)', {
            parentId: destParentId,
            sourceIndex: source.index,
            destIndex: destination.index,
          });
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
        setSelectedBlockId(draggableId);
        setActiveTab('settings');
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
