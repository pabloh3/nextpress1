import React from "react";
import type { BlockConfig } from "@shared/schema-types";
import type { BlockDefinition } from "../types.ts";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Space as SpaceIcon } from "lucide-react";

function SpacerRenderer({ block }: { block: BlockConfig; isPreview: boolean }) {
  const height = block.content?.height ?? 100;
  
  return (
    <div
      className="wp-block-spacer"
      style={{
        height: `${height}px`,
        ...block.styles,
      }}
      aria-hidden="true"
    />
  );
}

import { CollapsibleCard } from "@/components/ui/collapsible-card";
import { Settings, Wrench } from "lucide-react";

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
      {/* Content Card */}
      <CollapsibleCard title="Content" icon={SpaceIcon} defaultOpen={true}>
        <div className="space-y-4">
          <div>
            <Label htmlFor="spacer-height" className="text-sm font-medium text-gray-700">Height (px)</Label>
            <div className="flex items-center space-x-4">
              <Slider
                aria-label="Spacer height in pixels"
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
              value={block.content?.anchor || ''}
              onChange={(e) => updateContent({ anchor: e.target.value })}
              placeholder="section-id"
              className="mt-1 h-9 text-sm"
            />
          </div>
          <div>
            <Label htmlFor="spacer-class" className="text-sm font-medium text-gray-700">CSS Classes</Label>
            <Input
              id="spacer-class"
              value={block.content?.className || ''}
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
  renderer: SpacerRenderer,
  settings: SpacerSettings,
  hasSettings: true,
};

export default SpacerBlock;

