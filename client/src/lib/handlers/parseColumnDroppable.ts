import type { BlockConfig } from '@shared/schema';

export function parseColumnDroppable(id: string): { blockId: string; columnIndex: number } | null {
  const match = id.match(/^(.*?):column:(\d+)$/);
  if (!match) return null;
  return { blockId: match[1], columnIndex: parseInt(match[2], 10) };
}
