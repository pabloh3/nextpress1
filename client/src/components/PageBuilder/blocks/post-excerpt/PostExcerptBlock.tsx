// blocks/post-excerpt/PostExcerptBlock.tsx
import * as React from "react";
import type { BlockDefinition, BlockComponentProps } from "../types.ts";
import type { BlockConfig, BlockContent } from "@shared/schema-types";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { CollapsibleCard } from "@/components/ui/collapsible-card";
import { FileText, Settings, Wrench } from "lucide-react";
import { getBlockStateAccessor } from "../blockStateRegistry";
import { useBlockState } from "../useBlockState";

// ============================================================================
// TYPES
// ============================================================================

export type PostExcerptContent = {
  text?: string;
  maxLength?: number;
  showReadMore?: boolean;
  readMoreText?: string;
  className?: string;
};

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_CONTENT: PostExcerptContent = {
  text: "This is a brief summary of the post content that gives readers a preview of what to expect...",
  maxLength: 200,
  showReadMore: true,
  readMoreText: "Read More",
  className: "",
};

const MAX_LENGTH_MIN = 50;
const MAX_LENGTH_MAX = 500;
const MAX_LENGTH_STEP = 10;

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Truncate text to a given character limit, breaking at the nearest word boundary.
 * Appends ellipsis when text is actually truncated.
 */
function truncateText(text: string, maxLength: number): { truncated: string; wasTruncated: boolean } {
  if (!text || text.length <= maxLength) {
    return { truncated: text || "", wasTruncated: false };
  }

  const sliced = text.slice(0, maxLength);
  const lastSpace = sliced.lastIndexOf(" ");
  const breakpoint = lastSpace > 0 ? lastSpace : maxLength;

  return { truncated: sliced.slice(0, breakpoint) + "…", wasTruncated: true };
}

/** Build className string for the excerpt wrapper. */
function buildExcerptClassName(content: PostExcerptContent): string {
  return ["wp-block-post-excerpt", content?.className || ""]
    .filter(Boolean)
    .join(" ");
}

// ============================================================================
// RENDERER
// ============================================================================

interface PostExcerptRendererProps {
  content: PostExcerptContent;
  styles?: React.CSSProperties;
  isPreview?: boolean;
  onTextChange?: (text: string) => void;
}

/**
 * Pure presentational renderer for the post excerpt.
 * Editor mode: renders an editable textarea for authoring the excerpt.
 * Preview mode: renders truncated excerpt text with optional "Read More" link.
 */
