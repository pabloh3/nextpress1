import React from "react";
import type { BlockConfig } from "@shared/schema-types";
import type { BlockDefinition } from "../types.ts";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CollapsibleCard } from "@/components/ui/collapsible-card";
import { ContainerChildren } from "../../BlockRenderer";
import { Package as GroupIcon, Settings, Layout, Palette, Wrench } from "lucide-react";

export interface GroupBlockConfig extends BlockConfig {
  content: { 
    tagName: string; 
    className?: string;
    display?: 'block' | 'flex';
    flexDirection?: 'row' | 'column';
    alignItems?: 'flex-start' | 'center' | 'flex-end' | 'stretch';
    justifyContent?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around';
    gap?: string;
  };
  children?: BlockConfig[];
}

function GroupRenderer({ block, isPreview }: { block: BlockConfig; isPreview: boolean }) {
  const children = Array.isArray(block.children) ? block.children : [];
  const tagName = block.content?.tagName || 'div';
  const className = [
    'wp-block-group',
    block.content?.className || '',
  ].filter(Boolean).join(' ');
  const TagName = tagName as keyof JSX.IntrinsicElements;

  const display = block.content?.display || 'block';
  const flexDirection = block.content?.flexDirection || 'column';
  const alignItems = block.content?.alignItems || 'flex-start';
  const justifyContent = block.content?.justifyContent || 'flex-start';
  const gap = block.content?.gap || '0px';

  const containerStyle = {
    ...block.styles,
    padding: block.styles?.padding || '1.25em 2.375em',
    ...(display === 'flex' && {
      display: 'flex',
      flexDirection,
      alignItems,
      justifyContent,
      gap,
    })
  };

  return (
    <TagName
      className={className}
      style={containerStyle}
    >
      <div className="wp-block-group__inner-container">
        <ContainerChildren block={block} isPreview={isPreview} />
      </div>
    </TagName>
  );
}

function GroupSettings({ block, onUpdate }: { block: BlockConfig; onUpdate: (updates: Partial<BlockConfig>) => void }) {
  
  
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

  const currentDisplay = (block.content as any)?.display || 'block';
  const currentTag = (block.content as any)?.tagName || 'div';

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
                  onClick={() => updateContent({ display: option.value })}
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
                value={(block.content as any)?.flexDirection || 'column'}
                onValueChange={(value) => updateContent({ flexDirection: value })}
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
                value={(block.content as any)?.alignItems || 'flex-start'}
                onValueChange={(value) => updateContent({ alignItems: value })}
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
                value={(block.content as any)?.justifyContent || 'flex-start'}
                onValueChange={(value) => updateContent({ justifyContent: value })}
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
                value={(block.content as any)?.gap || '0px'}
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
              value={block.styles?.backgroundColor || "#ffffff"}
              onChange={(e) => updateStyles({ backgroundColor: e.target.value })}
            />
          </div>

          {/* Padding */}
          <div>
            <Label htmlFor="group-padding">Padding</Label>
            <Input
              id="group-padding"
              value={block.styles?.padding || "1.25em 2.375em"}
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
              value={block.content?.className || ''}
              onChange={(e) => updateContent({ className: e.target.value })}
              placeholder="e.g. has-background is-style-rounded"
            />
          </div>
        </div>
      </CollapsibleCard>
    </div>
  );
}

const GroupBlock: BlockDefinition = {
  id: 'core/group',
  name: 'Group',
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
  renderer: GroupRenderer,
  settings: GroupSettings,
  hasSettings: true,
};

export default GroupBlock;