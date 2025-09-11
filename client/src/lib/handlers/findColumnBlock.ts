import type { BlockConfig } from '@shared/schema';

export function findColumnBlock(
  blocks: BlockConfig[],
  blockId: string
): BlockConfig | undefined {
  return blocks.find((b) => b.id === blockId);
}
