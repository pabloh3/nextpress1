import React from "react";
import type { BlockConfig, BlockContent } from "@shared/schema-types";
import type { BlockDefinition, BlockComponentProps } from "../types.ts";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { CollapsibleCard } from "@/components/ui/collapsible-card";
import { Code2 as HtmlIcon, Wrench } from "lucide-react";
import { getBlockStateAccessor } from "../blockStateRegistry";
import { useBlockState } from "../useBlockState";

// ============================================================================
// TYPES
// ============================================================================

type HtmlContent = {
  content?: string;
  className?: string;
};

const DEFAULT_CONTENT: HtmlContent = {
  content: '',
  className: '',
};

// ============================================================================
// RENDERER
// ============================================================================

interface HtmlRendererProps {
  content: HtmlContent;
  styles?: React.CSSProperties;
  isPreview?: boolean;
}

function HtmlRenderer({ content, styles, isPreview }: HtmlRendererProps) {
  const htmlContent = content?.content || '';
  
  const className = [
    "wp-block-html",
    content?.className || "",
  ].filter(Boolean).join(" ");

  // In preview mode, render the HTML directly
  // In edit mode, show it as code
  if (isPreview && htmlContent) {
    return (
      <div
        className={className}
        style={styles}
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    );
  }

  return (
    <div className={className} style={styles}>
      <div style={{
        backgroundColor: '#f8f9fa',
        padding: '1em',
        borderRadius: '4px',
        border: '1px solid #e9ecef',
        fontFamily: 'Monaco, Consolas, "Andale Mono", "DejaVu Sans Mono", monospace',
        fontSize: '14px',
        lineHeight: '1.4',
        whiteSpace: 'pre-wrap',
        color: '#6c757d',
      }}>
        {htmlContent || 'Enter custom HTML...'}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function HtmlBlockComponent({
  value,
  onChange,
  isPreview,
}: BlockComponentProps) {
  const { content, styles } = useBlockState<HtmlContent>({
    value,
    getDefaultContent: () => DEFAULT_CONTENT,
    onChange,
  });

  return <HtmlRenderer content={content} styles={styles} isPreview={isPreview} />;
}

// ============================================================================
// SETTINGS COMPONENT
// ============================================================================

interface HtmlSettingsProps {
  block: BlockConfig;
  onUpdate?: (updates: Partial<BlockConfig>) => void;
}

function HtmlSettings({ block, onUpdate }: HtmlSettingsProps) {
  const accessor = getBlockStateAccessor(block.id);
  const [, setUpdateTrigger] = React.useState(0);

  // Get current state
  const content = accessor
    ? (accessor.getContent() as HtmlContent)
    : (block.content as HtmlContent) || DEFAULT_CONTENT;

  // Update handlers
  const updateContent = (updates: Partial<HtmlContent>) => {
    if (accessor) {
      const current = accessor.getContent() as HtmlContent;
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

  return (
    <div className="space-y-4">
      {/* Content Card */}
      <CollapsibleCard title="Content" icon={HtmlIcon} defaultOpen={true}>
        <div className="space-y-4">
          <div>
            <Label htmlFor="html-content" className="text-sm font-medium text-gray-700">Custom HTML</Label>
            <Textarea
              id="html-content"
              value={content?.content || ''}
              onChange={(e) => updateContent({ content: e.target.value })}
              placeholder="<p>Enter your custom HTML here...</p>"
              rows={10}
              className="mt-1"
              style={{
                fontFamily: 'Monaco, Consolas, "Andale Mono", "DejaVu Sans Mono", monospace',
                fontSize: '14px',
              }}
            />
            <p className="text-sm text-gray-600 mt-2">
              Be careful when adding custom HTML. Make sure it's from a trusted source and won't break your site.
            </p>
          </div>
        </div>
      </CollapsibleCard>

      {/* Advanced Card */}
      <CollapsibleCard title="Advanced" icon={Wrench} defaultOpen={false}>
        <div className="space-y-4">
          <div>
            <Label htmlFor="html-class" className="text-sm font-medium text-gray-700">Additional CSS Class(es)</Label>
            <Input
              id="html-class"
              value={content?.className || ''}
              onChange={(e) => updateContent({ className: e.target.value })}
              placeholder="e.g. custom-widget"
              className="mt-1 h-9 text-sm"
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

function LegacyHtmlRenderer({
  block,
  isPreview,
}: {
  block: BlockConfig;
  isPreview: boolean;
}) {
  return (
    <HtmlRenderer
      content={(block.content as HtmlContent) || DEFAULT_CONTENT}
      styles={block.styles}
      isPreview={isPreview}
    />
  );
}

// ============================================================================
// BLOCK DEFINITION
// ============================================================================

const HtmlBlock: BlockDefinition = {
  id: 'core/html',
  label: 'Custom HTML',
  icon: HtmlIcon,
  description: 'Add custom HTML code',
  category: 'advanced',
  defaultContent: {
    content: '',
    className: '',
  },
  defaultStyles: {
    margin: '1em 0',
  },
  component: HtmlBlockComponent,
  renderer: LegacyHtmlRenderer,
  settings: HtmlSettings,
  hasSettings: true,
};

export default HtmlBlock;
