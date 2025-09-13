// client/src/components/PageBuilder/blocks/types.ts
import type { BlockConfig } from "@shared/schema";

export type BlockCategory = 'basic' | 'media' | 'layout' | 'advanced';

export interface BlockDefinition {
  id: string;
  name: string;
  icon: any;
  description: string;
  category: BlockCategory;
  defaultContent: any;
  defaultStyles: Record<string, any>;
  isContainer?: boolean; // identifies blocks that can contain children
  renderer: (props: { block: BlockConfig; isPreview: boolean }) => JSX.Element;
  settings: (props: { block: BlockConfig; onUpdate: (updates: Partial<BlockConfig>) => void }) => JSX.Element;
}