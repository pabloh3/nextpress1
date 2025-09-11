import { useCallback } from 'react';
import type { BlockConfig } from '@shared/schema';
import { moveFromLibraryToCanvas } from '@/lib/handlers/moveFromLibraryToCanvas';
import { moveFromLibraryToColumn } from '@/lib/handlers/moveFromLibraryToColumn';
import { reorderInCanvas } from '@/lib/handlers/reorderInCanvas';
import { moveFromCanvasToColumn } from '@/lib/handlers/moveFromCanvasToColumn';
import { moveFromColumnToCanvas } from '@/lib/handlers/moveFromColumnToCanvas';
import { moveBetweenColumns } from '@/lib/handlers/moveBetweenColumns';
import { parseColumnDroppable } from '@/lib/handlers/parseColumnDroppable';

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
      const sourceCol = parseColumnDroppable(source.droppableId);
      const destCol = parseColumnDroppable(destination.droppableId);

      type DragOutcome =
  | { blocks: BlockConfig[]; selectedBlockId?: string; activeTab?: 'blocks' | 'settings' }
  | BlockConfig[]
  | undefined;

function isOutcomeObject(outcome: DragOutcome): outcome is { blocks: BlockConfig[]; selectedBlockId?: string; activeTab?: 'blocks' | 'settings' } {
  return !!(outcome && typeof outcome === 'object' && 'blocks' in outcome);
}

let outcome: DragOutcome = undefined;
      if (
        source.droppableId === 'block-library' &&
        destination.droppableId === 'canvas'
      ) {
        outcome = moveFromLibraryToCanvas(blocks, destination, draggableId);
      } else if (source.droppableId === 'block-library' && destCol) {
        outcome = moveFromLibraryToColumn(
          blocks,
          destination,
          draggableId,
          destCol
        );
      } else if (
        source.droppableId === 'canvas' &&
        destination.droppableId === 'canvas'
      ) {
        outcome = reorderInCanvas(blocks, source, destination);
      } else if (source.droppableId === 'canvas' && destCol) {
        outcome = moveFromCanvasToColumn(blocks, source, destination, destCol);
      } else if (sourceCol && destination.droppableId === 'canvas') {
        outcome = moveFromColumnToCanvas(
          blocks,
          source,
          destination,
          sourceCol
        );
      } else if (sourceCol && destCol) {
        outcome = moveBetweenColumns(
          blocks,
          source,
          destination,
          sourceCol,
          destCol
        );
      }

      if (isOutcomeObject(outcome)) {
        setBlocks(outcome.blocks);
        if (outcome.selectedBlockId) {
          setSelectedBlockId(outcome.selectedBlockId);
        }
        if (outcome.activeTab) {
          setActiveTab(outcome.activeTab);
        }
      } else if (Array.isArray(outcome)) {
        setBlocks(outcome);
      }
    },
    [blocks, setBlocks, setSelectedBlockId, setActiveTab]
  );

  return { handleDragEnd };
}
