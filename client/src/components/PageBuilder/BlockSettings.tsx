import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
 
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Palette, Type, Layout, Code } from "lucide-react";
import type { BlockConfig } from "@shared/schema";
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

  const renderContentSettings = () => {
    const def = blockRegistry[block.type];
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

  const renderStyleSettings = () => {
    return (
      <div className="space-y-6">
        {/* Typography */}
        {["heading", "core/heading", "text", "core/paragraph", "button", "core/button"].includes(block.type) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Type className="w-4 h-4" />
                Typography
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="font-size">Font Size</Label>
                <Input
                  id="font-size"
                  value={block.styles?.fontSize || '16px'}
                  onChange={(e) => updateStyles({ fontSize: e.target.value })}
                  placeholder="16px"
                />
              </div>
              <div>
                <Label htmlFor="font-weight">Font Weight</Label>
                <Select
                  value={block.styles?.fontWeight || 'normal'}
                  onValueChange={(value) => updateStyles({ fontWeight: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="bold">Bold</SelectItem>
                    <SelectItem value="lighter">Light</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                    <SelectItem value="200">200</SelectItem>
                    <SelectItem value="300">300</SelectItem>
                    <SelectItem value="400">400</SelectItem>
                    <SelectItem value="500">500</SelectItem>
                    <SelectItem value="600">600</SelectItem>
                    <SelectItem value="700">700</SelectItem>
                    <SelectItem value="800">800</SelectItem>
                    <SelectItem value="900">900</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="text-align">Text Align</Label>
                <Select
                  value={block.styles?.textAlign || 'left'}
                  onValueChange={(value) => updateStyles({ textAlign: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">Left</SelectItem>
                    <SelectItem value="center">Center</SelectItem>
                    <SelectItem value="right">Right</SelectItem>
                    <SelectItem value="justify">Justify</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="line-height">Line Height</Label>
                <Input
                  id="line-height"
                  value={block.styles?.lineHeight || '1.6'}
                  onChange={(e) => updateStyles({ lineHeight: e.target.value })}
                  placeholder="1.6"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Colors */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Colors
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="text-color">Text Color</Label>
              <Input
                id="text-color"
                type="color"
                value={block.styles?.color || '#000000'}
                onChange={(e) => updateStyles({ color: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="bg-color">Background Color</Label>
              <Input
                id="bg-color"
                type="color"
                value={block.styles?.backgroundColor || '#ffffff'}
                onChange={(e) => updateStyles({ backgroundColor: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Content Alignment */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Layout className="w-4 h-4" />
              Content Alignment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="align-horizontal">Horizontal</Label>
              <Select
                value={(block.styles as any)?.contentAlignHorizontal || 'left'}
                onValueChange={(value) => updateStyles({ contentAlignHorizontal: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="align-vertical">Vertical</Label>
              <Select
                value={(block.styles as any)?.contentAlignVertical || 'top'}
                onValueChange={(value) => updateStyles({ contentAlignVertical: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="top">Top</SelectItem>
                  <SelectItem value="middle">Middle</SelectItem>
                  <SelectItem value="bottom">Bottom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Spacing */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Layout className="w-4 h-4" />
              Spacing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="padding">Padding</Label>
              <Input
                id="padding"
                value={block.styles?.padding || '20px'}
                onChange={(e) => updateStyles({ padding: e.target.value })}
                placeholder="20px"
                onMouseEnter={() => onHoverArea?.('padding')}
                onMouseLeave={() => onHoverArea?.(null)}
              />
            </div>
            <div>
              <Label htmlFor="margin">Margin</Label>
              <Input
                id="margin"
                value={block.styles?.margin || '0px'}
                onChange={(e) => updateStyles({ margin: e.target.value })}
                placeholder="0px"
                onMouseEnter={() => onHoverArea?.('margin')}
                onMouseLeave={() => onHoverArea?.(null)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Dimensions */}
        {['image', 'video'].includes(block.type) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Dimensions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="width">Width</Label>
                <Input
                  id="width"
                  value={block.styles?.width || '100%'}
                  onChange={(e) => updateStyles({ width: e.target.value })}
                  placeholder="100%"
                />
              </div>
              <div>
                <Label htmlFor="height">Height</Label>
                <Input
                  id="height"
                  value={block.styles?.height || 'auto'}
                  onChange={(e) => updateStyles({ height: e.target.value })}
                  placeholder="auto"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Border */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Border</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="border">Border</Label>
              <Input
                id="border"
                value={block.styles?.border || 'none'}
                onChange={(e) => updateStyles({ border: e.target.value })}
                placeholder="1px solid #ccc"
              />
            </div>
            <div>
              <Label htmlFor="border-radius">Border Radius</Label>
              <Input
                id="border-radius"
                value={block.styles?.borderRadius || '0px'}
                onChange={(e) => updateStyles({ borderRadius: e.target.value })}
                placeholder="4px"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="text-sm font-medium text-gray-900 mb-4">
        Editing: {block.type} block
      </div>

      <Tabs defaultValue="content" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="style">Style</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="space-y-4">
          {renderContentSettings()}
        </TabsContent>

        <TabsContent value="style" className="space-y-4">
          {renderStyleSettings()}
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Code className="w-4 h-4" />
                Custom CSS
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="custom-css">Custom CSS</Label>
                <Textarea
                  id="custom-css"
                  value={customCss}
                  onChange={(e) => handleCustomCssChange(e.target.value)}
                  placeholder="/* Add your custom CSS here */&#10;.my-block {&#10;  /* styles */&#10;}"
                  rows={8}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-gray-500">
                  CSS will be applied to this block only. Use standard CSS syntax.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}