import React from "react";
import type { BlockConfig } from "@shared/schema";
import type { BlockDefinition } from "../types.ts";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Quote as QuoteIcon } from "lucide-react";
import { useBlockManager } from "@/hooks/useBlockManager";

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

function PullquoteSettings({ block }: { block: BlockConfig }) {
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
        <Label htmlFor="pullquote-content">Quote Content</Label>
        <Textarea
          id="pullquote-content"
          value={(block.content as any)?.value || ''}
          onChange={(e) => updateContent({ value: e.target.value })}
          placeholder="Enter your quote here..."
          rows={4}
        />
      </div>

      <div>
        <Label htmlFor="pullquote-citation">Citation</Label>
        <Input
          id="pullquote-citation"
          value={(block.content as any)?.citation || ''}
          onChange={(e) => updateContent({ citation: e.target.value })}
          placeholder="Quote author or source"
        />
      </div>

      <div>
        <Label htmlFor="pullquote-align">Text Align</Label>
        <Select
          value={(block.content as any)?.textAlign || 'center'}
          onValueChange={(value) => updateContent({ textAlign: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="left">Left</SelectItem>
            <SelectItem value="center">Center</SelectItem>
            <SelectItem value="right">Right</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="pullquote-bg-color">Background Color</Label>
        <Input
          id="pullquote-bg-color"
          type="color"
          value={block.styles?.backgroundColor || "#f8f9fa"}
          onChange={(e) => updateStyles({ backgroundColor: e.target.value })}
        />
      </div>

      <div>
        <Label htmlFor="pullquote-text-color">Text Color</Label>
        <Input
          id="pullquote-text-color"
          type="color"
          value={block.styles?.color || "#000000"}
          onChange={(e) => updateStyles({ color: e.target.value })}
        />
      </div>

      <div>
        <Label htmlFor="pullquote-class">Additional CSS Class(es)</Label>
        <Input
          id="pullquote-class"
          value={block.content?.className || ''}
          onChange={(e) => updateContent({ className: e.target.value })}
          placeholder="e.g. is-style-solid-color"
        />
      </div>
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