import type { BlockConfig } from '@shared/schema';
import { getDefaultBlock } from '../blocks';
import { updateBlocksInColumn } from './updateBlocksInColumn';

export function moveFromLibraryToColumn(
  blocks: BlockConfig[],
  destination: { index: number },
  draggableId: string,
  destCol: { blockId: string; columnIndex: number }
): { blocks: BlockConfig[]; selectedBlockId: string; activeTab: 'settings' } | BlockConfig[] {
  const blockType = draggableId;
  const newChild = getDefaultBlock(blockType, crypto.randomUUID());
  if (!newChild) return blocks;
  const blocksCopy = [...blocks];
  const columnsBlockIndex = blocksCopy.findIndex((b) => b.id === destCol.blockId);
  if (columnsBlockIndex === -1) return blocks;
  const columnsBlock = blocksCopy[columnsBlockIndex];
  const columnsArr = Array.isArray((columnsBlock.content?.columns))
    ? [ ...(columnsBlock.content.columns) ]
    : [];
  const targetColumn = { ...(columnsArr[destCol.columnIndex] || { width: 1, blocks: [] }) };
  const targetBlocks = Array.isArray(targetColumn.blocks) ? [ ...targetColumn.blocks ] : [];
  targetBlocks.splice(destination.index, 0, newChild);
  const updatedColumnBlock = updateBlocksInColumn(columnsBlock, destCol.columnIndex, targetBlocks);
  blocksCopy[columnsBlockIndex] = updatedColumnBlock;
  return { blocks: blocksCopy, selectedBlockId: newChild.id, activeTab: 'settings' };
}
