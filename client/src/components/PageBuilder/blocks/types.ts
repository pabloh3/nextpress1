// client/src/components/PageBuilder/blocks/types.ts
import type { BlockConfig } from "@shared/schema-types";

export type BlockCategory = 'basic' | 'media' | 'layout' | 'advanced';

export interface BlockDefinition {
  id: string; // Canonical machine key (e.g., 'core/heading', 'core/paragraph')
  label: string; // User-facing display name (e.g., 'Heading', 'Paragraph')
  icon: any;
  description: string;
  category: BlockCategory;
  defaultContent: any;
  defaultStyles: Record<string, any>;
  isContainer?: boolean; // identifies blocks that can contain children
  handlesOwnChildren?: boolean; // renderer manages its own children
  hasSettings?: boolean; // indicates if the block has settings UI
  renderer: (props: { block: BlockConfig; isPreview: boolean }) => JSX.Element;
  settings: (props: { block: BlockConfig; onUpdate: (updates: Partial<BlockConfig>) => void }) => JSX.Element;
}