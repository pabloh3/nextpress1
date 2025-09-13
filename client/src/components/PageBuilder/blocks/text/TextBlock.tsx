import React from "react";
import type { BlockConfig } from "@shared/schema";
import type { BlockDefinition } from "../types.ts";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Type } from "lucide-react";

interface TextBlockContent {
  content?: string;
  text?: string;
  align?: 'left' | 'center' | 'right' | 'justify';
  anchor?: string;
  className?: string;
  dropCap?: boolean;
}

interface TextBlockConfig extends Omit<BlockConfig, 'content'> {
  content?: TextBlockContent;
}

function TextRenderer({ block }: { block: TextBlockConfig; isPreview: boolean }) {
  const align = (block.content?.align as string) || (block.styles?.textAlign as string | undefined);
  const anchor = block.content?.anchor as string | undefined;
  const extraClass = (block.content?.className as string | undefined) || "";
  const dropCap = Boolean(block.content?.dropCap);

  const className = [
    "wp-block-paragraph",
    align ? `has-text-align-${align}` : "",
    dropCap ? "has-drop-cap" : "",
    extraClass,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <p id={anchor} className={className} style={block.styles}>
      {block.content?.content ?? block.content?.text}
    </p>
  );
}

function TextSettings({ block, onUpdate }: { block: TextBlockConfig; onUpdate: (updates: Partial<BlockConfig>) => void }) {
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
        <Label htmlFor="text-content">Text Content</Label>
        <Textarea
          id="text-content"
          value={(block.content?.content ?? block.content?.text) || ''}
          onChange={(e) => updateContent({ content: e.target.value, text: undefined })}
          placeholder="Enter your text content"
          rows={4}
        />
      </div>
      <div>
        <Label htmlFor="paragraph-align">Text Align</Label>
        <Select
          value={block.content?.align || 'left'}
          onValueChange={(value) => updateContent({ align: value })}
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
      <div className="flex items-center justify-between">
        <Label htmlFor="paragraph-dropcap">Drop cap</Label>
        <Switch
          id="paragraph-dropcap"
          checked={Boolean(block.content?.dropCap)}
          onCheckedChange={(checked) => updateContent({ dropCap: checked })}
        />
      </div>
      <div>
        <Label htmlFor="paragraph-anchor">Anchor</Label>
        <Textarea
          id="paragraph-anchor"
          value={block.content?.anchor || ''}
          onChange={(e) => updateContent({ anchor: e.target.value })}
          placeholder="Add an anchor (without #)"
          rows={1}
        />
      </div>
      <div>
        <Label htmlFor="paragraph-class">Additional CSS Class(es)</Label>
        <Textarea
          id="paragraph-class"
          value={block.content?.className || ''}
          onChange={(e) => updateContent({ className: e.target.value })}
          placeholder="e.g. custom-class is-style-outline"
          rows={1}
        />
      </div>
    </div>
  );
}

const TextBlock: BlockDefinition = {
  id: 'core/paragraph',
  name: 'Paragraph',
  icon: Type,
  description: 'Add a paragraph of text',
  category: 'basic',
  defaultContent: {
    content: 'Add your text content here. You can edit this text and customize its appearance.',
    align: 'left',
    dropCap: false,
    anchor: '',
    className: '',
  },
  defaultStyles: {
    fontSize: '16px',
    lineHeight: '1.6',
    color: '#333333',
  },
  renderer: TextRenderer,
  settings: TextSettings,
};

export default TextBlock;

