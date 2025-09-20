import React from "react";
import type { BlockConfig } from "@shared/schema";
import type { BlockDefinition } from "../types.ts";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ContainerChildren } from "../../BlockRenderer";
import { Package as GroupIcon } from "lucide-react";

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

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Container Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-12 gap-2 items-center">
            <div className="col-span-4">
              <Label htmlFor="group-tag">HTML Tag</Label>
            </div>
            <div className="col-span-8">
              <Select
                value={(block.content as any)?.tagName || 'div'}
                onValueChange={(value) => updateContent({ tagName: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="div">div</SelectItem>
                  <SelectItem value="section">section</SelectItem>
                  <SelectItem value="article">article</SelectItem>
                  <SelectItem value="main">main</SelectItem>
                  <SelectItem value="header">header</SelectItem>
                  <SelectItem value="footer">footer</SelectItem>
                  <SelectItem value="aside">aside</SelectItem>
                  <SelectItem value="nav">nav</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-2 items-center">
            <div className="col-span-4">
              <Label htmlFor="group-display">Display</Label>
            </div>
            <div className="col-span-8">
              <Select
                value={(block.content as any)?.display || 'block'}
                onValueChange={(value) => updateContent({ display: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="block">Block</SelectItem>
                  <SelectItem value="flex">Flex</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-2 items-center">
            <div className="col-span-4">
              <Label htmlFor="group-class">CSS Class</Label>
            </div>
            <div className="col-span-8">
              <Input
                id="group-class"
                value={block.content?.className || ''}
                onChange={(e) => updateContent({ className: e.target.value })}
                placeholder="e.g. has-background is-style-rounded"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {(block.content as any)?.display === 'flex' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Flex Layout</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-12 gap-2 items-center">
              <div className="col-span-4">
                <Label htmlFor="flex-direction">Direction</Label>
              </div>
              <div className="col-span-8">
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
            </div>

            <div className="grid grid-cols-12 gap-2 items-center">
              <div className="col-span-4">
                <Label htmlFor="align-items">Align Items</Label>
              </div>
              <div className="col-span-8">
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
            </div>

            <div className="grid grid-cols-12 gap-2 items-center">
              <div className="col-span-4">
                <Label htmlFor="justify-content">Justify Content</Label>
              </div>
              <div className="col-span-8">
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
            </div>

            <div className="grid grid-cols-12 gap-2 items-center">
              <div className="col-span-4">
                <Label htmlFor="flex-gap">Gap</Label>
              </div>
              <div className="col-span-8">
                <Input
                  id="flex-gap"
                  value={(block.content as any)?.gap || '0px'}
                  onChange={(e) => updateContent({ gap: e.target.value })}
                  placeholder="e.g. 10px, 1rem"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Styling</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-12 gap-2 items-center">
            <div className="col-span-4">
              <Label htmlFor="group-background">Background</Label>
            </div>
            <div className="col-span-8">
              <Input
                id="group-background"
                type="color"
                value={block.styles?.backgroundColor || "#ffffff"}
                onChange={(e) => updateStyles({ backgroundColor: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-12 gap-2 items-center">
            <div className="col-span-4">
              <Label htmlFor="group-padding">Padding</Label>
            </div>
            <div className="col-span-8">
              <Input
                id="group-padding"
                value={block.styles?.padding || "1.25em 2.375em"}
                onChange={(e) => updateStyles({ padding: e.target.value })}
                placeholder="e.g. 20px, 1em 2em"
              />
            </div>
          </div>
        </CardContent>
      </Card>
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
};

export default GroupBlock;