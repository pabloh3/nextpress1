import type { BlockDefinition } from "./types";
import type { BlockConfig } from "@shared/schema";
import HeadingBlock from "./heading/HeadingBlock";
import TextBlock from "./text/TextBlock";
import ButtonBlock from "./button/ButtonBlock";
import ImageBlock from "./image/ImageBlock";
import VideoBlock from "./video/VideoBlock";
import AudioBlock from "./audio/AudioBlock";
import SpacerBlock from "./spacer/SpacerBlock";
import DividerBlock from "./divider/DividerBlock";
import ColumnsBlock from "./columns/ColumnsBlock";
import QuoteBlock from "./quote/QuoteBlock";
import ListBlock from "./list/ListBlock";
import MediaTextBlock from "./media-text/MediaTextBlock";

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
  // Gutenberg-compatible id for video
  "core/video": VideoBlock,
  // Backward compatibility
  video: VideoBlock,
  // Gutenberg-compatible id for audio
  "core/audio": AudioBlock,
  // Backward compatibility
  audio: AudioBlock,
  spacer: SpacerBlock,
  divider: DividerBlock,
  // Gutenberg-compatible id for columns
  "core/columns": ColumnsBlock,
  columns: ColumnsBlock,
  // Gutenberg-compatible id for quote
  "core/quote": QuoteBlock,
  // Backward compatibility
  quote: QuoteBlock,
  // Gutenberg-compatible id for list
  "core/list": ListBlock,
  // Backward compatibility
  list: ListBlock,
  // Gutenberg-compatible id for media & text
  "core/media-text": MediaTextBlock,
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
      contentAlignHorizontal: 'left',
      contentAlignVertical: 'top',
      ...def.defaultStyles,
    },
    settings: {},
  };
}

export type { BlockDefinition } from './types';

