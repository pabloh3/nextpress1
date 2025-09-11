import type { BlockConfig } from '@shared/schema';
import { updateBlocksInColumn } from './updateBlocksInColumn';

export function moveFromCanvasToColumn(
  blocks: BlockConfig[],
  source: { index: number },
  destination: { index: number },
  destCol: { blockId: string; columnIndex: number }
): { blocks: BlockConfig[] } {
  const blocksCopy = [...blocks];
  const [moved] = blocksCopy.splice(source.index, 1);
  const columnsBlockIndex = blocksCopy.findIndex(
    (b) => b.id === destCol.blockId
  );
  if (columnsBlockIndex === -1) return { blocks };
  const columnsBlock = blocksCopy[columnsBlockIndex];
  const columnsArr = Array.isArray(columnsBlock.content?.columns)
    ? [...columnsBlock.content.columns]
    : [];
  const targetColumn = {
    ...(columnsArr[destCol.columnIndex] || { width: 1, blocks: [] }),
  };
  const targetBlocks = Array.isArray(targetColumn.blocks)
    ? [...targetColumn.blocks]
    : [];
  targetBlocks.splice(destination.index, 0, moved);
  const updatedColumnBlock = updateBlocksInColumn(
    columnsBlock,
    destCol.columnIndex,
    targetBlocks
  );
  blocksCopy[columnsBlockIndex] = updatedColumnBlock;
  return { blocks: blocksCopy };
}
