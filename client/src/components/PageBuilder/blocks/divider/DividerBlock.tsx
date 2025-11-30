import React, { useState, useEffect, useRef } from "react";
import type { BlockConfig, BlockContent } from "@shared/schema-types";
import type { BlockDefinition, BlockComponentProps } from "../types.ts";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { CollapsibleCard } from "@/components/ui/collapsible-card";
import { Minus as MinusIcon, Settings } from "lucide-react";
import {
  registerBlockState,
  unregisterBlockState,
  getBlockStateAccessor,
  type BlockStateAccessor,
} from "../blockStateRegistry";

// ============================================================================
// TYPES
// ============================================================================

type DividerContent = {
  style?: string;
  color?: string;
  width?: number;
};

const DEFAULT_CONTENT: DividerContent = {
  style: 'solid',
  width: 100,
  color: '#cccccc',
};

// ============================================================================
// RENDERER
// ============================================================================

interface DividerRendererProps {
  content: DividerContent;
  styles?: React.CSSProperties;
}

function DividerRenderer({ content, styles }: DividerRendererProps) {
  return (
    <div style={{ padding: styles?.padding, margin: styles?.margin }}>
      <hr
        style={{
          borderStyle: content?.style as any,
          borderWidth: '1px 0 0 0',
          borderColor: content?.color,
          width: `${content?.width || 100}%`,
          margin: '0 auto',
        }}
      />
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function DividerBlockComponent({
  value,
  onChange,
}: BlockComponentProps) {
  // State
  const [content, setContent] = useState<DividerContent>(() => {
    return (value.content as DividerContent) || DEFAULT_CONTENT;
  });
  const [styles, setStyles] = useState<React.CSSProperties | undefined>(
    () => value.styles
  );

  // Sync with props only when block ID changes
  const lastSyncedBlockIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (lastSyncedBlockIdRef.current !== value.id) {
      lastSyncedBlockIdRef.current = value.id;
      const newContent = (value.content as DividerContent) || DEFAULT_CONTENT;
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

  return <DividerRenderer content={content} styles={styles} />;
}

// ============================================================================
// SETTINGS COMPONENT
// ============================================================================

interface DividerSettingsProps {
  block: BlockConfig;
  onUpdate?: (updates: Partial<BlockConfig>) => void;
}

function DividerSettings({ block, onUpdate }: DividerSettingsProps) {
  const accessor = getBlockStateAccessor(block.id);
  const [, setUpdateTrigger] = React.useState(0);

  // Get current state
  const content = accessor
    ? (accessor.getContent() as DividerContent)
    : (block.content as DividerContent) || DEFAULT_CONTENT;

  // Update handlers
  const updateContent = (updates: Partial<DividerContent>) => {
    if (accessor) {
      const current = accessor.getContent() as DividerContent;
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
      <CollapsibleCard title="Content" icon={MinusIcon} defaultOpen={true}>
        <div className="space-y-4">
          <div>
            <Label htmlFor="divider-style" className="text-sm font-medium text-gray-700">Line Style</Label>
            <Select
              value={content?.style || 'solid'}
              onValueChange={(value) => updateContent({ style: value })}
            >
              <SelectTrigger id="divider-style" className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="solid">Solid</SelectItem>
                <SelectItem value="dashed">Dashed</SelectItem>
                <SelectItem value="dotted">Dotted</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="divider-color" className="text-sm font-medium text-gray-700">Color</Label>
            <div className="flex gap-3 mt-1">
              <Input
                id="divider-color"
                type="color"
                value={content?.color || '#cccccc'}
                onChange={(e) => updateContent({ color: e.target.value })}
                className="w-12 h-9 p-1 border-gray-200"
              />
              <Input
                value={content?.color || '#cccccc'}
                onChange={(e) => updateContent({ color: e.target.value })}
                placeholder="#cccccc"
                className="flex-1 h-9 text-sm"
              />
            </div>
          </div>
        </div>
      </CollapsibleCard>

      {/* Settings Card */}
      <CollapsibleCard title="Settings" icon={Settings} defaultOpen={true}>
        <div className="space-y-4">
          <div>
            <Label htmlFor="divider-width" className="text-sm font-medium text-gray-700">Width (%)</Label>
            <div className="flex items-center space-x-4 mt-1">
              <Slider
                aria-label="Divider width percentage"
                value={[content?.width || 100]}
                onValueChange={([value]) => updateContent({ width: value })}
                max={100}
                min={10}
                step={5}
                className="flex-1"
              />
              <Input
                id="divider-width"
                type="number"
                value={content?.width || 100}
                onChange={(e) => updateContent({ width: parseInt(e.target.value) || 100 })}
                className="w-20 h-9"
              />
            </div>
          </div>
        </div>
      </CollapsibleCard>
    </div>
  );
}

// ============================================================================
// LEGACY RENDERER (Backward Compatibility)
// ============================================================================

function LegacyDividerRenderer({
  block,
}: {
  block: BlockConfig;
  isPreview: boolean;
}) {
  return (
    <DividerRenderer
      content={(block.content as DividerContent) || DEFAULT_CONTENT}
      styles={block.styles}
    />
  );
}

// ============================================================================
// BLOCK DEFINITION
// ============================================================================

const DividerBlock: BlockDefinition = {
  id: 'divider',
  label: 'Divider',
  icon: MinusIcon,
  description: 'Add a horizontal line',
  category: 'layout',
  defaultContent: {
    style: 'solid',
    width: 100,
    color: '#cccccc',
  },
  defaultStyles: {
    padding: '20px 0px',
  },
  component: DividerBlockComponent,
  renderer: LegacyDividerRenderer,
  settings: DividerSettings,
  hasSettings: true,
};

export default DividerBlock;
