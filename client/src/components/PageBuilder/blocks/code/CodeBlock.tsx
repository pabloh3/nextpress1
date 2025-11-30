import React, { useState, useEffect, useRef } from "react";
import type { BlockConfig, BlockContent } from "@shared/schema-types";
import type { BlockDefinition, BlockComponentProps } from "../types.ts";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { CollapsibleCard } from "@/components/ui/collapsible-card";
import { Code as CodeIcon, Settings, Wrench } from "lucide-react";
import {
  registerBlockState,
  unregisterBlockState,
  getBlockStateAccessor,
  type BlockStateAccessor,
} from "../blockStateRegistry";

// ============================================================================
// TYPES
// ============================================================================

type CodeContent = {
  content?: string;
  language?: string;
  className?: string;
};

const DEFAULT_CONTENT: CodeContent = {
  content: '// Write your code here\nfunction hello() {\n  console.log("Hello, World!");\n}',
  language: '',
  className: '',
};

// ============================================================================
// RENDERER
// ============================================================================

interface CodeRendererProps {
  content: CodeContent;
  styles?: React.CSSProperties;
}

function CodeRenderer({ content, styles }: CodeRendererProps) {
  const codeContent = content?.content || '';
  const language = content?.language || '';
  
  const className = [
    "wp-block-code",
    language ? `language-${language}` : '',
    content?.className || "",
  ].filter(Boolean).join(" ");

  return (
    <div className={className} style={styles}>
      <pre style={{
        backgroundColor: '#f8f9fa',
        padding: '1em',
        borderRadius: '4px',
        border: '1px solid #e9ecef',
        overflow: 'auto',
        fontFamily: 'Monaco, Consolas, "Andale Mono", "DejaVu Sans Mono", monospace',
        fontSize: '14px',
        lineHeight: '1.4',
        margin: 0,
      }}>
        <code>{codeContent}</code>
      </pre>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function CodeBlockComponent({
  value,
  onChange,
}: BlockComponentProps) {
  // State
  const [content, setContent] = useState<CodeContent>(() => {
    return (value.content as CodeContent) || DEFAULT_CONTENT;
  });
  const [styles, setStyles] = useState<React.CSSProperties | undefined>(
    () => value.styles
  );

  // Sync with props only when block ID changes
  const lastSyncedBlockIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (lastSyncedBlockIdRef.current !== value.id) {
      lastSyncedBlockIdRef.current = value.id;
      const newContent = (value.content as CodeContent) || DEFAULT_CONTENT;
      setContent(newContent);
      setStyles(value.styles);
    }
  }, [value.id, value.content, value.styles]);

  // Register state accessors for settings
  useEffect(() => {
    const accessor: BlockStateAccessor = {
      getContent: () => content,
      getStyles: () => styles,
      setContent: setContent,
      setStyles: setStyles,
      getFullState: () => ({
        ...value,
        content: content as BlockContent,
        styles,
      }),
    };
    registerBlockState(value.id, accessor);
    return () => unregisterBlockState(value.id);
  }, [value.id, content, styles, value]);

  // Immediate onChange to notify parent (parent handles debouncing for localStorage)
  useEffect(() => {
    onChange({
      ...value,
      content: content as BlockContent,
      styles,
    });
  }, [content, styles, value, onChange]);

  return <CodeRenderer content={content} styles={styles} />;
}

// ============================================================================
// SETTINGS COMPONENT
// ============================================================================

interface CodeSettingsProps {
  block: BlockConfig;
  onUpdate?: (updates: Partial<BlockConfig>) => void;
}

function CodeSettings({ block, onUpdate }: CodeSettingsProps) {
  const accessor = getBlockStateAccessor(block.id);
  const [, setUpdateTrigger] = React.useState(0);

  // Get current state
  const content = accessor
    ? (accessor.getContent() as CodeContent)
    : (block.content as CodeContent) || DEFAULT_CONTENT;

  // Update handlers
  const updateContent = (updates: Partial<CodeContent>) => {
    if (accessor) {
      const current = accessor.getContent() as CodeContent;
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
      <CollapsibleCard title="Content" icon={CodeIcon} defaultOpen={true}>
        <div className="space-y-4">
          <div>
            <Label htmlFor="code-content" className="text-sm font-medium text-gray-700">Code</Label>
            <Textarea
              id="code-content"
              value={content?.content || ''}
              onChange={(e) => updateContent({ content: e.target.value })}
              placeholder="Enter your code here..."
              rows={8}
              className="mt-1"
              style={{
                fontFamily: 'Monaco, Consolas, "Andale Mono", "DejaVu Sans Mono", monospace',
                fontSize: '14px',
              }}
            />
          </div>
        </div>
      </CollapsibleCard>

      {/* Settings Card */}
      <CollapsibleCard title="Settings" icon={Settings} defaultOpen={true}>
        <div className="space-y-4">
          <div>
            <Label htmlFor="code-language" className="text-sm font-medium text-gray-700">Language (optional)</Label>
            <Input
              id="code-language"
              value={content?.language || ''}
              onChange={(e) => updateContent({ language: e.target.value })}
              placeholder="e.g. javascript, python, html"
              className="mt-1 h-9"
            />
          </div>
        </div>
      </CollapsibleCard>

      {/* Advanced Card */}
      <CollapsibleCard title="Advanced" icon={Wrench} defaultOpen={false}>
        <div className="space-y-4">
          <div>
            <Label htmlFor="code-class" className="text-sm font-medium text-gray-700">Additional CSS Class(es)</Label>
            <Input
              id="code-class"
              value={content?.className || ''}
              onChange={(e) => updateContent({ className: e.target.value })}
              placeholder="e.g. line-numbers"
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

function LegacyCodeRenderer({
  block,
}: {
  block: BlockConfig;
  isPreview: boolean;
}) {
  return (
    <CodeRenderer
      content={(block.content as CodeContent) || DEFAULT_CONTENT}
      styles={block.styles}
    />
  );
}

// ============================================================================
// BLOCK DEFINITION
// ============================================================================

const CodeBlock: BlockDefinition = {
  id: 'core/code',
  label: 'Code',
  icon: CodeIcon,
  description: 'Display code with syntax highlighting',
  category: 'advanced',
  defaultContent: {
    content: '// Write your code here\nfunction hello() {\n  console.log("Hello, World!");\n}',
    language: '',
    className: '',
  },
  defaultStyles: {
    margin: '1em 0',
  },
  component: CodeBlockComponent,
  renderer: LegacyCodeRenderer,
  settings: CodeSettings,
  hasSettings: true,
};

export default CodeBlock;
