import React from "react";
import type { BlockConfig, BlockContent } from "@shared/schema-types";
import type { BlockDefinition, BlockComponentProps } from "../types.ts";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CollapsibleCard } from "@/components/ui/collapsible-card";
import { ContainerChildren } from "../../BlockRenderer";
import { Package as GroupIcon, Settings, Layout, Palette, Wrench } from "lucide-react";
import { getBlockStateAccessor } from "../blockStateRegistry";
import { useBlockState } from "../useBlockState";

// ============================================================================
// TYPES
// ============================================================================

type GroupContent = {
  tagName?: string;
  className?: string;
  display?: 'block' | 'flex';
  flexDirection?: 'row' | 'column';
  alignItems?: 'flex-start' | 'center' | 'flex-end' | 'stretch';
  justifyContent?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around';
  gap?: string;
};

const DEFAULT_CONTENT: GroupContent = {
  tagName: 'div',
  className: '',
  display: 'block',
  flexDirection: 'column',
  alignItems: 'flex-start',
  justifyContent: 'flex-start',
  gap: '0px',
};

// ============================================================================
// RENDERER
// ============================================================================

interface GroupRendererProps {
  content: GroupContent;
  styles?: React.CSSProperties;
  children?: BlockConfig[];
  isPreview?: boolean;
}

