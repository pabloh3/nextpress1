import React, { useState, useEffect, useRef } from "react";
import type { BlockConfig, BlockContent } from "@shared/schema-types";
import type { BlockDefinition, BlockComponentProps } from "../types.ts";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CollapsibleCard } from "@/components/ui/collapsible-card";
import { Quote as QuoteIcon, Settings, Wrench } from "lucide-react";
import {
  registerBlockState,
  unregisterBlockState,
  getBlockStateAccessor,
  type BlockStateAccessor,
} from "../blockStateRegistry";

// ============================================================================
// TYPES
// ============================================================================

type QuoteContent = {
  value?: string;
  text?: string;
  citation?: string;
  author?: string;
  anchor?: string;
  className?: string;
  textAlign?: 'left' | 'center' | 'right';
  align?: 'wide' | 'full';
};

const DEFAULT_CONTENT: QuoteContent = {
  value: '<p>Add a quote</p>',
  citation: '',
  textAlign: undefined,
  align: undefined,
  anchor: '',
  className: '',
};

// ============================================================================
// RENDERER
// ============================================================================

interface QuoteRendererProps {
  content: QuoteContent;
  styles?: React.CSSProperties;
}

function QuoteRenderer({ content, styles }: QuoteRendererProps) {
  const valueHtmlRaw: string | undefined = content?.value;
  const legacyText: string | undefined = content?.text;
  const citation: string | undefined = content?.citation ?? content?.author;
  const anchor: string | undefined = content?.anchor;
  const className: string | undefined = content?.className;
  const textAlign: 'left' | 'center' | 'right' | undefined = content?.textAlign;
  const align: 'wide' | 'full' | undefined = content?.align;

  const valueHtml = (valueHtmlRaw && valueHtmlRaw.trim().length > 0)
    ? valueHtmlRaw
    : (legacyText ? `<p>${legacyText}</p>` : '<p>Add a quote</p>');

  const classes = [
    'wp-block-quote',
    className || '',
    textAlign ? `has-text-align-${textAlign}` : '',
    align ? `align${align}` : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <blockquote
      {...(anchor ? { id: anchor } : {})}
      className={classes || undefined}
      style={{
        backgroundColor: '#f8fafc',
        borderLeft: '4px solid #e2e8f0',
        padding: '16px 20px',
        borderRadius: '6px',
        fontStyle: 'italic',
        fontFamily: 'Georgia, Cambria, "Times New Roman", Times, serif',
        fontSize: '1.125rem',
        lineHeight: 1.7,
        ...styles,
      }}
    >
      <div style={{ whiteSpace: 'pre-wrap' }} dangerouslySetInnerHTML={{ __html: valueHtml }} />
      {citation && (
        <cite style={{ display: 'block', marginTop: '10px', fontSize: '0.95rem', color: '#64748b' }}>
          — {citation}
        </cite>
      )}
    </blockquote>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function QuoteBlockComponent({
  value,
  onChange,
}: BlockComponentProps) {
  // State
  const [content, setContent] = useState<QuoteContent>(() => {
    return (value.content as QuoteContent) || DEFAULT_CONTENT;
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
        const newContent = (value.content as QuoteContent) || DEFAULT_CONTENT;
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

  return <QuoteRenderer content={content} styles={styles} />;
}

// ============================================================================
// SETTINGS COMPONENT
// ============================================================================

interface QuoteSettingsProps {
  block: BlockConfig;
  onUpdate?: (updates: Partial<BlockConfig>) => void;
}

function QuoteSettings({ block, onUpdate }: QuoteSettingsProps) {
  const accessor = getBlockStateAccessor(block.id);
  const [, setUpdateTrigger] = React.useState(0);

  // Get current state
  const content = accessor
    ? (accessor.getContent() as QuoteContent)
    : (block.content as QuoteContent) || DEFAULT_CONTENT;

  // Update handlers
  const updateContent = (updates: Partial<QuoteContent>) => {
    if (accessor) {
      const current = accessor.getContent() as QuoteContent;
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
      <CollapsibleCard title="Content" icon={QuoteIcon} defaultOpen={true}>
        <div className="space-y-4">
          <div>
            <Label htmlFor="quote-text" className="text-sm font-medium text-gray-700">Quote</Label>
            <Textarea
              id="quote-text"
              value={(() => {
                const v: string | undefined = content?.value;
                if (v && v.includes('<p')) {
                  // Convert HTML paragraphs to newline-separated text for editing UX
                  return v
                    .split(/<\/p>/i)
                    .map((chunk) => chunk.replace(/<p[^>]*>/i, ''))
                    .filter((line) => line !== '')
                    .join('\n');
                }
                return content?.text || '';
              })()}
              onChange={(e) => {
                const lines = e.target.value.split('\n');
                const html = lines.map((l) => `<p>${l}</p>`).join('');
                updateContent({ value: html });
              }}
              placeholder={`Add your quote...`}
              rows={4}
              className="h-32"
              aria-label="Quote text"
            />
          </div>
          <div>
            <Label htmlFor="quote-author" className="text-sm font-medium text-gray-700">Citation</Label>
            <Input
              id="quote-author"
              value={content?.citation ?? content?.author ?? ''}
              onChange={(e) => updateContent({ citation: e.target.value })}
              placeholder="Who said this (optional)"
              className="h-9"
              aria-label="Citation"
            />
          </div>
        </div>
      </CollapsibleCard>

      {/* Settings Card */}
      <CollapsibleCard title="Settings" icon={Settings} defaultOpen={true}>
        <div className="space-y-4">
          <div>
            <Label htmlFor="quote-text-align" className="text-sm font-medium text-gray-700">Text Align</Label>
            <Select
              value={content?.textAlign ?? 'default'}
              onValueChange={(value) => updateContent({ textAlign: value === 'default' ? undefined : (value as 'left' | 'center' | 'right') })}
            >
              <SelectTrigger id="quote-text-align" className="h-9 mt-1">
                <SelectValue placeholder="Default" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="left">Left</SelectItem>
                <SelectItem value="center">Center</SelectItem>
                <SelectItem value="right">Right</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="quote-align" className="text-sm font-medium text-gray-700">Width</Label>
            <Select
              value={content?.align ?? 'default'}
              onValueChange={(value) => updateContent({ align: value === 'default' ? undefined : (value as 'wide' | 'full') })}
            >
              <SelectTrigger id="quote-align" className="h-9">
                <SelectValue placeholder="Default" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="wide">Wide</SelectItem>
                <SelectItem value="full">Full</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CollapsibleCard>

      {/* Advanced Card */}
      <CollapsibleCard title="Advanced" icon={Wrench} defaultOpen={false}>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="quote-anchor" className="text-sm font-medium text-gray-700">Anchor</Label>
            <Input
              id="quote-anchor"
              value={content?.anchor ?? ''}
              onChange={(e) => updateContent({ anchor: e.target.value })}
              placeholder="section-id"
              className="h-9"
              aria-label="Anchor ID"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="quote-class" className="text-sm font-medium text-gray-700">CSS Class</Label>
            <Input
              id="quote-class"
              value={content?.className ?? ''}
              onChange={(e) => updateContent({ className: e.target.value })}
              placeholder="custom-class"
              className="h-9"
              aria-label="CSS Class"
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

function LegacyQuoteRenderer({
  block,
}: {
  block: BlockConfig;
  isPreview: boolean;
}) {
  return (
    <QuoteRenderer
      content={(block.content as QuoteContent) || DEFAULT_CONTENT}
      styles={block.styles}
    />
  );
}

// ============================================================================
// BLOCK DEFINITION
// ============================================================================

const QuoteBlock: BlockDefinition = {
  id: 'core/quote',
  label: 'Quote',
  icon: QuoteIcon,
  description: 'Add a blockquote',
  category: 'advanced',
  defaultContent: {
    value: '<p>Add a quote</p>',
    citation: '',
    textAlign: undefined,
    align: undefined,
    anchor: '',
    className: '',
  },
  defaultStyles: {},
  component: QuoteBlockComponent,
  renderer: LegacyQuoteRenderer,
  settings: QuoteSettings,
  hasSettings: true,
};

export default QuoteBlock;
