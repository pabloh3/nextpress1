import React from "react";
import type { BlockConfig } from "@shared/schema";
import type { BlockDefinition } from "../types.ts";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Type } from "lucide-react";

function TextRenderer({ block }: { block: BlockConfig; isPreview: boolean }) {
  const Tag = (block.content?.tag || 'p') as keyof JSX.IntrinsicElements;
  return (
    <Tag style={block.styles}>
      {block.content?.text}
    </Tag>
  );
}

function TextSettings({ block, onUpdate }: { block: BlockConfig; onUpdate: (updates: Partial<BlockConfig>) => void }) {
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
          value={block.content?.text || ''}
          onChange={(e) => updateContent({ text: e.target.value })}
          placeholder="Enter your text content"
          rows={4}
        />
      </div>
      <div>
        <Label htmlFor="text-tag">HTML Tag</Label>
        <Select
          value={block.content?.tag || 'p'}
          onValueChange={(value) => updateContent({ tag: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="p">Paragraph (p)</SelectItem>
            <SelectItem value="span">Span</SelectItem>
            <SelectItem value="div">Div</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

const TextBlock: BlockDefinition = {
  id: 'text',
  name: 'Text',
  icon: Type,
  description: 'Add a paragraph of text',
  category: 'basic',
  defaultContent: {
    text: 'Add your text content here. You can edit this text and customize its appearance.',
    tag: 'p',
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

