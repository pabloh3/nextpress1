import React from "react";
import type { BlockConfig } from "@shared/schema";
import type { BlockDefinition } from "../types.ts";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MousePointer } from "lucide-react";

function ButtonRenderer({ block, isPreview }: { block: BlockConfig; isPreview: boolean }) {
  const url = block.content?.url as string | undefined;
  const linkTarget = (block.content?.linkTarget as string | undefined) || (block.content?.target as string | undefined);
  const rel = block.content?.rel as string | undefined;
  const title = block.content?.title as string | undefined;
  const extraClass = (block.content?.className as string | undefined) || "";

  const wrapperClass = ["wp-block-button", extraClass].filter(Boolean).join(" ");
  const anchorClass = "wp-block-button__link wp-element-button";

  return (
    <div className={wrapperClass} onClick={(e) => (isPreview ? undefined : e.preventDefault())}>
      <a
        href={url}
        target={linkTarget}
        rel={rel}
        title={title}
        style={block.styles}
        className={anchorClass}
      >
        {block.content?.text}
      </a>
    </div>
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
          value={(block.content?.linkTarget || block.content?.target || '_self')}
          onValueChange={(value) => updateContent({ linkTarget: value, target: undefined })}
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
      <div>
        <Label htmlFor="button-rel">Rel</Label>
        <Input
          id="button-rel"
          value={block.content?.rel || ''}
          onChange={(e) => updateContent({ rel: e.target.value })}
          placeholder="noopener noreferrer"
        />
      </div>
      <div>
        <Label htmlFor="button-title">Title</Label>
        <Input
          id="button-title"
          value={block.content?.title || ''}
          onChange={(e) => updateContent({ title: e.target.value })}
          placeholder="Link title"
        />
      </div>
      <div>
        <Label htmlFor="button-class">Additional CSS Class(es)</Label>
        <Input
          id="button-class"
          value={block.content?.className || ''}
          onChange={(e) => updateContent({ className: e.target.value })}
          placeholder="e.g. is-style-outline"
        />
      </div>
    </div>
  );
}

const ButtonBlock: BlockDefinition = {
  id: 'core/button',
  name: 'Button',
  icon: MousePointer,
  description: 'Add a clickable button',
  category: 'basic',
  defaultContent: {
    text: 'Click Me',
    url: '#',
    linkTarget: '_self',
    rel: '',
    title: '',
    className: '',
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

