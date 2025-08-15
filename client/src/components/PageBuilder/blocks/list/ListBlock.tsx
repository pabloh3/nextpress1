import React from "react";
import type { BlockConfig } from "@shared/schema";
import type { BlockDefinition } from "../types.ts";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { List as ListIcon } from "lucide-react";

function ListRenderer({ block }: { block: BlockConfig; isPreview: boolean }) {
  const ListTag = (block.content?.ordered ? 'ol' : 'ul') as keyof JSX.IntrinsicElements;
  const items: string[] = block.content?.items || ['List item 1', 'List item 2', 'List item 3'];
  return (
    <ListTag style={block.styles}>
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ListTag>
  );
}

function ListSettings({ block, onUpdate }: { block: BlockConfig; onUpdate: (updates: Partial<BlockConfig>) => void }) {
  const updateContent = (contentUpdates: any) => {
    onUpdate({
      content: {
        ...block.content,
        ...contentUpdates,
      },
    });
  };

  const items: string[] = block.content?.items || [];

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="list-type">List Type</Label>
        <Select
          value={block.content?.ordered ? 'ordered' : 'unordered'}
          onValueChange={(value) => updateContent({ ordered: value === 'ordered' })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="unordered">Bulleted</SelectItem>
            <SelectItem value="ordered">Numbered</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Items</Label>
        {[0,1,2,3,4].map((idx) => (
          <Input
            key={idx}
            value={items[idx] || ''}
            onChange={(e) => {
              const next = [...items];
              next[idx] = e.target.value;
              updateContent({ items: next });
            }}
            placeholder={`List item ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

const ListBlock: BlockDefinition = {
  id: 'list',
  name: 'List',
  icon: ListIcon,
  description: 'Add a bulleted or numbered list',
  category: 'advanced',
  defaultContent: {
    ordered: false,
    items: ['List item 1', 'List item 2', 'List item 3'],
  },
  defaultStyles: {},
  renderer: ListRenderer,
  settings: ListSettings,
};

export default ListBlock;

