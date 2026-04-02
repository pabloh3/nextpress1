// blocks/heading/HeadingBlock.tsx
import { Heading1, Type, Settings } from "lucide-react";
import type { BlockDefinition, BlockComponentProps } from "../types.ts";
import type { BlockConfig, BlockContent } from "@shared/schema-types";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { CollapsibleCard } from "@/components/ui/collapsible-card";
import * as React from "react";
import type { JSX } from "react";
import { getBlockStateAccessor } from "../blockStateRegistry";
import { useBlockState } from "../useBlockState";

// ============================================================================
// TYPES
// ============================================================================

type HeadingContent = BlockContent & {
  level?: number;
  anchor?: string;
  className?: string;
  textAlign?: "left" | "center" | "right" | "justify";
};

// ============================================================================
// CONSTANTS & DATA
// ============================================================================

const DEFAULT_CONTENT: HeadingContent = {
  kind: "text",
  value: "",
  level: 2,
  textAlign: "left",
  anchor: "",
  className: "",
};

const HEADING_LEVELS = [1, 2, 3, 4, 5, 6] as const;

/** Default font sizes per heading level — Tailwind's CSS reset strips browser defaults */
const HEADING_FONT_SIZES: Record<number, string> = {
  1: "2.5rem",
  2: "2rem",
  3: "1.75rem",
  4: "1.5rem",
  5: "1.25rem",
  6: "1rem",
};

const SETTINGS_SECTIONS = {
  content: { title: "Content", icon: Type, defaultOpen: true },
  settings: { title: "Settings", icon: Settings, defaultOpen: true },
  advanced: { title: "Advanced", icon: Settings, defaultOpen: false },
} as const;

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Get text content from heading content safely
 */
function getTextContent(content: HeadingContent): string {
  return content?.kind === "text" ? content.value : "";
}

/**
 * Build className string for heading element
 */
function buildHeadingClassName(content: HeadingContent): string {
  const classes = ["wp-block-heading"];

  if (content.textAlign) {
    classes.push(`has-text-align-${content.textAlign}`);
  }

  if (content.className) {
    classes.push(content.className);
  }

  return classes.filter(Boolean).join(" ");
}

/**
 * Get button className for option buttons (levels, alignments, etc.)
 */
function getOptionButtonClassName(isActive: boolean): string {
  const base = "h-9 px-3 text-sm font-semibold rounded-md transition-all";
  const active = "bg-gray-200 text-gray-800 hover:bg-gray-300";
  const inactive =
    "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300";

  return `${base} ${isActive ? active : inactive}`;
}

// ============================================================================
// RENDERER
// ============================================================================

interface HeadingRendererProps {
  content: HeadingContent;
  styles?: React.CSSProperties;
}

