import type { BlockConfig } from '@shared/schema';
import { updateBlocksInColumn } from './updateBlocksInColumn';

export function moveBetweenColumns(
  blocks: BlockConfig[],
  source: { index: number },
  destination: { index: number },
  sourceCol: { blockId: string; columnIndex: number },
  destCol: { blockId: string; columnIndex: number }
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
  const toColumn =
    sourceCol.columnIndex === destCol.columnIndex
      ? fromColumn
      : { ...(columnsArr[destCol.columnIndex] || { width: 1, blocks: [] }) };
  const fromBlocks = Array.isArray(fromColumn.blocks)
    ? [...fromColumn.blocks]
    : [];
  const [moved] = fromBlocks.splice(source.index, 1);
  fromColumn.blocks = fromBlocks;
  const toBlocks = Array.isArray(toColumn.blocks) ? [...toColumn.blocks] : [];
  toBlocks.splice(destination.index, 0, moved);
  toColumn.blocks = toBlocks;
  columnsArr[sourceCol.columnIndex] = fromColumn;
  columnsArr[destCol.columnIndex] = toColumn;
  const updatedColumnBlock = {
    ...columnsBlock,
    content: { ...(columnsBlock.content || {}), columns: columnsArr },
  };
  blocksCopy[columnsBlockIndex] = updatedColumnBlock;
  return { blocks: blocksCopy };
}
