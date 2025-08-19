import React from "react";
import type { BlockConfig } from "@shared/schema";
import type { BlockDefinition } from "../types.ts";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Quote as QuoteIcon } from "lucide-react";

function QuoteRenderer({ block }: { block: BlockConfig; isPreview: boolean }) {
  const valueHtmlRaw: string | undefined = block.content?.value;
  const legacyText: string | undefined = block.content?.text;
  const citation: string | undefined = block.content?.citation ?? block.content?.author;
  const anchor: string | undefined = block.content?.anchor;
  const className: string | undefined = block.content?.className;
  const textAlign: 'left' | 'center' | 'right' | undefined = block.content?.textAlign;
  const align: 'wide' | 'full' | undefined = block.content?.align;

  const valueHtml = (valueHtmlRaw && valueHtmlRaw.trim().length > 0)
    ? valueHtmlRaw
    : (legacyText ? `<p>${legacyText}</p>` : '<p>Add a quote</p>');

  const classes = [
    'wp-block-quote',
    className || '',
    textAlign ? `has-text-align-${textAlign}` : '',
    align ? `align${align}` : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <blockquote
      {...(anchor ? { id: anchor } : {})}
      className={classes || undefined}
      style={{
        backgroundColor: '#f8fafc',
        borderLeft: '4px solid #e2e8f0',
        padding: '16px 20px',
        borderRadius: '6px',
        fontStyle: 'italic',
        fontFamily: 'Georgia, Cambria, "Times New Roman", Times, serif',
        fontSize: '1.125rem',
        lineHeight: 1.7,
        ...block.styles,
      }}
    >
      <div style={{ whiteSpace: 'pre-wrap' }} dangerouslySetInnerHTML={{ __html: valueHtml }} />
      {citation && (
        <cite style={{ display: 'block', marginTop: '10px', fontSize: '0.95rem', color: '#64748b' }}>
          — {citation}
        </cite>
      )}
    </blockquote>
  );
}

function QuoteSettings({ block, onUpdate }: { block: BlockConfig; onUpdate: (updates: Partial<BlockConfig>) => void }) {
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
        <Label htmlFor="quote-text">Quote</Label>
        <Textarea
          id="quote-text"
          value={(() => {
            const v: string | undefined = block.content?.value;
            if (v && v.includes('<p')) {
              // Convert HTML paragraphs to newline-separated text for editing UX
              return v
                .split(/<\/p>/i)
                .map((chunk) => chunk.replace(/<p[^>]*>/i, ''))
                .filter((line) => line !== '')
                .join('\n');
            }
            return block.content?.text || '';
          })()}
          onChange={(e) => {
            const lines = e.target.value.split('\n');
            const html = lines.map((l) => `<p>${l}</p>`).join('');
            updateContent({ value: html });
          }}
          placeholder={`Add your quote...`}
          rows={4}
        />
      </div>
      <div>
        <Label htmlFor="quote-author">Citation</Label>
        <Input
          id="quote-author"
          value={block.content?.citation ?? block.content?.author ?? ''}
          onChange={(e) => updateContent({ citation: e.target.value })}
          placeholder="Who said this (optional)"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="quote-text-align">Text Align</Label>
          <Select
            value={block.content?.textAlign ?? 'default'}
            onValueChange={(value) => updateContent({ textAlign: value === 'default' ? undefined : (value as 'left' | 'center' | 'right') })}
          >
            <SelectTrigger id="quote-text-align">
              <SelectValue placeholder="Default" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default</SelectItem>
              <SelectItem value="left">Left</SelectItem>
              <SelectItem value="center">Center</SelectItem>
              <SelectItem value="right">Right</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="quote-align">Width</Label>
          <Select
            value={block.content?.align ?? 'default'}
            onValueChange={(value) => updateContent({ align: value === 'default' ? undefined : (value as 'wide' | 'full') })}
          >
            <SelectTrigger id="quote-align">
              <SelectValue placeholder="Default" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default</SelectItem>
              <SelectItem value="wide">Wide</SelectItem>
              <SelectItem value="full">Full</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="quote-anchor">Anchor</Label>
          <Input
            id="quote-anchor"
            value={block.content?.anchor ?? ''}
            onChange={(e) => updateContent({ anchor: e.target.value })}
            placeholder="section-id"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="quote-class">CSS Class</Label>
          <Input
            id="quote-class"
            value={block.content?.className ?? ''}
            onChange={(e) => updateContent({ className: e.target.value })}
            placeholder="custom-class"
          />
        </div>
      </div>
    </div>
  );
}

const QuoteBlock: BlockDefinition = {
  id: 'core/quote',
  name: 'Quote',
  icon: QuoteIcon,
  description: 'Add a blockquote',
  category: 'advanced',
  defaultContent: {
    value: '<p>Add a quote</p>',
    citation: '',
    textAlign: undefined,
    align: undefined,
    anchor: '',
    className: '',
  },
  defaultStyles: {},
  renderer: QuoteRenderer,
  settings: QuoteSettings,
};

export default QuoteBlock;

