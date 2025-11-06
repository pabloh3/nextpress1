import React from "react";
import type { BlockConfig } from "@shared/schema-types";
import type { BlockDefinition } from "../types.ts";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { CollapsibleCard } from "@/components/ui/collapsible-card";
import { Minus as SeparatorIcon, Settings, Wrench } from "lucide-react";

function SeparatorRenderer({ block }: { block: BlockConfig; isPreview: boolean }) {
  const className = [
    "wp-block-separator",
    block.content?.className || "",
  ].filter(Boolean).join(" ");

  return (
    <hr
      className={className}
      style={{
        ...block.styles,
        border: "none",
        borderTop: "1px solid currentColor",
        backgroundColor: "currentColor",
        height: "1px",
        margin: "2.5em auto",
        width: "100px",
        opacity: 1,
      }}
    />
  );
}

function SeparatorSettings({ block, onUpdate }: { block: BlockConfig; onUpdate: (updates: Partial<BlockConfig>) => void }) {
  

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
      {/* Content Card */}
      <CollapsibleCard title="Content" icon={SeparatorIcon} defaultOpen={true}>
        <div className="space-y-4">
          <div>
            <Label htmlFor="separator-color" className="text-sm font-medium text-gray-700">Color</Label>
            <div className="flex gap-3 mt-1">
              <Input
                id="separator-color"
                type="color"
                value={block.styles?.color || "#000000"}
                onChange={(e) => updateStyles({ color: e.target.value })}
                className="w-12 h-9 p-1 border-gray-200"
              />
              <Input
                value={block.styles?.color || "#000000"}
                onChange={(e) => updateStyles({ color: e.target.value })}
                placeholder="#000000"
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
            <Label htmlFor="separator-width" className="text-sm font-medium text-gray-700">Width</Label>
            <Input
              id="separator-width"
              value={block.styles?.width || "100px"}
              onChange={(e) => updateStyles({ width: e.target.value })}
              placeholder="e.g. 100px, 50%, auto"
              className="mt-1 h-9"
            />
          </div>
        </div>
      </CollapsibleCard>

      {/* Advanced Card */}
      <CollapsibleCard title="Advanced" icon={Wrench} defaultOpen={false}>
        <div className="space-y-4">
          <div>
            <Label htmlFor="separator-class" className="text-sm font-medium text-gray-700">Additional CSS Class(es)</Label>
            <Input
              id="separator-class"
              value={block.content?.className || ''}
              onChange={(e) => updateContent({ className: e.target.value })}
              placeholder="e.g. is-style-wide is-style-dots"
              className="mt-1 h-9 text-sm"
            />
          </div>
        </div>
      </CollapsibleCard>
    </div>
  );
}

const SeparatorBlock: BlockDefinition = {
  id: 'core/separator',
  name: 'Separator',
  icon: SeparatorIcon,
  description: 'Create a break between ideas or sections',
  category: 'layout',
  defaultContent: {
    className: '',
  },
  defaultStyles: {
    color: '#000000',
    width: '100px',
    margin: '2.5em auto',
  },
  renderer: SeparatorRenderer,
  settings: SeparatorSettings,
  hasSettings: true,
};

export default SeparatorBlock;