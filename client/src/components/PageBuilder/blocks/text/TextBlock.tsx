import React from "react";
import type { BlockConfig, BlockContent } from "@shared/schema-types";
import type { BlockDefinition, BlockComponentProps } from "../types.ts";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { CollapsibleCard } from "@/components/ui/collapsible-card";
import { Type, AlignLeft, AlignCenter, AlignRight, AlignJustify, Settings, Wrench } from "lucide-react";
import { getBlockStateAccessor } from "../blockStateRegistry";
import { useBlockState } from "../useBlockState";

// ============================================================================
// TYPES
// ============================================================================

type TextBlockContent = BlockContent & {
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  align?: 'left' | 'center' | 'right' | 'justify';
  anchor?: string;
  className?: string;
  dropCap?: boolean;
};

const DEFAULT_CONTENT: TextBlockContent = {
  kind: 'text',
  value: 'Add your text content here. You can edit this text and customize its appearance.',
  textAlign: 'left',
  dropCap: false,
  anchor: '',
  className: '',
};

// ============================================================================
// RENDERER
// ============================================================================

interface TextRendererProps {
  content: TextBlockContent;
  styles?: React.CSSProperties;
}

function TextRenderer({ content, styles }: TextRendererProps) {
  const textContent = content?.kind === "text" ? content.value : "";
  const align =
    (content?.textAlign as string) ||
    (content?.align as string) ||
    (styles?.textAlign as string | undefined);
  const anchor = content?.anchor as string | undefined;
  const extraClass = (content?.className as string | undefined) || "";
  const dropCap = Boolean(content?.dropCap);

  const className = [
    "wp-block-paragraph",
    align ? `has-text-align-${align}` : "",
    dropCap ? "has-drop-cap" : "",
    extraClass,
  ]
    .filter(Boolean)
    .join(" ");

  const mergedStyles: React.CSSProperties = {
    ...styles,
    ...(align ? { textAlign: align as React.CSSProperties["textAlign"] } : {}),
  };

  return (
    <p id={anchor} className={className} style={mergedStyles}>
      {textContent}
    </p>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function TextBlockComponent({
  value,
  onChange,
}: BlockComponentProps) {
  const { content, setContent, styles } = useBlockState<TextBlockContent>({
    value,
    getDefaultContent: () => DEFAULT_CONTENT,
    onChange,
  });

  return <TextRenderer content={content} styles={styles} />;
}

// ============================================================================
// SETTINGS COMPONENT
// ============================================================================

interface TextSettingsProps {
  block: BlockConfig;
  onUpdate?: (updates: Partial<BlockConfig>) => void;
}

function TextSettings({ block, onUpdate }: TextSettingsProps) {
  const accessor = getBlockStateAccessor(block.id);
  const [, setUpdateTrigger] = React.useState(0);

  // Get current state
  const content = accessor
    ? (accessor.getContent() as TextBlockContent)
    : (block.content as TextBlockContent) || DEFAULT_CONTENT;

  // Update handlers
  const updateContent = (updates: Partial<TextBlockContent>) => {
    if (accessor) {
      const current = accessor.getContent() as TextBlockContent;
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

  const alignmentOptions = [
    { 
      value: 'left', 
      label: 'Left', 
      icon: AlignLeft 
    },
    { 
      value: 'center', 
      label: 'Center', 
      icon: AlignCenter 
    },
    { 
      value: 'right', 
      label: 'Right', 
      icon: AlignRight 
    },
    { 
      value: 'justify', 
      label: 'Justify', 
      icon: AlignJustify 
    }
  ];

  const currentAlign = content?.textAlign || content?.align || 'left';

  return (
    <div className="space-y-4">
      <CollapsibleCard
        title="Content"
        icon={Type}
        defaultOpen={true}
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="text-content">Text Content</Label>
            <Textarea
              id="text-content"
              aria-label="Text content"
              className="h-36"
              value={content?.kind === 'text' ? content.value : ''}
              onChange={(e) => updateContent({ kind: 'text', value: e.target.value } as TextBlockContent)}
              placeholder="Enter your text content"
              rows={4}
            />
          </div>
        </div>
      </CollapsibleCard>

      <CollapsibleCard
        title="Settings"
        icon={Settings}
        defaultOpen={true}
      >
        <div className="space-y-4">
          <div>
            <Label>Text Alignment</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {alignmentOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    onClick={() => updateContent({ textAlign: option.value as any })}
                    className={`flex items-center gap-2 p-3 text-sm font-medium rounded-lg border transition-colors ${
                      currentAlign === option.value
                        ? 'bg-gray-200 text-gray-800 border-gray-200 hover:bg-gray-300'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="paragraph-dropcap">Drop cap</Label>
            <Switch
              id="paragraph-dropcap"
              checked={Boolean(content?.dropCap)}
              onCheckedChange={(checked) => updateContent({ dropCap: checked })}
            />
          </div>
        </div>
      </CollapsibleCard>

      <CollapsibleCard
        title="Advanced"
        icon={Wrench}
        defaultOpen={false}
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="paragraph-anchor">Anchor</Label>
            <Textarea
              id="paragraph-anchor"
              value={content?.anchor || ''}
              onChange={(e) => updateContent({ anchor: e.target.value })}
              placeholder="Add an anchor (without #)"
              rows={1}
            />
          </div>
          <div>
            <Label htmlFor="paragraph-class">Additional CSS Class(es)</Label>
            <Textarea
              id="paragraph-class"
              aria-label="Additional CSS classes"
              value={content?.className || ''}
              onChange={(e) => updateContent({ className: e.target.value })}
              placeholder="e.g. custom-class is-style-outline"
              rows={1}
            />
          </div>
        </div>
      </CollapsibleCard>
    </div>
  );
}

// ============================================================================
// LEGACY RENDERER (Backward Compatibility)
// ============================================================================

function LegacyTextRenderer({
  block,
}: {
  block: BlockConfig;
  isPreview: boolean;
}) {
  return (
    <TextRenderer
      content={(block.content as TextBlockContent) || DEFAULT_CONTENT}
      styles={block.styles}
    />
  );
}

// ============================================================================
// BLOCK DEFINITION
// ============================================================================

const TextBlock: BlockDefinition = {
  id: 'core/paragraph',
  label: 'Paragraph',
  icon: Type,
  description: 'Add a paragraph of text',
  category: 'basic',
  defaultContent: {
    kind: 'text',
    value: 'Add your text content here. You can edit this text and customize its appearance.',
    textAlign: 'left',
    dropCap: false,
    anchor: '',
    className: '',
  },
  defaultStyles: {
    fontSize: '16px',
    lineHeight: '1.6',
    color: '#333333',
  },
  component: TextBlockComponent,
  renderer: LegacyTextRenderer,
  settings: TextSettings,
  hasSettings: true,
};

export default TextBlock;
