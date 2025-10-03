import React from "react";
import type { BlockConfig } from "@shared/schema";
import type { BlockDefinition } from "../types.ts";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Minus as SeparatorIcon } from "lucide-react";
import { useBlockManager } from "@/hooks/useBlockManager";

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

function SeparatorSettings({ block }: { block: BlockConfig }) {
  const { updateBlockContent, updateBlockStyles } = useBlockManager();

  const updateContent = (contentUpdates: any) => {
    updateBlockContent(block.id, contentUpdates);
  };

  const updateStyles = (styleUpdates: any) => {
    updateBlockStyles(block.id, styleUpdates);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="separator-color">Color</Label>
        <Input
          id="separator-color"
          type="color"
          value={block.styles?.color || "#000000"}
          onChange={(e) => updateStyles({ color: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="separator-width">Width</Label>
        <Input
          id="separator-width"
          value={block.styles?.width || "100px"}
          onChange={(e) => updateStyles({ width: e.target.value })}
          placeholder="e.g. 100px, 50%, auto"
        />
      </div>
      <div>
        <Label htmlFor="separator-class">Additional CSS Class(es)</Label>
        <Input
          id="separator-class"
          value={block.content?.className || ''}
          onChange={(e) => updateContent({ className: e.target.value })}
          placeholder="e.g. is-style-wide is-style-dots"
        />
      </div>
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