import React from "react";
import type { BlockConfig } from "@shared/schema";
import type { BlockDefinition } from "../types.ts";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Space as SpaceIcon } from "lucide-react";

function SpacerRenderer({ block }: { block: BlockConfig; isPreview: boolean }) {
  return (
    <div
      style={{
        height: `${block.content?.height ?? 50}px`,
        ...block.styles,
      }}
    />
  );
}

function SpacerSettings({ block, onUpdate }: { block: BlockConfig; onUpdate: (updates: Partial<BlockConfig>) => void }) {
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
      <div>
        <Label htmlFor="spacer-height">Height (px)</Label>
        <div className="flex items-center space-x-4">
          <Slider
            value={[block.content?.height || 50]}
            onValueChange={([value]) => updateContent({ height: value })}
            max={200}
            min={10}
            step={5}
            className="flex-1"
          />
          <Input
            id="spacer-height"
            type="number"
            value={block.content?.height || 50}
            onChange={(e) => updateContent({ height: parseInt(e.target.value) || 50 })}
            className="w-20"
          />
        </div>
      </div>
    </div>
  );
}

const SpacerBlock: BlockDefinition = {
  id: 'spacer',
  name: 'Spacer',
  icon: SpaceIcon,
  description: 'Add vertical spacing',
  category: 'layout',
  defaultContent: {
    height: 50,
  },
  defaultStyles: {
    padding: '0px',
  },
  renderer: SpacerRenderer,
  settings: SpacerSettings,
};

export default SpacerBlock;

