import React from "react";
import type { BlockConfig } from "@shared/schema";
import type { BlockDefinition } from "../types.ts";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { CollapsibleCard } from "@/components/ui/collapsible-card";
import { Type, AlignLeft, AlignCenter, AlignRight, AlignJustify, Settings, Wrench } from "lucide-react";
import { useBlockManager } from "@/hooks/useBlockManager";

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

function TextSettings({ block }: { block: TextBlockConfig }) {
  const { updateBlockContent } = useBlockManager();
  
  const updateContent = (contentUpdates: any) => {
    updateBlockContent(block.id, contentUpdates);
  };

  const alignmentOptions = [
    { 
      value: 'left', 
      label: 'Left', 
      icon: AlignLeft 
    },
    { 
      value: 'center', 
      label: 'Center', 
      icon: AlignCenter 
    },
    { 
      value: 'right', 
      label: 'Right', 
      icon: AlignRight 
    },
    { 
      value: 'justify', 
      label: 'Justify', 
      icon: AlignJustify 
    }
  ];

  const currentAlign = block.content?.align || 'left';

  return (
    <div className="space-y-4">
      <CollapsibleCard
        title="Content"
        icon={Type}
        defaultOpen={true}
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="text-content">Text Content</Label>
            <Textarea
              id="text-content"
              aria-label="Text content"
              className="h-36"
              value={(block.content?.content ?? block.content?.text) || ''}
              onChange={(e) => updateContent({ content: e.target.value, text: undefined })}
              placeholder="Enter your text content"
              rows={4}
            />
          </div>
        </div>
      </CollapsibleCard>

      <CollapsibleCard
        title="Settings"
        icon={Settings}
        defaultOpen={true}
      >
        <div className="space-y-4">
          <div>
            <Label>Text Alignment</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {alignmentOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    onClick={() => updateContent({ align: option.value })}
                    className={`flex items-center gap-2 p-3 text-sm font-medium rounded-lg border transition-colors ${
                      currentAlign === option.value
                        ? 'bg-gray-200 text-gray-800 border-gray-200 hover:bg-gray-300'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="paragraph-dropcap">Drop cap</Label>
            <Switch
              id="paragraph-dropcap"
              checked={Boolean(block.content?.dropCap)}
              onCheckedChange={(checked) => updateContent({ dropCap: checked })}
            />
          </div>
        </div>
      </CollapsibleCard>

      <CollapsibleCard
        title="Advanced"
        icon={Wrench}
        defaultOpen={false}
      >
        <div className="space-y-4">
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
                aria-label="Additional CSS classes"
                value={block.content?.className || ''}
                onChange={(e) => updateContent({ className: e.target.value })}
                placeholder="e.g. custom-class is-style-outline"
                rows={1}
              />
          </div>
        </div>
      </CollapsibleCard>
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
  hasSettings: true,
};

export default TextBlock;

