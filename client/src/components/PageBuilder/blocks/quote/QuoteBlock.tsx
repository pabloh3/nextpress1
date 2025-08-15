import React from "react";
import type { BlockConfig } from "@shared/schema";
import type { BlockDefinition } from "../types.ts";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Quote as QuoteIcon } from "lucide-react";

function QuoteRenderer({ block }: { block: BlockConfig; isPreview: boolean }) {
  return (
    <blockquote
      style={{
        ...block.styles,
        borderLeft: '4px solid #e2e8f0',
        paddingLeft: '20px',
        fontStyle: 'italic',
      }}
    >
      {block.content?.text}
      {block.content?.author && (
        <cite style={{ display: 'block', marginTop: '10px', fontSize: '0.9em' }}>
          — {block.content.author}
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
        <Input
          id="quote-text"
          value={block.content?.text || ''}
          onChange={(e) => updateContent({ text: e.target.value })}
          placeholder="Enter quote"
        />
      </div>
      <div>
        <Label htmlFor="quote-author">Author</Label>
        <Input
          id="quote-author"
          value={block.content?.author || ''}
          onChange={(e) => updateContent({ author: e.target.value })}
          placeholder="Author (optional)"
        />
      </div>
    </div>
  );
}

const QuoteBlock: BlockDefinition = {
  id: 'quote',
  name: 'Quote',
  icon: QuoteIcon,
  description: 'Add a blockquote',
  category: 'advanced',
  defaultContent: {
    text: '',
    author: '',
  },
  defaultStyles: {},
  renderer: QuoteRenderer,
  settings: QuoteSettings,
};

export default QuoteBlock;

