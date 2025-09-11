import type { BlockConfig } from '@shared/schema';

export function updateBlocksInColumn(
  columnBlock: any,
  columnIndex: number,
  newBlocks: BlockConfig[]
): any {
  const columnsArr = Array.isArray(columnBlock.content?.columns)
    ? [ ...(columnBlock.content.columns) ]
    : [];
  const targetColumn = { ...(columnsArr[columnIndex] || { width: 1, blocks: [] }) };
  targetColumn.blocks = newBlocks;
  columnsArr[columnIndex] = targetColumn;
  return {
    ...columnBlock,
    content: { ...(columnBlock.content || {}), columns: columnsArr },
  };
}
