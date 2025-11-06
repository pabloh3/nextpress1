import React from "react";
import type { BlockConfig } from "@shared/schema-types";
import type { BlockDefinition } from "../types.ts";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CollapsibleCard } from "@/components/ui/collapsible-card";
import { Quote as QuoteIcon, Settings, Wrench } from "lucide-react";

function PullquoteRenderer({ block }: { block: BlockConfig; isPreview: boolean }) {
  const value = (block.content as any)?.value || '';
  const citation = (block.content as any)?.citation || '';
  const textAlign = (block.content as any)?.textAlign || 'center';
  
  const className = [
    "wp-block-pullquote",
    textAlign ? `has-text-align-${textAlign}` : '',
    block.content?.className || "",
  ].filter(Boolean).join(" ");

  return (
    <figure
      className={className}
      style={{
        textAlign,
        margin: '2em 0',
        padding: '2em',
        borderTop: '4px solid currentColor',
        borderBottom: '4px solid currentColor',
        backgroundColor: '#f8f9fa',
        ...block.styles,
      }}
    >
      <blockquote
        style={{
          fontSize: '1.5em',
          lineHeight: '1.6',
          fontStyle: 'italic',
          margin: 0,
          padding: 0,
        }}
        dangerouslySetInnerHTML={{ __html: value }}
      />
      {citation && (
        <cite
          style={{
            display: 'block',
            marginTop: '1em',
            fontSize: '0.9em',
            fontStyle: 'normal',
            opacity: 0.8,
          }}
        >
          {citation}
        </cite>
      )}
    </figure>
  );
}

function PullquoteSettings({ block, onUpdate }: { block: BlockConfig; onUpdate: (updates: Partial<BlockConfig>) => void }) {
  

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
      <CollapsibleCard title="Content" icon={QuoteIcon} defaultOpen={true}>
        <div className="space-y-4">
          <div>
            <Label htmlFor="pullquote-content" className="text-sm font-medium text-gray-700">Quote Content</Label>
            <Textarea
              id="pullquote-content"
              value={(block.content as any)?.value || ''}
              onChange={(e) => updateContent({ value: e.target.value })}
              placeholder="Enter your quote here..."
              rows={4}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="pullquote-citation" className="text-sm font-medium text-gray-700">Citation</Label>
            <Input
              id="pullquote-citation"
              value={(block.content as any)?.citation || ''}
              onChange={(e) => updateContent({ citation: e.target.value })}
              placeholder="Quote author or source"
              className="mt-1 h-9"
            />
          </div>
        </div>
      </CollapsibleCard>

      {/* Settings Card */}
      <CollapsibleCard title="Settings" icon={Settings} defaultOpen={true}>
        <div className="space-y-4">
          <div>
            <Label htmlFor="pullquote-align" className="text-sm font-medium text-gray-700">Text Align</Label>
            <Select
              value={(block.content as any)?.textAlign || 'center'}
              onValueChange={(value) => updateContent({ textAlign: value })}
            >
              <SelectTrigger id="pullquote-align" className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Left</SelectItem>
                <SelectItem value="center">Center</SelectItem>
                <SelectItem value="right">Right</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="pullquote-bg-color" className="text-sm font-medium text-gray-700">Background Color</Label>
              <div className="flex gap-3 mt-1">
                <Input
                  id="pullquote-bg-color"
                  type="color"
                  value={block.styles?.backgroundColor || "#f8f9fa"}
                  onChange={(e) => updateStyles({ backgroundColor: e.target.value })}
                  className="w-12 h-9 p-1 border-gray-200"
                />
                <Input
                  value={block.styles?.backgroundColor || "#f8f9fa"}
                  onChange={(e) => updateStyles({ backgroundColor: e.target.value })}
                  placeholder="#f8f9fa"
                  className="flex-1 h-9 text-sm"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="pullquote-text-color" className="text-sm font-medium text-gray-700">Text Color</Label>
              <div className="flex gap-3 mt-1">
                <Input
                  id="pullquote-text-color"
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
        </div>
      </CollapsibleCard>

      {/* Advanced Card */}
      <CollapsibleCard title="Advanced" icon={Wrench} defaultOpen={false}>
        <div className="space-y-4">
          <div>
            <Label htmlFor="pullquote-class" className="text-sm font-medium text-gray-700">Additional CSS Class(es)</Label>
            <Input
              id="pullquote-class"
              value={block.content?.className || ''}
              onChange={(e) => updateContent({ className: e.target.value })}
              placeholder="e.g. is-style-solid-color"
              className="mt-1 h-9 text-sm"
            />
          </div>
        </div>
      </CollapsibleCard>
    </div>
  );
}

const PullquoteBlock: BlockDefinition = {
  id: 'core/pullquote',
  name: 'Pullquote',
  icon: QuoteIcon,
  description: 'Give special visual emphasis to a quote from your text',
  category: 'advanced',
  defaultContent: {
    value: '<p>Add a quote that stands out from the rest of your content.</p>',
    citation: '',
    textAlign: 'center',
    className: '',
  },
  defaultStyles: {
    backgroundColor: '#f8f9fa',
    color: '#000000',
  },
  renderer: PullquoteRenderer,
  settings: PullquoteSettings,
  hasSettings: true,
};

export default PullquoteBlock;