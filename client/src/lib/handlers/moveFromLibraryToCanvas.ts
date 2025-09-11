import type { BlockConfig } from '@shared/schema';
import { getDefaultBlock } from '../../components/PageBuilder/blocks';

export function moveFromLibraryToCanvas(
  blocks: BlockConfig[],
  destination: { index: number },
  draggableId: string
):
  | { blocks: BlockConfig[]; selectedBlockId: string; activeTab: 'settings' }
  | BlockConfig[] {
  const blockType = draggableId;
  const newBlock = getDefaultBlock(blockType, crypto.randomUUID());
  if (!newBlock) return blocks;
  const newBlocks = [...blocks];
  newBlocks.splice(destination.index, 0, newBlock);
  return {
    blocks: newBlocks,
    selectedBlockId: newBlock.id,
    activeTab: 'settings',
  };
}
