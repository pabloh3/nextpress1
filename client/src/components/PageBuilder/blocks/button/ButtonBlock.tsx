import React from "react";
import type { BlockConfig } from "@shared/schema";
import type { BlockDefinition } from "../types.ts";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MousePointer } from "lucide-react";

function ButtonRenderer({ block, isPreview }: { block: BlockConfig; isPreview: boolean }) {
  return (
    <a
      href={block.content?.url}
      target={block.content?.target}
      style={block.styles}
      className="inline-block text-decoration-none"
      onClick={(e) => isPreview ? undefined : e.preventDefault()}
    >
      {block.content?.text}
    </a>
  );
}

function ButtonSettings({ block, onUpdate }: { block: BlockConfig; onUpdate: (updates: Partial<BlockConfig>) => void }) {
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
        <Label htmlFor="button-text">Button Text</Label>
        <Input
          id="button-text"
          value={block.content?.text || ''}
          onChange={(e) => updateContent({ text: e.target.value })}
          placeholder="Button text"
        />
      </div>
      <div>
        <Label htmlFor="button-url">Link URL</Label>
        <Input
          id="button-url"
          value={block.content?.url || ''}
          onChange={(e) => updateContent({ url: e.target.value })}
          placeholder="https://example.com"
        />
      </div>
      <div>
        <Label htmlFor="button-target">Link Target</Label>
        <Select
          value={block.content?.target || '_self'}
          onValueChange={(value) => updateContent({ target: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_self">Same Window</SelectItem>
            <SelectItem value="_blank">New Window</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

const ButtonBlock: BlockDefinition = {
  id: 'button',
  name: 'Button',
  icon: MousePointer,
  description: 'Add a clickable button',
  category: 'basic',
  defaultContent: {
    text: 'Click Me',
    url: '#',
    target: '_self',
  },
  defaultStyles: {
    backgroundColor: '#007cba',
    color: '#ffffff',
    padding: '12px 24px',
    borderRadius: '4px',
    border: 'none',
    fontSize: '16px',
    textAlign: 'center',
    display: 'inline-block',
    cursor: 'pointer',
  },
  renderer: ButtonRenderer,
  settings: ButtonSettings,
};

export default ButtonBlock;

