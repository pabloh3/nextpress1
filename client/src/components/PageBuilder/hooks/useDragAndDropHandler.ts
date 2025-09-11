import { useCallback } from 'react';
import type { BlockConfig } from '@shared/schema';
import { moveFromLibraryToCanvas } from '../handlers/moveFromLibraryToCanvas';
import { moveFromLibraryToColumn } from '../handlers/moveFromLibraryToColumn';
import { reorderInCanvas } from '../handlers/reorderInCanvas';
import { moveFromCanvasToColumn } from '../handlers/moveFromCanvasToColumn';
import { moveFromColumnToCanvas } from '../handlers/moveFromColumnToCanvas';
import { moveBetweenColumns } from '../handlers/moveBetweenColumns';
import { parseColumnDroppable } from '../handlers/parseColumnDroppable';

export function useDragAndDropHandler(
  blocks: BlockConfig[],
  setBlocks: (blocks: BlockConfig[]) => void,
  setSelectedBlockId: (id: string) => void,
  setActiveTab: (tab: 'blocks' | 'settings') => void
) {
  const handleDragEnd = useCallback((result: any) => {
    if (!result.destination) return;
    const { source, destination, draggableId } = result;
    const sourceCol = parseColumnDroppable(source.droppableId);
    const destCol = parseColumnDroppable(destination.droppableId);

    let outcome;
    if (source.droppableId === 'block-library' && destination.droppableId === 'canvas') {
      outcome = moveFromLibraryToCanvas(blocks, destination, draggableId);
    } else if (source.droppableId === 'block-library' && destCol) {
      outcome = moveFromLibraryToColumn(blocks, destination, draggableId, destCol);
    } else if (source.droppableId === 'canvas' && destination.droppableId === 'canvas') {
      outcome = reorderInCanvas(blocks, source, destination);
    } else if (source.droppableId === 'canvas' && destCol) {
      outcome = moveFromCanvasToColumn(blocks, source, destination, destCol);
    } else if (sourceCol && destination.droppableId === 'canvas') {
      outcome = moveFromColumnToCanvas(blocks, source, destination, sourceCol);
    } else if (sourceCol && destCol) {
      outcome = moveBetweenColumns(blocks, source, destination, sourceCol, destCol);
    }

    if (outcome && outcome.blocks) {
      setBlocks(outcome.blocks);
      if (outcome.selectedBlockId) setSelectedBlockId(outcome.selectedBlockId);
      if (outcome.activeTab) setActiveTab(outcome.activeTab);
    }
  }, [blocks, setBlocks, setSelectedBlockId, setActiveTab]);

  return { handleDragEnd };
}