function GroupRenderer({ content, styles, children, isPreview }: GroupRendererProps) {
  const tagName = content?.tagName || 'div';
  const className = [
    'wp-block-group',
    content?.className || '',
  ].filter(Boolean).join(' ');
  const TagName = tagName as keyof JSX.IntrinsicElements;

  const display = content?.display || 'block';
  const flexDirection = content?.flexDirection || 'column';
  const alignItems = content?.alignItems || 'flex-start';
  const justifyContent = content?.justifyContent || 'flex-start';
  const gap = content?.gap || '0px';

  const containerStyle = {
    ...styles,
    padding: styles?.padding || '1.25em 2.375em',
    ...(display === 'flex' && {
      display: 'flex',
      flexDirection,
      alignItems,
      justifyContent,
      gap,
    })
  };

  // Create a block config for ContainerChildren
  const blockForChildren: BlockConfig = {
    id: '',
    name: '',
    type: 'container',
    parentId: null,
    content: content as any,
    styles,
    children: children || [],
  };

  return (
    <TagName
      className={className}
      style={containerStyle}
    >
      <div className="wp-block-group__inner-container">
        <ContainerChildren block={blockForChildren} isPreview={isPreview} />
      </div>
    </TagName>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function GroupBlockComponent({
  value,
  onChange,
  isPreview,
}: BlockComponentProps) {
  const { content, styles } = useBlockState<GroupContent>({
    value,
    getDefaultContent: () => DEFAULT_CONTENT,
    onChange,
  });

  return (
    <GroupRenderer
      content={content}
      styles={styles}
      children={value.children}
      isPreview={isPreview}
    />
  );
}

// ============================================================================
// SETTINGS COMPONENT
// ============================================================================

interface GroupSettingsProps {
  block: BlockConfig;
  onUpdate?: (updates: Partial<BlockConfig>) => void;
}

function GroupSettings({ block, onUpdate }: GroupSettingsProps) {
  const accessor = getBlockStateAccessor(block.id);
  const [, setUpdateTrigger] = React.useState(0);

  // Get current state
  const content = accessor
    ? (accessor.getContent() as GroupContent)
    : (block.content as GroupContent) || DEFAULT_CONTENT;
  const styles = accessor
    ? accessor.getStyles()
    : block.styles;

  // Update handlers
  const updateContent = (updates: Partial<GroupContent>) => {
    if (accessor) {
      const current = accessor.getContent() as GroupContent;
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

  const updateStyles = (styleUpdates: Partial<React.CSSProperties>) => {
    if (accessor) {
      const current = accessor.getStyles() || {};
      accessor.setStyles({ ...current, ...styleUpdates });
      setUpdateTrigger((prev) => prev + 1);
    } else if (onUpdate) {
      onUpdate({
        styles: {
          ...block.styles,
          ...styleUpdates,
        },
      });
    }
  };

  const displayOptions = [
    { value: 'block', label: 'Block' },
    { value: 'flex', label: 'Flex' }
  ];

  const htmlTagOptions = [
    { value: 'div', label: 'div' },
    { value: 'section', label: 'section' },
    { value: 'article', label: 'article' },
    { value: 'main', label: 'main' },
    { value: 'header', label: 'header' },
    { value: 'footer', label: 'footer' },
    { value: 'aside', label: 'aside' },
    { value: 'nav', label: 'nav' }
  ];

  const currentDisplay = content?.display || 'block';
  const currentTag = content?.tagName || 'div';

  return (
    <div className="space-y-4">
      <CollapsibleCard
        title="Settings"
        icon={Settings}
        defaultOpen={true}
      >
        <div className="space-y-4">
          {/* HTML Tag */}
          <div>
            <Label>HTML Tag</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {htmlTagOptions.slice(0, 4).map((option) => (
                <button
                  key={option.value}
                  onClick={() => updateContent({ tagName: option.value })}
                  className={`flex items-center justify-center p-3 text-sm font-medium rounded-lg border transition-colors ${
                    currentTag === option.value
                      ? 'bg-gray-200 text-gray-800 border-gray-200 hover:bg-gray-300'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {htmlTagOptions.slice(4).map((option) => (
                <button
                  key={option.value}
                  onClick={() => updateContent({ tagName: option.value })}
                  className={`flex items-center justify-center p-3 text-sm font-medium rounded-lg border transition-colors ${
                    currentTag === option.value
                      ? 'bg-gray-200 text-gray-800 border-gray-200 hover:bg-gray-300'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Display Type */}
          <div>
            <Label>Display Type</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {displayOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => updateContent({ display: option.value as any })}
                  className={`flex items-center justify-center p-3 text-sm font-medium rounded-lg border transition-colors ${
                    currentDisplay === option.value
                      ? 'bg-gray-200 text-gray-800 border-gray-200 hover:bg-gray-300'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </CollapsibleCard>

      {currentDisplay === 'flex' && (
        <CollapsibleCard
          title="Flex Layout"
          icon={Layout}
          defaultOpen={true}
        >
          <div className="space-y-4">
            {/* Flex Direction */}
            <div>
              <Label htmlFor="flex-direction">Direction</Label>
              <Select
                value={content?.flexDirection || 'column'}
                onValueChange={(value) => updateContent({ flexDirection: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="row">Horizontal (Row)</SelectItem>
                  <SelectItem value="column">Vertical (Column)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Align Items */}
            <div>
              <Label htmlFor="align-items">Align Items</Label>
              <Select
                value={content?.alignItems || 'flex-start'}
                onValueChange={(value) => updateContent({ alignItems: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="flex-start">Start</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="flex-end">End</SelectItem>
                  <SelectItem value="stretch">Stretch</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Justify Content */}
            <div>
              <Label htmlFor="justify-content">Justify Content</Label>
              <Select
                value={content?.justifyContent || 'flex-start'}
                onValueChange={(value) => updateContent({ justifyContent: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="flex-start">Start</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="flex-end">End</SelectItem>
                  <SelectItem value="space-between">Space Between</SelectItem>
                  <SelectItem value="space-around">Space Around</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Gap */}
            <div>
              <Label htmlFor="flex-gap">Gap</Label>
              <Input
                id="flex-gap"
                value={content?.gap || '0px'}
                onChange={(e) => updateContent({ gap: e.target.value })}
                placeholder="e.g. 10px, 1rem"
              />
            </div>
          </div>
        </CollapsibleCard>
      )}

      <CollapsibleCard
        title="Styling"
        icon={Palette}
        defaultOpen={false}
      >
        <div className="space-y-4">
          {/* Background Color */}
          <div>
            <Label htmlFor="group-background">Background Color</Label>
            <Input
              id="group-background"
              type="color"
              value={styles?.backgroundColor || "#ffffff"}
              onChange={(e) => updateStyles({ backgroundColor: e.target.value })}
            />
          </div>

          {/* Padding */}
          <div>
            <Label htmlFor="group-padding">Padding</Label>
            <Input
              id="group-padding"
              value={styles?.padding || "1.25em 2.375em"}
              onChange={(e) => updateStyles({ padding: e.target.value })}
              placeholder="e.g. 20px, 1em 2em"
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
          {/* CSS Class */}
          <div>
            <Label htmlFor="group-class">Additional CSS Class(es)</Label>
            <Input
              id="group-class"
              value={content?.className || ''}
              onChange={(e) => updateContent({ className: e.target.value })}
              placeholder="e.g. has-background is-style-rounded"
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

function LegacyGroupRenderer({
  block,
  isPreview,
}: {
  block: BlockConfig;
  isPreview: boolean;
}) {
  return (
    <GroupRenderer
      content={(block.content as GroupContent) || DEFAULT_CONTENT}
      styles={block.styles}
      children={block.children}
      isPreview={isPreview}
    />
  );
}

// ============================================================================
// BLOCK DEFINITION
// ============================================================================

const GroupBlock: BlockDefinition = {
  id: 'core/group',
  label: 'Group',
  icon: GroupIcon,
  description: 'Gather blocks in a layout container',
  category: 'layout',
  isContainer: true,
  handlesOwnChildren: true,
  defaultContent: {
    tagName: 'div',
    className: '',
    display: 'block',
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    gap: '0px',
  },
  defaultStyles: {
    padding: '1.25em 2.375em',
  },
  component: GroupBlockComponent,
  renderer: LegacyGroupRenderer,
  settings: GroupSettings,
  hasSettings: true,
};

export default GroupBlock;
