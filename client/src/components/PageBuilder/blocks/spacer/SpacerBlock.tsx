import React, { useState, useEffect, useRef } from "react";
import type { BlockConfig, BlockContent } from "@shared/schema-types";
import type { BlockDefinition, BlockComponentProps } from "../types.ts";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { CollapsibleCard } from "@/components/ui/collapsible-card";
import { Space as SpaceIcon, Settings, Wrench } from "lucide-react";
import {
  registerBlockState,
  unregisterBlockState,
  getBlockStateAccessor,
  type BlockStateAccessor,
} from "../blockStateRegistry";

// ============================================================================
// TYPES
// ============================================================================

type SpacerContent = {
  height?: number;
  anchor?: string;
  className?: string;
};

const DEFAULT_CONTENT: SpacerContent = {
  height: 100,
  anchor: "",
  className: "",
};

// ============================================================================
// RENDERER
// ============================================================================

interface SpacerRendererProps {
  content: SpacerContent;
  styles?: React.CSSProperties;
}

function SpacerRenderer({ content, styles }: SpacerRendererProps) {
  const height = content?.height ?? 100;
  
  return (
    <div
      className="wp-block-spacer"
      style={{
        height: `${height}px`,
        ...styles,
      }}
      aria-hidden="true"
    />
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function SpacerBlockComponent({
  value,
  onChange,
}: BlockComponentProps) {
  // State
  const [content, setContent] = useState<SpacerContent>(() => {
    return (value.content as SpacerContent) || DEFAULT_CONTENT;
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
        const newContent = (value.content as SpacerContent) || DEFAULT_CONTENT;
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

  return <SpacerRenderer content={content} styles={styles} />;
}

// ============================================================================
// SETTINGS COMPONENT
// ============================================================================

interface SpacerSettingsProps {
  block: BlockConfig;
  onUpdate?: (updates: Partial<BlockConfig>) => void;
}

function SpacerSettings({ block, onUpdate }: SpacerSettingsProps) {
  const accessor = getBlockStateAccessor(block.id);
  const [, setUpdateTrigger] = React.useState(0);

  // Get current state
  const content = accessor
    ? (accessor.getContent() as SpacerContent)
    : (block.content as SpacerContent) || DEFAULT_CONTENT;

  // Update handlers
  const updateContent = (updates: Partial<SpacerContent>) => {
    if (accessor) {
      const current = accessor.getContent() as SpacerContent;
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
      <CollapsibleCard title="Content" icon={SpaceIcon} defaultOpen={true}>
        <div className="space-y-4">
          <div>
            <Label htmlFor="spacer-height" className="text-sm font-medium text-gray-700">Height (px)</Label>
            <div className="flex items-center space-x-4">
              <Slider
                aria-label="Spacer height in pixels"
                value={[content?.height || 50]}
                onValueChange={([value]) => updateContent({ height: value })}
                max={200}
                min={10}
                step={5}
                className="flex-1"
              />
              <Input
                id="spacer-height"
                type="number"
                value={content?.height || 50}
                onChange={(e) => updateContent({ height: parseInt(e.target.value) || 50 })}
                className="w-20 h-9"
              />
            </div>
          </div>
        </div>
      </CollapsibleCard>

      {/* Settings Card (future extensibility) */}
      <CollapsibleCard title="Settings" icon={Settings} defaultOpen={true}>
        <div className="text-gray-500 text-xs">No additional settings.</div>
      </CollapsibleCard>

      {/* Advanced Card */}
      <CollapsibleCard title="Advanced" icon={Wrench} defaultOpen={false}>
        <div className="space-y-4">
          <div>
            <Label htmlFor="spacer-anchor" className="text-sm font-medium text-gray-700">Anchor ID</Label>
            <Input
              id="spacer-anchor"
              value={content?.anchor || ''}
              onChange={(e) => updateContent({ anchor: e.target.value })}
              placeholder="section-id"
              className="mt-1 h-9 text-sm"
            />
          </div>
          <div>
            <Label htmlFor="spacer-class" className="text-sm font-medium text-gray-700">CSS Classes</Label>
            <Input
              id="spacer-class"
              value={content?.className || ''}
              onChange={(e) => updateContent({ className: e.target.value })}
              placeholder="e.g. my-custom-spacer"
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

function LegacySpacerRenderer({
  block,
}: {
  block: BlockConfig;
  isPreview: boolean;
}) {
  return (
    <SpacerRenderer
      content={(block.content as SpacerContent) || DEFAULT_CONTENT}
      styles={block.styles}
    />
  );
}

// ============================================================================
// BLOCK DEFINITION
// ============================================================================

const SpacerBlock: BlockDefinition = {
  id: 'core/spacer',
  label: 'Spacer',
  icon: SpaceIcon,
  description: 'Add vertical spacing',
  category: 'layout',
  defaultContent: {
    height: 100,
  },
  defaultStyles: {
    padding: '0px',
    margin: '0px',
  },
  component: SpacerBlockComponent,
  renderer: LegacySpacerRenderer,
  settings: SpacerSettings,
  hasSettings: true,
};

export default SpacerBlock;
