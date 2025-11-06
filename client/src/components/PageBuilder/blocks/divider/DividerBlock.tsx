import React from "react";
import type { BlockConfig } from "@shared/schema-types";
import type { BlockDefinition } from "../types.ts";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { CollapsibleCard } from "@/components/ui/collapsible-card";
import { Minus as MinusIcon, Settings } from "lucide-react";

function DividerRenderer({ block }: { block: BlockConfig; isPreview: boolean }) {
  return (
    <div style={{ padding: block.styles?.padding, margin: block.styles?.margin }}>
      <hr
        style={{
          borderStyle: block.content?.style,
          borderWidth: '1px 0 0 0',
          borderColor: block.content?.color,
          width: `${block.content?.width}%`,
          margin: '0 auto',
        }}
      />
    </div>
  );
}

function DividerSettings({ block, onUpdate }: { block: BlockConfig; onUpdate: (updates: Partial<BlockConfig>) => void }) {
  

  const updateContent = (contentUpdates: any) => {
    onUpdate({
      content: {
        ...block.content,
        ...contentUpdates,
      },
    });
  };

  return (
    <div className="space-y-4">
      {/* Content Card */}
      <CollapsibleCard title="Content" icon={MinusIcon} defaultOpen={true}>
        <div className="space-y-4">
          <div>
            <Label htmlFor="divider-style" className="text-sm font-medium text-gray-700">Line Style</Label>
            <Select
              value={block.content?.style || 'solid'}
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
                value={block.content?.color || '#cccccc'}
                onChange={(e) => updateContent({ color: e.target.value })}
                className="w-12 h-9 p-1 border-gray-200"
              />
              <Input
                value={block.content?.color || '#cccccc'}
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
                value={[block.content?.width || 100]}
                onValueChange={([value]) => updateContent({ width: value })}
                max={100}
                min={10}
                step={5}
                className="flex-1"
              />
              <Input
                id="divider-width"
                type="number"
                value={block.content?.width || 100}
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

const DividerBlock: BlockDefinition = {
  id: 'divider',
  name: 'Divider',
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
  renderer: DividerRenderer,
  settings: DividerSettings,
  hasSettings: true,
};

export default DividerBlock;

