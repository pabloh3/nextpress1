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
  // Gutenberg-compatible ids
  "core/heading": HeadingBlock,
  "core/paragraph": TextBlock,
  // Backward compatibility with existing saved data
  heading: HeadingBlock,
  text: TextBlock,
  // Gutenberg-compatible id for button
  "core/button": ButtonBlock,
  // Backward compatibility
  button: ButtonBlock,
  // Gutenberg-compatible id for image
  "core/image": ImageBlock,
  // Backward compatibility
  image: ImageBlock,
  video: VideoBlock,
  spacer: SpacerBlock,
  divider: DividerBlock,
  columns: ColumnsBlock,
  quote: QuoteBlock,
  // Gutenberg-compatible id for list
  "core/list": ListBlock,
  // Backward compatibility
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