function PostExcerptRenderer({ content, styles, isPreview, onTextChange }: PostExcerptRendererProps) {
  const text = content?.text || "";
  const maxLength = content?.maxLength ?? DEFAULT_CONTENT.maxLength!;
  const showReadMore = content?.showReadMore ?? true;
  const readMoreText = content?.readMoreText || "Read More";
  const className = buildExcerptClassName(content);

  // --- Preview mode: static truncated output ---
  if (isPreview) {
    const { truncated, wasTruncated } = truncateText(text, maxLength);

    return (
      <div className={className} style={styles}>
        <p className="wp-block-post-excerpt__excerpt">{truncated}</p>
        {showReadMore && wasTruncated && (
          <p className="wp-block-post-excerpt__more-link">
            <a href="#" onClick={(e) => e.preventDefault()}>
              {readMoreText}
            </a>
          </p>
        )}
      </div>
    );
  }

  // --- Editor mode: editable textarea ---
  return (
    <div className={className} style={styles}>
      <Textarea
        value={text}
        onChange={(e) => onTextChange?.(e.target.value)}
        placeholder="Write the post excerpt…"
        rows={4}
        className="resize-y text-sm"
      />
      {showReadMore && (
        <p className="wp-block-post-excerpt__more-link mt-2 text-sm text-blue-600">
          {readMoreText}
        </p>
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function PostExcerptComponent({
  value,
  onChange,
  isPreview,
}: BlockComponentProps) {
  const { content, styles } = useBlockState<PostExcerptContent>({
    value,
    getDefaultContent: () => DEFAULT_CONTENT,
    onChange,
  });

  /** Propagate text edits to both block state registry and parent onChange. */
  const handleTextChange = (newText: string) => {
    const accessor = getBlockStateAccessor(value.id);
    const updated: PostExcerptContent = { ...content, text: newText };

    if (accessor) {
      accessor.setContent(updated);
    }

    onChange({
      ...value,
      content: {
        ...(value.content as Record<string, unknown>),
        text: newText,
      } as unknown as BlockContent,
    });
  };

  return (
    <PostExcerptRenderer
      content={content}
      styles={styles}
      isPreview={isPreview}
      onTextChange={handleTextChange}
    />
  );
}

// ============================================================================
// SETTINGS COMPONENT
// ============================================================================

interface PostExcerptSettingsProps {
  block: BlockConfig;
  onUpdate?: (updates: Partial<BlockConfig>) => void;
}

/**
 * Sidebar settings panel for the post excerpt block.
 * Controls max character length, "Read More" toggle/text, and CSS classes.
 */
function PostExcerptSettings({ block, onUpdate }: PostExcerptSettingsProps) {
  const accessor = getBlockStateAccessor(block.id);
  const [, setUpdateTrigger] = React.useState(0);

  const content = accessor
    ? (accessor.getContent() as PostExcerptContent)
    : (block.content as PostExcerptContent) || DEFAULT_CONTENT;

  const updateContent = (updates: Partial<PostExcerptContent>) => {
    if (accessor) {
      const current = accessor.getContent() as PostExcerptContent;
      accessor.setContent({ ...current, ...updates });
      setUpdateTrigger((prev) => prev + 1);
    } else if (onUpdate) {
      onUpdate({
        content: {
          ...(block.content as Record<string, unknown>),
          ...updates,
        } as unknown as BlockContent,
      });
    }
  };

  const currentMaxLength = content?.maxLength ?? DEFAULT_CONTENT.maxLength!;
  const currentShowReadMore = content?.showReadMore ?? true;
  const currentReadMoreText = content?.readMoreText || "Read More";

  return (
    <div className="space-y-4">
      {/* Excerpt Settings */}
      <CollapsibleCard title="Excerpt Settings" icon={Settings} defaultOpen>
        <div className="space-y-4">
          {/* Max Length Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-gray-700">Max Length</Label>
              <span className="text-xs text-gray-500">{currentMaxLength} chars</span>
            </div>
            <Slider
              value={[currentMaxLength]}
              min={MAX_LENGTH_MIN}
              max={MAX_LENGTH_MAX}
              step={MAX_LENGTH_STEP}
              onValueChange={([val]) => updateContent({ maxLength: val })}
            />
          </div>

          {/* Show Read More Toggle */}
          <div className="flex items-center justify-between">
            <Label htmlFor="show-read-more" className="text-sm font-medium text-gray-700">
              Show "Read More"
            </Label>
            <Switch
              id="show-read-more"
              checked={currentShowReadMore}
              onCheckedChange={(checked) => updateContent({ showReadMore: checked })}
            />
          </div>

          {/* Read More Text Input (visible only when toggle is on) */}
          {currentShowReadMore && (
            <div>
              <Label htmlFor="read-more-text" className="text-sm font-medium text-gray-700">
                Read More Text
              </Label>
              <Input
                id="read-more-text"
                value={currentReadMoreText}
                onChange={(e) => updateContent({ readMoreText: e.target.value })}
                placeholder="Read More"
                className="mt-1 h-9 text-sm"
              />
            </div>
          )}
        </div>
      </CollapsibleCard>

      {/* Advanced / CSS Class */}
      <CollapsibleCard title="Advanced" icon={Wrench} defaultOpen={false}>
        <div>
          <Label htmlFor="excerpt-class" className="text-sm font-medium text-gray-700">
            Additional CSS Class(es)
          </Label>
          <Input
            id="excerpt-class"
            value={content?.className || ""}
            onChange={(e) => updateContent({ className: e.target.value })}
            placeholder="e.g. custom-excerpt"
            className="mt-1 h-9 text-sm"
          />
        </div>
      </CollapsibleCard>
    </div>
  );
}

// ============================================================================
// LEGACY RENDERER (Backward Compatibility)
// ============================================================================

function LegacyPostExcerptRenderer({
  block,
  isPreview,
}: {
  block: BlockConfig;
  isPreview: boolean;
}) {
  return (
    <PostExcerptRenderer
      content={(block.content as PostExcerptContent) || DEFAULT_CONTENT}
      styles={block.styles}
      isPreview={isPreview}
    />
  );
}

// ============================================================================
// BLOCK DEFINITION
// ============================================================================

/**
 * Post Excerpt block definition for the PageBuilder.
 * Displays a configurable post excerpt with truncation and optional "Read More" link.
 * In editor mode the excerpt is editable via a textarea; in preview mode it renders
 * as truncated static text.
 */
const PostExcerptBlock: BlockDefinition = {
  id: "post/excerpt",
  label: "Post Excerpt",
  icon: FileText,
  description: "Display a summary excerpt of the post",
  category: "post",
  defaultContent: DEFAULT_CONTENT,
  defaultStyles: { margin: "0 0 1em 0" },
  component: PostExcerptComponent,
  renderer: LegacyPostExcerptRenderer,
  settings: PostExcerptSettings,
  hasSettings: true,
};

export default PostExcerptBlock;
