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
import SeparatorBlock from "./separator/SeparatorBlock";
import GroupBlock from "./group/GroupBlock";
import ButtonsBlock from "./buttons/ButtonsBlock";
import GalleryBlock from "./gallery/GalleryBlock";
import CoverBlock from "./cover/CoverBlock";
import FileBlock from "./file/FileBlock";
import CodeBlock from "./code/CodeBlock";
import HtmlBlock from "./html/HtmlBlock";
import PullquoteBlock from "./pullquote/PullquoteBlock";
import PreformattedBlock from "./preformatted/PreformattedBlock";
import TableBlock from "./table/TableBlock";

export const blockRegistry: Record<string, BlockDefinition> = {
  // Gutenberg-compatible ids (deprecated aliases removed per new architecture)
  "core/heading": HeadingBlock,
  "core/paragraph": TextBlock,
  "core/button": ButtonBlock,
  "core/buttons": ButtonsBlock,
  "core/image": ImageBlock,
  "core/gallery": GalleryBlock,
  "core/video": VideoBlock,
  "core/audio": AudioBlock,
  "core/spacer": SpacerBlock,
  "core/separator": SeparatorBlock,
  "core/columns": ColumnsBlock,
  "core/group": GroupBlock,
  "core/quote": QuoteBlock,
  "core/list": ListBlock,
  "core/media-text": MediaTextBlock,
  "core/cover": CoverBlock,
  "core/file": FileBlock,
  "core/code": CodeBlock,
  "core/html": HtmlBlock,
  "core/pullquote": PullquoteBlock,
  "core/preformatted": PreformattedBlock,
  "core/table": TableBlock,
  
  // Backward compatibility with existing saved data - removed as db will be reset










  
  // Custom blocks (keep for backward compatibility)

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
    children: def.isContainer ? [] : undefined,
  };
}

export type { BlockDefinition } from './types';

