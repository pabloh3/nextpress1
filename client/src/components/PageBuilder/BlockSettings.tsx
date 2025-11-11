import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CollapsibleCard } from "@/components/ui/collapsible-card";

import { 
  Palette, 
  Type, 
  Layout, 
  Code, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  AlignJustify,
  Bold,
  Italic,
  ExternalLink,
  Target,
  ChevronDown,
  ChevronRight,
  Ruler,
  Square,
  Circle,
  Hash,
  Move,
  RotateCw,
  Columns,
  Rows,
  Grid3X3,
  Minus,
  Settings
} from "lucide-react";
import type { BlockConfig } from "@shared/schema-types";
import { blockRegistry } from "./blocks";

interface BlockSettingsProps {
  block: BlockConfig;
  onUpdate: (updates: Partial<BlockConfig>) => void;
  onHoverArea?: (area: 'padding' | 'margin' | null) => void;
}

export default function BlockSettings({ block, onUpdate, onHoverArea }: BlockSettingsProps) {
  const [customCss, setCustomCss] = useState(block.customCss || '');

  const updateContent = (contentUpdates: any) => {
    onUpdate({
      content: {
        ...block.content,
        ...contentUpdates,
      },
    });
  };

  const updateStyles = (styleUpdates: any) => {
    onUpdate({
      styles: {
        ...block.styles,
        ...styleUpdates,
      },
    });
  };

  const updateSettings = (settingUpdates: any) => {
    onUpdate({
      settings: {
        ...block.settings,
        ...settingUpdates,
      },
    });
  };

  const handleCustomCssChange = (css: string) => {
    setCustomCss(css);
    onUpdate({ customCss: css });
  };

  // Utility functions for parsing and formatting values
  const parseSpacingValue = (value: string | undefined): { number: string; unit: string } => {
    if (!value) return { number: '0', unit: 'px' };
    const match = value.match(/^(\d*\.?\d+)(px|rem|em|%|)$/);
    if (match) {
      return { number: match[1], unit: match[2] || 'px' };
    }
    return { number: '0', unit: 'px' };
  };

  const formatSpacingValue = (number: string, unit: string): string => {
    return number ? `${number}${unit}` : '0';
  };

  // Get individual spacing values with fallbacks
  const getPaddingValues = () => {
    const padding = block.styles?.padding;
    if (padding) {
      const values = padding.split(' ').map((v: string) => v.trim());
      if (values.length === 1) return { top: values[0], right: values[0], bottom: values[0], left: values[0] };
      if (values.length === 2) return { top: values[0], right: values[1], bottom: values[0], left: values[1] };
      if (values.length === 4) return { top: values[0], right: values[1], bottom: values[2], left: values[3] };
    }
    return {
      top: block.styles?.paddingTop || '0px',
      right: block.styles?.paddingRight || '0px',
      bottom: block.styles?.paddingBottom || '0px',
      left: block.styles?.paddingLeft || '0px',
    };
  };

  const getMarginValues = () => {
    const margin = block.styles?.margin;
    if (margin) {
      const values = margin.split(' ').map((v: string) => v.trim());
      if (values.length === 1) return { top: values[0], right: values[0], bottom: values[0], left: values[0] };
      if (values.length === 2) return { top: values[0], right: values[1], bottom: values[0], left: values[1] };
      if (values.length === 4) return { top: values[0], right: values[1], bottom: values[2], left: values[3] };
    }
    return {
      top: block.styles?.marginTop || '0px',
      right: block.styles?.marginRight || '0px',
      bottom: block.styles?.marginBottom || '0px',
      left: block.styles?.marginLeft || '0px',
    };
  };

  const renderContentSettings = () => {
    const def = blockRegistry[block.name];
    if (def?.settings) {
      const SettingsComp = def.settings;
      return <SettingsComp block={block} onUpdate={onUpdate} />;
    }
    return (
      <div className="text-center text-gray-500 py-8">
        No content settings available for this block type.
      </div>
    );
  };



  // Enhanced chip-based control component with grid layout and truncation
  const ChipGroup = ({ 
    label, 
    options, 
    value, 
    onChange, 
    icon: Icon,
    className = ""
  }: { 
    label: string; 
    options: { value: string; label: string; icon?: any }[]; 
    value: string; 
    onChange: (value: string) => void; 
    icon?: any;
    className?: string;
  }) => {
    // Determine grid layout based on number of options - use 2x2 grid for 3+ options
    const getGridLayout = () => {
      if (options.length === 1) return "grid-cols-1";
      if (options.length === 2) return "grid-cols-2";
      // For 3+ options, use 2x2 grid (2 columns, rows as needed)
      return "grid-cols-2";
    };

    const truncateText = (text: string, maxLength: number = 8) => {
      return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    };

    return (
      <div className={`space-y-3 ${className}`}>
        {label && (
          <Label className="text-sm font-semibold text-gray-800 flex items-center gap-2">
            {Icon && <Icon className="w-4 h-4" />}
            {label}
          </Label>
        )}
        <div className={`grid ${getGridLayout()} gap-2`}>
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => onChange(option.value)}
              className={`h-10 px-2 text-xs font-medium border rounded-none transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:ring-offset-1 min-w-0 ${
                value === option.value 
                  ? "bg-gray-200 text-gray-800 border-gray-200 hover:bg-gray-300" 
                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
              }`}
              title={option.label} // Tooltip for truncated text
            >
              <div className="flex items-center justify-center gap-1 min-w-0">
                {option.icon && <option.icon className="w-3 h-3 flex-shrink-0" />}
                <span className="truncate min-w-0">{truncateText(option.label)}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderStyleSettings = () => {
    return (
      <div className="space-y-6">
        {/* Typography */}
        {["heading", "core/heading", "text", "core/paragraph", "button", "core/button"].includes(block.name) && (
          <CollapsibleCard title="Typography" icon={Type} defaultOpen={true}>
            {/* Font Size - Full Width */}
            <div>
              <Label className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                <Ruler className="w-3 h-3" />
                Font Size
              </Label>
              <Input
                value={block.styles?.fontSize || '16px'}
                onChange={(e) => updateStyles({ fontSize: e.target.value })}
                placeholder="16px"
                className="mt-2 h-9 text-sm border-gray-200 rounded-none focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400"
              />
            </div>
            
            {/* Line Height - Full Width */}
            <div>
              <Label className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                <Rows className="w-3 h-3" />
                Line Height
              </Label>
              <Input
                value={block.styles?.lineHeight || '1.6'}
                onChange={(e) => updateStyles({ lineHeight: e.target.value })}
                placeholder="1.6"
                className="mt-2 h-9 text-sm border-gray-200 rounded-none focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400"
              />
            </div>
            
            {/* Font Weight - Chip Grid */}
            <ChipGroup
              label="Font Weight"
              icon={Bold}
              options={[
                { value: '300', label: 'Light', icon: Minus },
                { value: 'normal', label: 'Normal', icon: Circle },
                { value: '500', label: 'Medium', icon: Square },
                { value: 'bold', label: 'Bold', icon: Bold },
              ]}
              value={block.styles?.fontWeight || 'normal'}
              onChange={(value) => updateStyles({ fontWeight: value })}
            />

            {/* Text Alignment - Chip Grid */}
            <ChipGroup
              label="Text Alignment"
              icon={AlignCenter}
              options={[
                { value: 'left', label: 'Left', icon: AlignLeft },
                { value: 'center', label: 'Center', icon: AlignCenter },
                { value: 'right', label: 'Right', icon: AlignRight },
                { value: 'justify', label: 'Justify', icon: AlignJustify },
              ]}
              value={block.styles?.textAlign || 'left'}
              onChange={(value) => updateStyles({ textAlign: value })}
            />
          </CollapsibleCard>
        )}

        {/* Colors */}
        <CollapsibleCard title="Colors" icon={Palette} defaultOpen={true}>
          {/* Text Color */}
          <div>
            <Label className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <Type className="w-3 h-3" />
              Text Color
            </Label>
            <div className="flex gap-3 mt-2">
              <Input
                type="color"
                value={block.styles?.color || '#000000'}
                onChange={(e) => updateStyles({ color: e.target.value })}
                className="w-12 h-9 p-1 border-gray-200 rounded-none focus:outline-none focus:ring-2 focus:ring-gray-400"
              />
              <Input
                value={block.styles?.color || '#000000'}
                onChange={(e) => updateStyles({ color: e.target.value })}
                placeholder="#000000"
                className="flex-1 h-9 text-sm border-gray-200 rounded-none focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400"
              />
            </div>
          </div>
          
          {/* Background Color */}
          <div>
            <Label className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <Square className="w-3 h-3" />
              Background Color
            </Label>
            <div className="flex gap-3 mt-2">
              <Input
                type="color"
                value={block.styles?.backgroundColor || '#ffffff'}
                onChange={(e) => updateStyles({ backgroundColor: e.target.value })}
                className="w-12 h-9 p-1 border-gray-200 rounded-none focus:outline-none focus:ring-2 focus:ring-gray-400"
              />
              <Input
                value={block.styles?.backgroundColor || '#ffffff'}
                onChange={(e) => updateStyles({ backgroundColor: e.target.value })}
                placeholder="#ffffff"
                className="flex-1 h-9 text-sm border-gray-200 rounded-none focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400"
              />
            </div>
          </div>
        </CollapsibleCard>

        {/* Spacing */}
        <CollapsibleCard title="Spacing" icon={Move} defaultOpen={true}>
            {/* Padding - 4-Input Grid */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                  <Square className="w-3 h-3" />
                  Padding
                </Label>
                <div className="flex items-center gap-2">
                  <select 
                    className="h-7 px-2 text-xs border border-gray-200 rounded-none bg-white focus:outline-none focus:ring-1 focus:ring-gray-400"
                    value={parseSpacingValue(getPaddingValues().top).unit}
                    onChange={(e) => {
                      const currentValues = getPaddingValues();
                      const newUnit = e.target.value;
                      updateStyles({
                        paddingTop: formatSpacingValue(parseSpacingValue(currentValues.top).number, newUnit),
                        paddingRight: formatSpacingValue(parseSpacingValue(currentValues.right).number, newUnit),
                        paddingBottom: formatSpacingValue(parseSpacingValue(currentValues.bottom).number, newUnit),
                        paddingLeft: formatSpacingValue(parseSpacingValue(currentValues.left).number, newUnit),
                      });
                    }}
                  >
                    <option value="px">px</option>
                    <option value="rem">rem</option>
                    <option value="em">em</option>
                    <option value="%">%</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Input
                    value={parseSpacingValue(getPaddingValues().top).number}
                    onChange={(e) => {
                      const unit = parseSpacingValue(getPaddingValues().top).unit;
                      updateStyles({ paddingTop: formatSpacingValue(e.target.value, unit) });
                    }}
                    placeholder="0"
                    className="h-8 text-xs border-gray-200 rounded-none focus:outline-none focus:ring-1 focus:ring-gray-400 text-center"
                    onMouseEnter={() => onHoverArea?.('padding')}
                    onMouseLeave={() => onHoverArea?.(null)}
                  />
                  <div className="text-xs text-gray-500 text-center mt-1">Top</div>
                </div>
                <div>
                  <Input
                    value={parseSpacingValue(getPaddingValues().right).number}
                    onChange={(e) => {
                      const unit = parseSpacingValue(getPaddingValues().right).unit;
                      updateStyles({ paddingRight: formatSpacingValue(e.target.value, unit) });
                    }}
                    placeholder="0"
                    className="h-8 text-xs border-gray-200 rounded-none focus:outline-none focus:ring-1 focus:ring-gray-400 text-center"
                    onMouseEnter={() => onHoverArea?.('padding')}
                    onMouseLeave={() => onHoverArea?.(null)}
                  />
                  <div className="text-xs text-gray-500 text-center mt-1">Right</div>
                </div>
                <div>
                  <Input
                    value={parseSpacingValue(getPaddingValues().bottom).number}
                    onChange={(e) => {
                      const unit = parseSpacingValue(getPaddingValues().bottom).unit;
                      updateStyles({ paddingBottom: formatSpacingValue(e.target.value, unit) });
                    }}
                    placeholder="0"
                    className="h-8 text-xs border-gray-200 rounded-none focus:outline-none focus:ring-1 focus:ring-gray-400 text-center"
                    onMouseEnter={() => onHoverArea?.('padding')}
                    onMouseLeave={() => onHoverArea?.(null)}
                  />
                  <div className="text-xs text-gray-500 text-center mt-1">Bottom</div>
                </div>
                <div>
                  <Input
                    value={parseSpacingValue(getPaddingValues().left).number}
                    onChange={(e) => {
                      const unit = parseSpacingValue(getPaddingValues().left).unit;
                      updateStyles({ paddingLeft: formatSpacingValue(e.target.value, unit) });
                    }}
                    placeholder="0"
                    className="h-8 text-xs border-gray-200 rounded-none focus:outline-none focus:ring-1 focus:ring-gray-400 text-center"
                    onMouseEnter={() => onHoverArea?.('padding')}
                    onMouseLeave={() => onHoverArea?.(null)}
                  />
                  <div className="text-xs text-gray-500 text-center mt-1">Left</div>
                </div>
              </div>
            </div>
            
            {/* Margin - 4-Input Grid */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                  <Circle className="w-3 h-3" />
                  Margin
                </Label>
                <div className="flex items-center gap-2">
                  <select 
                    className="h-7 px-2 text-xs border border-gray-200 rounded-none bg-white focus:outline-none focus:ring-1 focus:ring-gray-400"
                    value={parseSpacingValue(getMarginValues().top).unit}
                    onChange={(e) => {
                      const currentValues = getMarginValues();
                      const newUnit = e.target.value;
                      updateStyles({
                        marginTop: formatSpacingValue(parseSpacingValue(currentValues.top).number, newUnit),
                        marginRight: formatSpacingValue(parseSpacingValue(currentValues.right).number, newUnit),
                        marginBottom: formatSpacingValue(parseSpacingValue(currentValues.bottom).number, newUnit),
                        marginLeft: formatSpacingValue(parseSpacingValue(currentValues.left).number, newUnit),
                      });
                    }}
                  >
                    <option value="px">px</option>
                    <option value="rem">rem</option>
                    <option value="em">em</option>
                    <option value="%">%</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Input
                    value={parseSpacingValue(getMarginValues().top).number}
                    onChange={(e) => {
                      const unit = parseSpacingValue(getMarginValues().top).unit;
                      updateStyles({ marginTop: formatSpacingValue(e.target.value, unit) });
                    }}
                    placeholder="0"
                    className="h-8 text-xs border-gray-200 rounded-none focus:outline-none focus:ring-1 focus:ring-gray-400 text-center"
                    onMouseEnter={() => onHoverArea?.('margin')}
                    onMouseLeave={() => onHoverArea?.(null)}
                  />
                  <div className="text-xs text-gray-500 text-center mt-1">Top</div>
                </div>
                <div>
                  <Input
                    value={parseSpacingValue(getMarginValues().right).number}
                    onChange={(e) => {
                      const unit = parseSpacingValue(getMarginValues().right).unit;
                      updateStyles({ marginRight: formatSpacingValue(e.target.value, unit) });
                    }}
                    placeholder="0"
                    className="h-8 text-xs border-gray-200 rounded-none focus:outline-none focus:ring-1 focus:ring-gray-400 text-center"
                    onMouseEnter={() => onHoverArea?.('margin')}
                    onMouseLeave={() => onHoverArea?.(null)}
                  />
                  <div className="text-xs text-gray-500 text-center mt-1">Right</div>
                </div>
                <div>
                  <Input
                    value={parseSpacingValue(getMarginValues().bottom).number}
                    onChange={(e) => {
                      const unit = parseSpacingValue(getMarginValues().bottom).unit;
                      updateStyles({ marginBottom: formatSpacingValue(e.target.value, unit) });
                    }}
                    placeholder="0"
                    className="h-8 text-xs border-gray-200 rounded-none focus:outline-none focus:ring-1 focus:ring-gray-400 text-center"
                    onMouseEnter={() => onHoverArea?.('margin')}
                    onMouseLeave={() => onHoverArea?.(null)}
                  />
                  <div className="text-xs text-gray-500 text-center mt-1">Bottom</div>
                </div>
                <div>
                  <Input
                    value={parseSpacingValue(getMarginValues().left).number}
                    onChange={(e) => {
                      const unit = parseSpacingValue(getMarginValues().left).unit;
                      updateStyles({ marginLeft: formatSpacingValue(e.target.value, unit) });
                    }}
                    placeholder="0"
                    className="h-8 text-xs border-gray-200 rounded-none focus:outline-none focus:ring-1 focus:ring-gray-400 text-center"
                    onMouseEnter={() => onHoverArea?.('margin')}
                    onMouseLeave={() => onHoverArea?.(null)}
                  />
                  <div className="text-xs text-gray-500 text-center mt-1">Left</div>
                </div>
              </div>
            </div>
        </CollapsibleCard>

        {/* Layout & Dimensions */}
        <CollapsibleCard title="Layout & Dimensions" icon={Layout} defaultOpen={false}>
            {/* Width */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                  <Columns className="w-3 h-3" />
                  Width
                </Label>
                <select className="h-7 px-2 text-xs border border-gray-200 rounded-none bg-white focus:outline-none focus:ring-1 focus:ring-gray-400">
                  <option>Auto</option>
                  <option>Fill</option>
                  <option>Fit</option>
                  <option>Custom</option>
                </select>
              </div>
              <Input
                value={block.styles?.width || '100%'}
                onChange={(e) => updateStyles({ width: e.target.value })}
                placeholder="100%"
                className="h-8 text-sm border-gray-200 rounded-none focus:outline-none focus:ring-1 focus:ring-gray-400"
              />
            </div>
            
            {/* Display Type for Container Blocks */}
            {['container', 'columns', 'core/group'].includes(block.name) && (
              <>
                  <div>
                    <Label className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <Grid3X3 className="w-3 h-3" />
                      Display
                    </Label>
                  <ChipGroup
                    label=""
                    options={[
                      { value: 'block', label: 'Block' },
                      { value: 'flex', label: 'Flex' },
                      { value: 'grid', label: 'Grid' },
                      { value: 'inline', label: 'Inline' },
                    ]}
                    value={block.styles?.display || 'block'}
                    onChange={(value) => updateStyles({ display: value })}
                  />
                </div>

                {/* Flex Direction (if display is flex) */}
                {block.styles?.display === 'flex' && (
                  <div>
                    <Label className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <RotateCw className="w-3 h-3" />
                      Direction
                    </Label>
                    <ChipGroup
                      label=""
                      options={[
                        { value: 'row', label: 'Row' },
                        { value: 'column', label: 'Column' },
                        { value: 'row-reverse', label: 'Row Rev' },
                        { value: 'column-reverse', label: 'Col Rev' },
                      ]}
                      value={block.styles?.flexDirection || 'row'}
                      onChange={(value) => updateStyles({ flexDirection: value })}
                    />
                  </div>
                )}

                {/* Justify Content */}
                <div>
                  <Label className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <AlignCenter className="w-3 h-3" />
                    Justify
                  </Label>
                  <ChipGroup
                    label=""
                    options={[
                      { value: 'flex-start', label: 'Start' },
                      { value: 'center', label: 'Center' },
                      { value: 'flex-end', label: 'End' },
                      { value: 'space-between', label: 'Between' },
                    ]}
                    value={block.styles?.justifyContent || 'flex-start'}
                    onChange={(value) => updateStyles({ justifyContent: value })}
                  />
                </div>

                {/* Align Items */}
                <div>
                  <Label className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <AlignLeft className="w-3 h-3" />
                    Align
                  </Label>
                  <ChipGroup
                    label=""
                    options={[
                      { value: 'flex-start', label: 'Start' },
                      { value: 'center', label: 'Center' },
                      { value: 'flex-end', label: 'End' },
                      { value: 'stretch', label: 'Stretch' },
                    ]}
                    value={block.styles?.alignItems || 'flex-start'}
                    onChange={(value) => updateStyles({ alignItems: value })}
                  />
                </div>
              </>
            )}

            {/* Height for specific blocks */}
            {['image', 'video', 'container', 'core/group'].includes(block.name) && (
              <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                      <Rows className="w-3 h-3" />
                      Height
                    </Label>
                  <select className="h-7 px-2 text-xs border border-gray-200 rounded-none bg-white focus:outline-none focus:ring-1 focus:ring-gray-400">
                    <option>Auto</option>
                    <option>Min Content</option>
                    <option>Max Content</option>
                    <option>Custom</option>
                  </select>
                </div>
                <Input
                  value={block.styles?.height || 'auto'}
                  onChange={(e) => updateStyles({ height: e.target.value })}
                  placeholder="auto"
                  className="h-8 text-sm border-gray-200 rounded-none focus:outline-none focus:ring-1 focus:ring-gray-400"
                />
              </div>
            )}
        </CollapsibleCard>

        {/* Border */}
        <CollapsibleCard title="Border & Radius" icon={Square} defaultOpen={false}>
          {/* Border - Full Width */}
          <div>
            <Label className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <Square className="w-3 h-3" />
              Border
            </Label>
            <Input
              value={block.styles?.border || 'none'}
              onChange={(e) => updateStyles({ border: e.target.value })}
              placeholder="1px solid #ccc"
              className="mt-2 h-9 text-sm border-gray-200 rounded-none focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400"
            />
          </div>
          
          {/* Border Radius - Full Width */}
          <div>
            <Label className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <Circle className="w-3 h-3" />
              Border Radius
            </Label>
            <Input
              value={block.styles?.borderRadius || '0px'}
              onChange={(e) => updateStyles({ borderRadius: e.target.value })}
              placeholder="4px"
              className="mt-2 h-9 text-sm border-gray-200 rounded-none focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400"
            />
          </div>
        </CollapsibleCard>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="p-4 bg-gray-50 rounded-none border border-gray-200">
        <h3 className="text-sm font-semibold text-gray-800 mb-1">Block Settings</h3>
        <p className="text-xs text-gray-600">{blockRegistry[block.name]?.label || block.name}</p>
      </div>

      <Tabs defaultValue="content" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-gray-100 p-1 rounded-lg">
          <TabsTrigger 
            value="content"
            className="flex items-center gap-2 text-gray-600 data-[state=active]:text-black data-[state=active]:bg-white data-[state=active]:shadow-sm font-medium px-3 py-2 rounded-md transition-all text-xs"
          >
            <Type className="w-3 h-3" /> Content
          </TabsTrigger>
          <TabsTrigger 
            value="style"
            className="flex items-center gap-2 text-gray-600 data-[state=active]:text-black data-[state=active]:bg-white data-[state=active]:shadow-sm font-medium px-3 py-2 rounded-md transition-all text-xs"
          >
            <Palette className="w-3 h-3" /> Style
          </TabsTrigger>
          <TabsTrigger 
            value="advanced"
            className="flex items-center gap-2 text-gray-600 data-[state=active]:text-black data-[state=active]:bg-white data-[state=active]:shadow-sm font-medium px-3 py-2 rounded-md transition-all text-xs"
          >
            <Code className="w-3 h-3" /> Advanced
          </TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="space-y-4 mt-4">
          <div className="bg-gray-50 rounded-none p-4 border border-gray-200">
            {renderContentSettings()}
          </div>
        </TabsContent>

        <TabsContent value="style" className="space-y-4 mt-4">
          <div className="bg-gray-50 rounded-none p-4 border border-gray-200">
            {renderStyleSettings()}
          </div>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4 mt-4">
          <div className="bg-gray-50 rounded-none p-4 border border-gray-200">
            <CollapsibleCard title="Custom CSS" icon={Code} defaultOpen={false}>
                <div className="space-y-3">
                  <Textarea
                    value={customCss}
                    onChange={(e) => handleCustomCssChange(e.target.value)}
                    placeholder="/* Add your custom CSS here */&#10;.my-block {&#10;  /* styles */&#10;}"
                    rows={8}
                    className="font-mono text-sm resize-none"
                  />
                  <p className="text-xs text-gray-500">
                    CSS will be applied to this block only. Use standard CSS syntax.
                  </p>
                </div>
            </CollapsibleCard>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}