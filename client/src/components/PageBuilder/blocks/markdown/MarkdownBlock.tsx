import React, { Suspense, lazy } from "react";
import type { BlockConfig, BlockContent } from "@shared/schema-types";
import type { BlockDefinition, BlockComponentProps } from "../types.ts";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { CollapsibleCard } from "@/components/ui/collapsible-card";
import { FileText as MarkdownIcon, Wrench } from "lucide-react";
import { getBlockStateAccessor } from "../blockStateRegistry";
import { useBlockState } from "../useBlockState";

// Import dynamically to avoid loading huge library if not needed
// or we can import standard if it's fine. @uiw/react-md-editor is pretty large
import MDEditor from "@uiw/react-md-editor";

// ============================================================================
// TYPES
// ============================================================================

export type MarkdownContent = {
  content?: string;
  className?: string;
};

const DEFAULT_CONTENT: MarkdownContent = {
  content: "### Welcome to Markdown!\n\nThis is a *markdown* block.",
  className: "",
};

// ============================================================================
// COMPONENT RENDERER
// ============================================================================

interface MarkdownRendererProps {
  content: MarkdownContent;
  styles?: React.CSSProperties;
  isPreview?: boolean;
  onChange?: (value: string) => void;
}

function MarkdownRenderer({ content, styles, isPreview, onChange }: MarkdownRendererProps) {
  const markdownText = content?.content || "";
  
  const className = [
    "wp-block-markdown",
    content?.className || "",
  ].filter(Boolean).join(" ");

  // In preview mode or rendering mode, display the actual markdown
  if (isPreview) {
    return (
      <div className={className} style={styles} data-color-mode="light">
        <MDEditor.Markdown source={markdownText} style={{ whiteSpace: 'pre-wrap' }} />
      </div>
    );
  }

  // Edit Mode: show embeddable markdown editor
  return (
    <div className={className} style={styles} data-color-mode="light">
      <div className="border border-transparent hover:border-gray-200 transition-colors focus-within:border-wp-blue rounded-md overflow-hidden">
        <MDEditor
          value={markdownText}
          onChange={(val) => onChange?.(val || "")}
          preview="live"
          height={400}
          hideToolbar={false}
          visiableDragbar={true}
        />
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function MarkdownBlockComponent({
  value,
  onChange,
  isPreview,
}: BlockComponentProps) {
  const { content, styles } = useBlockState<MarkdownContent>({
    value,
    getDefaultContent: () => DEFAULT_CONTENT,
    onChange,
  });

  const handleEditorChange = (newVal: string) => {
    // We update local state AND propagate upward
    const accessor = getBlockStateAccessor(value.id);
    if (accessor) {
      accessor.setContent({ ...(content as MarkdownContent), content: newVal });
    }
    // Also notify parent directly to ensure PageBuilder captures the edit
    onChange({
      ...value,
      content: {
        ...(value.content as Record<string, unknown>),
        content: newVal,
      } as unknown as BlockContent,
    });
  };

  return (
    <MarkdownRenderer 
      content={content} 
      styles={styles} 
      isPreview={isPreview} 
      onChange={handleEditorChange}
    />
  );
}

// ============================================================================
// SETTINGS COMPONENT
// ============================================================================

interface MarkdownSettingsProps {
  block: BlockConfig;
  onUpdate?: (updates: Partial<BlockConfig>) => void;
}

function MarkdownSettings({ block, onUpdate }: MarkdownSettingsProps) {
  const accessor = getBlockStateAccessor(block.id);
  const [, setUpdateTrigger] = React.useState(0);

  // Get current state
  const content = accessor
    ? (accessor.getContent() as MarkdownContent)
    : (block.content as MarkdownContent) || DEFAULT_CONTENT;

  // Update handlers
  const updateContent = (updates: Partial<MarkdownContent>) => {
    if (accessor) {
      const current = accessor.getContent() as MarkdownContent;
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

  return (
    <div className="space-y-4">
      <CollapsibleCard title="Advanced" icon={Wrench} defaultOpen={false}>
        <div className="space-y-4">
          <div>
            <Label htmlFor="markdown-class" className="text-sm font-medium text-gray-700">Additional CSS Class(es)</Label>
            <Input
              id="markdown-class"
              value={content?.className || ""}
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

function LegacyMarkdownRenderer({
  block,
  isPreview,
}: {
  block: BlockConfig;
  isPreview: boolean;
}) {
  return (
    <MarkdownRenderer
      content={(block.content as MarkdownContent) || DEFAULT_CONTENT}
      styles={block.styles}
      isPreview={isPreview}
    />
  );
}

// ============================================================================
// BLOCK DEFINITION
// ============================================================================

const MarkdownBlock: BlockDefinition = {
  id: "core/markdown",
  label: "Markdown",
  icon: MarkdownIcon,
  description: "Add rich text using Markdown format",
  category: "advanced",
  defaultContent: {
    content: "### Welcome to Markdown!\n\nThis is a *markdown* block.",
    className: "",
  },
  defaultStyles: {
    margin: "1em 0",
  },
  component: MarkdownBlockComponent,
  renderer: LegacyMarkdownRenderer,
  settings: MarkdownSettings,
  hasSettings: true,
};

export default MarkdownBlock;
