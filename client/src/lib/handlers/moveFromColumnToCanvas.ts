import type { BlockConfig } from '@shared/schema';
import { updateBlocksInColumn } from './updateBlocksInColumn';

export function moveFromColumnToCanvas(
  blocks: BlockConfig[],
  source: { index: number },
  destination: { index: number },
  sourceCol: { blockId: string; columnIndex: number }
): { blocks: BlockConfig[] } {
  const blocksCopy = [...blocks];
  const columnsBlockIndex = blocksCopy.findIndex(
    (b) => b.id === sourceCol.blockId
  );
  if (columnsBlockIndex === -1) return { blocks };
  const columnsBlock = blocksCopy[columnsBlockIndex];
  const columnsArr = Array.isArray(columnsBlock.content?.columns)
    ? [...columnsBlock.content.columns]
    : [];
  const fromColumn = {
    ...(columnsArr[sourceCol.columnIndex] || { width: 1, blocks: [] }),
  };
  const fromBlocks = Array.isArray(fromColumn.blocks)
    ? [...fromColumn.blocks]
    : [];
  const [moved] = fromBlocks.splice(source.index, 1);
  const updatedColumnBlock = updateBlocksInColumn(
    columnsBlock,
    sourceCol.columnIndex,
    fromBlocks
  );
  blocksCopy[columnsBlockIndex] = updatedColumnBlock;
  blocksCopy.splice(destination.index, 0, moved);
  return { blocks: blocksCopy };
}
