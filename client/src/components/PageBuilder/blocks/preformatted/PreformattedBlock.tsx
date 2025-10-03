import React from "react";
import type { BlockConfig } from "@shared/schema";
import type { BlockDefinition } from "../types.ts";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { FileText as PreformattedIcon } from "lucide-react";
import { useBlockManager } from "@/hooks/useBlockManager";

function PreformattedRenderer({ block }: { block: BlockConfig; isPreview: boolean }) {
  const content = (block.content as any)?.content || '';
  
  const className = [
    "wp-block-preformatted",
    block.content?.className || "",
  ].filter(Boolean).join(" ");

  return (
    <pre
      className={className}
      style={{
        fontFamily: 'Monaco, Consolas, "Andale Mono", "DejaVu Sans Mono", monospace',
        fontSize: '14px',
        lineHeight: '1.6',
        whiteSpace: 'pre-wrap',
        overflow: 'auto',
        backgroundColor: '#f8f9fa',
        padding: '1em',
        border: '1px solid #e9ecef',
        borderRadius: '4px',
        margin: '1em 0',
        ...block.styles,
      }}
    >
      {content}
    </pre>
  );
}

function PreformattedSettings({ block }: { block: BlockConfig }) {
  const { updateBlockContent, updateBlockStyles } = useBlockManager();
  
  const updateContent = (contentUpdates: any) => {
    updateBlockContent(block.id, {
      ...block.content,
      ...contentUpdates,
    });
  };

  const updateStyles = (styleUpdates: any) => {
    updateBlockStyles(block.id, {
      ...block.styles,
      ...styleUpdates,
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="preformatted-content">Preformatted Text</Label>
        <Textarea
          id="preformatted-content"
          value={(block.content as any)?.content || ''}
          onChange={(e) => updateContent({ content: e.target.value })}
          placeholder="Enter your preformatted text here..."
          rows={8}
          style={{
            fontFamily: 'Monaco, Consolas, "Andale Mono", "DejaVu Sans Mono", monospace',
            fontSize: '14px',
          }}
        />
        <p className="text-sm text-gray-600 mt-2">
          This text will preserve whitespace and line breaks exactly as you type them.
        </p>
      </div>

      <div>
        <Label htmlFor="preformatted-bg-color">Background Color</Label>
        <Input
          id="preformatted-bg-color"
          type="color"
          value={block.styles?.backgroundColor || "#f8f9fa"}
          onChange={(e) => updateStyles({ backgroundColor: e.target.value })}
        />
      </div>

      <div>
        <Label htmlFor="preformatted-text-color">Text Color</Label>
        <Input
          id="preformatted-text-color"
          type="color"
          value={block.styles?.color || "#000000"}
          onChange={(e) => updateStyles({ color: e.target.value })}
        />
      </div>

      <div>
        <Label htmlFor="preformatted-font-size">Font Size</Label>
        <Input
          id="preformatted-font-size"
          value={block.styles?.fontSize || "14px"}
          onChange={(e) => updateStyles({ fontSize: e.target.value })}
          placeholder="14px"
        />
      </div>

      <div>
        <Label htmlFor="preformatted-class">Additional CSS Class(es)</Label>
        <Input
          id="preformatted-class"
          value={block.content?.className || ''}
          onChange={(e) => updateContent({ className: e.target.value })}
          placeholder="e.g. custom-preformatted"
        />
      </div>
    </div>
  );
}

const PreformattedBlock: BlockDefinition = {
  id: 'core/preformatted',
  name: 'Preformatted',
  icon: PreformattedIcon,
  description: 'Add text that respects your spacing and tabs',
  category: 'advanced',
  defaultContent: {
    content: 'This is preformatted text.\nIt preserves    spacing   and\n\teven\ttabs!',
    className: '',
  },
  defaultStyles: {
    backgroundColor: '#f8f9fa',
    color: '#000000',
    fontSize: '14px',
  },
  renderer: PreformattedRenderer,
  settings: PreformattedSettings,
};

export default PreformattedBlock;