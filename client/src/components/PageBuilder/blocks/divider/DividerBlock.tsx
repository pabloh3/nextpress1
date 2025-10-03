import React from "react";
import type { BlockConfig } from "@shared/schema";
import type { BlockDefinition } from "../types.ts";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Minus as MinusIcon } from "lucide-react";
import { useBlockManager } from "@/hooks/useBlockManager";

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

function DividerSettings({ block }: { block: BlockConfig }) {
  const { updateBlockContent } = useBlockManager();

  const updateContent = (contentUpdates: any) => {
    updateBlockContent(block.id, contentUpdates);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="divider-style">Line Style</Label>
        <Select
          value={block.content?.style || 'solid'}
          onValueChange={(value) => updateContent({ style: value })}
        >
          <SelectTrigger>
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
        <Label htmlFor="divider-width">Width (%)</Label>
        <div className="flex items-center space-x-4">
          <Slider
            value={[block.content?.width || 100]}
            onValueChange={([value]) => updateContent({ width: value })}
            max={100}
            min={10}
            step={5}
            className="flex-1"
          />
          <Input
            type="number"
            value={block.content?.width || 100}
            onChange={(e) => updateContent({ width: parseInt(e.target.value) || 100 })}
            className="w-20"
          />
        </div>
      </div>
      <div>
        <Label htmlFor="divider-color">Color</Label>
        <Input
          id="divider-color"
          type="color"
          value={block.content?.color || '#cccccc'}
          onChange={(e) => updateContent({ color: e.target.value })}
        />
      </div>
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