function HeadingRenderer({ content, styles }: HeadingRendererProps) {
  const textContent = getTextContent(content);
  const level = content.level || 2;
  const Tag = `h${level}` as keyof JSX.IntrinsicElements;
  const className = buildHeadingClassName(content);

  // Apply default font size per level unless explicitly overridden by styles
  const mergedStyles: React.CSSProperties = {
    fontSize: HEADING_FONT_SIZES[level],
    ...styles,
  };

  return (
    <Tag id={content.anchor} className={className} style={mergedStyles}>
      {textContent}
    </Tag>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function HeadingBlockComponent({
  value,
  onChange,
}: BlockComponentProps) {
  const { content, styles } = useBlockState<HeadingContent>({
    value,
    getDefaultContent: () => DEFAULT_CONTENT,
    onChange,
  });

  return <HeadingRenderer content={content} styles={styles} />;
}

// ============================================================================
// SETTINGS COMPONENT
// ============================================================================

interface HeadingSettingsProps {
  block: BlockConfig;
  onUpdate?: (updates: Partial<BlockConfig>) => void;
}

function LegacyHeadingSettings({ block, onUpdate }: HeadingSettingsProps) {
  const accessor = getBlockStateAccessor(block.id);
  const [, setUpdateTrigger] = React.useState(0);

  // Get current state
  const content = accessor
    ? (accessor.getContent() as HeadingContent)
    : (block.content as HeadingContent) || DEFAULT_CONTENT;

  // Update handlers
  const updateContent = (updates: Partial<HeadingContent>) => {
    if (accessor) {
      const current = accessor.getContent() as HeadingContent;
      accessor.setContent({ ...current, ...updates });
      setUpdateTrigger((prev) => prev + 1);
    } else if (onUpdate) {
      onUpdate({
        content: {
          ...block.content,
          ...updates,
        } as BlockContent,
      });
    }
  };

  // Derived data
  const textValue = content?.kind === "text" ? content.value : "";
  const currentLevel = content?.level || 2;
  // Render
  return (
    <div className="space-y-4">
      {/* Content Section */}
      <CollapsibleCard
        title={SETTINGS_SECTIONS.content.title}
        icon={SETTINGS_SECTIONS.content.icon}
        defaultOpen={SETTINGS_SECTIONS.content.defaultOpen}
      >
        <div>
          <Label
            htmlFor="heading-text"
            className="text-sm font-medium text-gray-700"
          >
            Heading Text
          </Label>
          <Input
            id="heading-text"
            aria-label="Heading text"
            value={textValue}
            onChange={(e) =>
              updateContent({ kind: "text", value: e.target.value })
            }
            placeholder="Enter heading text"
            className="mt-1 h-9"
          />
        </div>
      </CollapsibleCard>

      {/* Level Section */}
      <CollapsibleCard
        title={SETTINGS_SECTIONS.settings.title}
        icon={SETTINGS_SECTIONS.settings.icon}
        defaultOpen={SETTINGS_SECTIONS.settings.defaultOpen}
      >
        <div className="space-y-3">
          <Label className="text-sm font-medium text-gray-700">
            Heading Level
          </Label>
          <div className="flex flex-wrap gap-2">
            {HEADING_LEVELS.map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => updateContent({ level })}
                className={getOptionButtonClassName(currentLevel === level)}
                aria-label={`Heading level ${level}`}
              >
                H{level}
              </button>
            ))}
          </div>
        </div>
      </CollapsibleCard>

      {/* Advanced Section */}
      <CollapsibleCard
        title={SETTINGS_SECTIONS.advanced.title}
        icon={SETTINGS_SECTIONS.advanced.icon}
        defaultOpen={SETTINGS_SECTIONS.advanced.defaultOpen}
      >
        <div className="space-y-4">
          <div>
            <Label
              htmlFor="heading-anchor"
              className="text-sm font-medium text-gray-700"
            >
              Anchor ID
            </Label>
            <Input
              id="heading-anchor"
              aria-label="Anchor ID"
              value={content?.anchor || ""}
              onChange={(e) => updateContent({ anchor: e.target.value })}
              placeholder="Add an anchor (without #)"
              className="mt-1 h-9 text-sm"
            />
          </div>

          <div>
            <Label
              htmlFor="heading-class"
              className="text-sm font-medium text-gray-700"
            >
              CSS Classes
            </Label>
            <Input
              id="heading-class"
              aria-label="CSS Classes"
              value={content?.className || ""}
              onChange={(e) => updateContent({ className: e.target.value })}
              placeholder="e.g. my-custom-heading"
              className="mt-1 h-9 text-sm"
            />
          </div>
        </div>
      </CollapsibleCard>
    </div>
  );
}

// ============================================================================
// BLOCK DEFINITION
// ============================================================================

export const HeadingBlock: BlockDefinition = {
  id: "core/heading",
  label: "Heading",
  icon: Heading1,
  description: "Add a heading text",
  category: "basic",
  defaultContent: {
    kind: "text",
    value: "Your heading here",
    level: 2,
    textAlign: "left",
    anchor: "",
    className: "",
  },
  defaultStyles: {
    fontSize: "2rem",
    fontWeight: "bold",
    margin: "1rem 0",
  },
  component: HeadingBlockComponent,
  settings: LegacyHeadingSettings,
  hasSettings: true,
};

export default HeadingBlock;
