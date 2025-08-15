// blocks/heading/HeadingBlock.tsx
import { Heading1 } from "lucide-react";
import type { BlockDefinition } from "../types.ts";
import type { BlockConfig } from "@shared/schema";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import React from "react";

function HeadingRenderer({ block }: { block: BlockConfig; isPreview: boolean }) {
  const level = (block.content?.level as number) || 2;
  const Tag = (`h${level}` as unknown) as keyof JSX.IntrinsicElements;
  return (
    <Tag style={block.styles}>
      {block.content?.text}
    </Tag>
  );
}

function HeadingSettings({ block, onUpdate }: { block: BlockConfig; onUpdate: (updates: Partial<BlockConfig>) => void }) {
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
        <Label htmlFor="heading-text">Text</Label>
        <Input
          id="heading-text"
          value={block.content?.text || ''}
          onChange={(e) => updateContent({ text: e.target.value })}
          placeholder="Enter heading text"
        />
      </div>
      <div>
        <Label htmlFor="heading-level">Heading Level</Label>
        <Select
          value={(block.content?.level?.toString() || '2')}
          onValueChange={(value) => updateContent({ level: parseInt(value) })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">H1</SelectItem>
            <SelectItem value="2">H2</SelectItem>
            <SelectItem value="3">H3</SelectItem>
            <SelectItem value="4">H4</SelectItem>
            <SelectItem value="5">H5</SelectItem>
            <SelectItem value="6">H6</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

export const HeadingBlock: BlockDefinition = {
  id: 'heading',
  name: 'Heading',
  icon: Heading1,
  description: 'Add a heading text',
  category: 'basic',
  defaultContent: {
    text: 'Your heading here',
    level: 2
  },
  defaultStyles: {
    fontSize: '2rem',
    fontWeight: 'bold',
    margin: '1rem 0'
  },
  renderer: HeadingRenderer,
  settings: HeadingSettings
};

export default HeadingBlock;