import type { BlockDefinition } from "./types";
import type { BlockConfig } from "@shared/schema";
import HeadingBlock from "./heading/HeadingBlock";
import TextBlock from "./text/TextBlock";
import ButtonBlock from "./button/ButtonBlock";
import ImageBlock from "./image/ImageBlock";
import VideoBlock from "./video/VideoBlock";
import SpacerBlock from "./spacer/SpacerBlock";
import DividerBlock from "./divider/DividerBlock";
import ColumnsBlock from "./columns/ColumnsBlock";
import QuoteBlock from "./quote/QuoteBlock";
import ListBlock from "./list/ListBlock";

export const blockRegistry: Record<string, BlockDefinition> = {
  heading: HeadingBlock,
  text: TextBlock,
  button: ButtonBlock,
  image: ImageBlock,
  video: VideoBlock,
  spacer: SpacerBlock,
  divider: DividerBlock,
  columns: ColumnsBlock,
  quote: QuoteBlock,
  list: ListBlock,
};

export function getDefaultBlock(type: string, id: string): BlockConfig | null {
  const def = blockRegistry[type];
  if (!def) return null;
  return {
    id,
    type,
    content: def.defaultContent,
    styles: {
      padding: '20px',
      margin: '0px',
      ...def.defaultStyles,
    },
    settings: {},
  };
}

export type { BlockDefinition } from './types';

