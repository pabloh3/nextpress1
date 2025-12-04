import React, { useState, useEffect, useRef } from "react";
import type { BlockConfig, BlockContent } from "@shared/schema-types";
import type { BlockDefinition, BlockComponentProps } from "../types.ts";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { CollapsibleCard } from "@/components/ui/collapsible-card";
import { MousePointer, ExternalLink, Type, Settings, Link } from "lucide-react";
import {
  registerBlockState,
  unregisterBlockState,
  getBlockStateAccessor,
  type BlockStateAccessor,
} from "../blockStateRegistry";

// ============================================================================
// TYPES
// ============================================================================

type ButtonContent = BlockContent & {
  url?: string;
  linkTarget?: '_self' | '_blank';
  target?: string;
  rel?: string;
  title?: string;
  className?: string;
};

const DEFAULT_CONTENT: ButtonContent = {
  kind: 'text',
  value: 'Click Me',
  url: '#',
  linkTarget: '_self',
  rel: '',
  title: '',
  className: '',
};

// ============================================================================
// RENDERER
// ============================================================================

interface ButtonRendererProps {
  content: ButtonContent;
  styles?: React.CSSProperties;
  isPreview?: boolean;
}

function ButtonRenderer({ content, styles, isPreview }: ButtonRendererProps) {
  const textContent = content?.kind === 'text' ? content.value : '';
  const url = content?.url as string | undefined;
  const linkTarget = (content?.linkTarget as string | undefined) || (content?.target as string | undefined);
  const rel = content?.rel as string | undefined;
  const title = content?.title as string | undefined;
  const extraClass = (content?.className as string | undefined) || "";

  const wrapperClass = ["wp-block-button", extraClass].filter(Boolean).join(" ");
  const anchorClass = "wp-block-button__link wp-element-button";

  return (
    <div className={wrapperClass} onClick={(e) => (isPreview ? undefined : e.preventDefault())}>
      <a
        href={url}
        target={linkTarget}
        rel={rel}
        title={title}
        style={styles}
        className={anchorClass}
      >
        {textContent}
      </a>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ButtonBlockComponent({
  value,
  onChange,
  isPreview,
}: BlockComponentProps) {
  // State
  const [content, setContent] = useState<ButtonContent>(() => {
    return (value.content as ButtonContent) || DEFAULT_CONTENT;
  });
  const [styles, setStyles] = useState<React.CSSProperties | undefined>(
    () => value.styles
  );

  // Sync with props when block ID changes OR when content/styles change significantly
  // This prevents syncing to default values when parent state resets
  const lastSyncedBlockIdRef = useRef<string | null>(null);
  const lastSyncedContentRef = useRef<string | null>(null);
  const lastSyncedStylesRef = useRef<string | null>(null);
  const isSyncingFromPropsRef = useRef(false);
  
  useEffect(() => {
    const contentKey = JSON.stringify(value.content);
    const stylesKey = JSON.stringify(value.styles);
    
    // Sync if ID changed OR if content/styles changed significantly (not just reference)
    if (
      lastSyncedBlockIdRef.current !== value.id ||
      (lastSyncedBlockIdRef.current === value.id && 
       (lastSyncedContentRef.current !== contentKey || lastSyncedStylesRef.current !== stylesKey))
    ) {
      lastSyncedBlockIdRef.current = value.id;
      lastSyncedContentRef.current = contentKey;
      lastSyncedStylesRef.current = stylesKey;
      
      // Mark that we're syncing from props to prevent onChange loop
      isSyncingFromPropsRef.current = true;
      
      // Only sync if props have actual content, not defaults
      // This prevents syncing to defaults when parent state resets
      if (value.content && Object.keys(value.content).length > 0) {
        const newContent = (value.content as ButtonContent) || DEFAULT_CONTENT;
        setContent(newContent);
      }
      if (value.styles && Object.keys(value.styles).length > 0) {
        setStyles(value.styles);
      }
      
      // Reset flag after state updates
      setTimeout(() => {
        isSyncingFromPropsRef.current = false;
      }, 0);
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
  // Skip if we're syncing from props to prevent infinite loop
  useEffect(() => {
    if (!isSyncingFromPropsRef.current) {
      onChange({
        ...value,
        content: content as BlockContent,
        styles,
      });
    }
  }, [content, styles, value, onChange]);

  return <ButtonRenderer content={content} styles={styles} isPreview={isPreview} />;
}

// ============================================================================
// SETTINGS COMPONENT
// ============================================================================

interface ButtonSettingsProps {
  block: BlockConfig;
  onUpdate?: (updates: Partial<BlockConfig>) => void;
}

function ButtonSettings({ block, onUpdate }: ButtonSettingsProps) {
  const accessor = getBlockStateAccessor(block.id);
  const [, setUpdateTrigger] = React.useState(0);

  // Get current state
  const content = accessor
    ? (accessor.getContent() as ButtonContent)
    : (block.content as ButtonContent) || DEFAULT_CONTENT;

  // Update handlers
  const updateContent = (updates: Partial<ButtonContent>) => {
    if (accessor) {
      const current = accessor.getContent() as ButtonContent;
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
      <CollapsibleCard title="Content" icon={Type} defaultOpen={true}>
        <div className="space-y-4">
          <div>
            <Label htmlFor="button-text" className="text-sm font-medium text-gray-700">Button Text</Label>
            <Input
              id="button-text"
              value={content?.kind === 'text' ? content.value : ''}
              onChange={(e) => updateContent({ kind: 'text', value: e.target.value } as ButtonContent)}
              placeholder="Button text"
              className="mt-1 h-9"
            />
          </div>
          
          <div>
            <Label htmlFor="button-url" className="text-sm font-medium text-gray-700">Link URL</Label>
            <Input
              id="button-url"
              value={content?.url || ''}
              onChange={(e) => updateContent({ url: e.target.value })}
              placeholder="https://example.com"
              className="mt-1 h-9"
            />
          </div>
        </div>
      </CollapsibleCard>
      
      <CollapsibleCard title="Link Settings" icon={Link} defaultOpen={true}>
        <div className="space-y-3">
          <Label className="text-sm font-medium text-gray-700">Link Target</Label>
          <div className="flex flex-wrap gap-2">
            {[
              { value: '_self', label: 'Same Window' },
              { value: '_blank', label: 'New Window', icon: ExternalLink }
            ].map((target) => (
              <button
                key={target.value}
                onClick={() => updateContent({ linkTarget: target.value as '_self' | '_blank', target: undefined })}
                className={`h-8 px-3 text-xs font-medium rounded-md transition-all flex items-center gap-1 ${
                  (content?.linkTarget || content?.target || '_self') === target.value
                    ? "bg-gray-200 text-gray-800 hover:bg-gray-300" 
                    : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                }`}
              >
                {target.icon && <target.icon className="w-3 h-3" />}
                {target.label}
              </button>
            ))}
          </div>
        </div>
      </CollapsibleCard>
      
      <CollapsibleCard title="Advanced" icon={Settings} defaultOpen={false}>
        <div className="space-y-4">
          <div>
            <Label htmlFor="button-rel" className="text-sm font-medium text-gray-700">Rel Attribute</Label>
            <Input
              id="button-rel"
              value={content?.rel || ''}
              onChange={(e) => updateContent({ rel: e.target.value })}
              placeholder="noopener noreferrer"
              className="mt-1 h-9 text-sm"
            />
          </div>
          
          <div>
            <Label htmlFor="button-title" className="text-sm font-medium text-gray-700">Title Attribute</Label>
            <Input
              id="button-title"
              value={content?.title || ''}
              onChange={(e) => updateContent({ title: e.target.value })}
              placeholder="Link title"
              className="mt-1 h-9 text-sm"
            />
          </div>
          
          <div>
            <Label htmlFor="button-class" className="text-sm font-medium text-gray-700">CSS Classes</Label>
            <Input
              id="button-class"
              value={content?.className || ''}
              onChange={(e) => updateContent({ className: e.target.value })}
              placeholder="e.g. is-style-outline"
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

function LegacyButtonRenderer({
  block,
  isPreview,
}: {
  block: BlockConfig;
  isPreview: boolean;
}) {
  return (
    <ButtonRenderer
      content={(block.content as ButtonContent) || DEFAULT_CONTENT}
      styles={block.styles}
      isPreview={isPreview}
    />
  );
}

// ============================================================================
// BLOCK DEFINITION
// ============================================================================

const ButtonBlock: BlockDefinition = {
  id: 'core/button',
  label: 'Button',
  icon: MousePointer,
  description: 'Add a clickable button',
  category: 'basic',
  defaultContent: {
    kind: 'text',
    value: 'Click Me',
    url: '#',
    linkTarget: '_self',
    rel: '',
    title: '',
    className: '',
  },
  defaultStyles: {
    backgroundColor: '#007cba',
    color: '#ffffff',
    padding: '12px 24px',
    borderRadius: '4px',
    border: 'none',
    fontSize: '16px',
    textAlign: 'center',
    display: 'inline-block',
    cursor: 'pointer',
  },
  component: ButtonBlockComponent,
  renderer: LegacyButtonRenderer,
  settings: ButtonSettings,
  hasSettings: true,
};

export default ButtonBlock;
