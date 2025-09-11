import type { BlockConfig } from '@shared/schema';

export function reorderInCanvas(
  blocks: BlockConfig[],
  source: { index: number },
  destination: { index: number }
): { blocks: BlockConfig[] } {
  const newBlocks = Array.from(blocks);
  const [removed] = newBlocks.splice(source.index, 1);
  newBlocks.splice(destination.index, 0, removed);
  return { blocks: newBlocks };
}
