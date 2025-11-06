import React from "react";
import type { BlockConfig } from "@shared/schema-types";
import type { BlockDefinition } from "../types.ts";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { CollapsibleCard } from "@/components/ui/collapsible-card";
import { FileText as PreformattedIcon, Settings, Wrench } from "lucide-react";

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

function PreformattedSettings({ block, onUpdate }: { block: BlockConfig; onUpdate: (updates: Partial<BlockConfig>) => void }) {
  
  
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
      <CollapsibleCard title="Content" icon={PreformattedIcon} defaultOpen={true}>
        <div className="space-y-4">
          <div>
            <Label htmlFor="preformatted-content" className="text-sm font-medium text-gray-700">Preformatted Text</Label>
            <Textarea
              id="preformatted-content"
              value={(block.content as any)?.content || ''}
              onChange={(e) => updateContent({ content: e.target.value })}
              placeholder="Enter your preformatted text here..."
              rows={8}
              className="mt-1"
              style={{
                fontFamily: 'Monaco, Consolas, "Andale Mono", "DejaVu Sans Mono", monospace',
                fontSize: '14px',
              }}
            />
            <p className="text-sm text-gray-600 mt-2">
              This text will preserve whitespace and line breaks exactly as you type them.
            </p>
          </div>
        </div>
      </CollapsibleCard>

      {/* Settings Card */}
      <CollapsibleCard title="Settings" icon={Settings} defaultOpen={true}>
        <div className="space-y-4">
          <div>
            <Label htmlFor="preformatted-bg-color" className="text-sm font-medium text-gray-700">Background Color</Label>
            <div className="flex gap-3 mt-1">
              <Input
                id="preformatted-bg-color"
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
            <Label htmlFor="preformatted-text-color" className="text-sm font-medium text-gray-700">Text Color</Label>
            <div className="flex gap-3 mt-1">
              <Input
                id="preformatted-text-color"
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

          <div>
            <Label htmlFor="preformatted-font-size" className="text-sm font-medium text-gray-700">Font Size</Label>
            <Input
              id="preformatted-font-size"
              value={block.styles?.fontSize || "14px"}
              onChange={(e) => updateStyles({ fontSize: e.target.value })}
              placeholder="14px"
              className="mt-1 h-9"
            />
          </div>
        </div>
      </CollapsibleCard>

      {/* Advanced Card */}
      <CollapsibleCard title="Advanced" icon={Wrench} defaultOpen={false}>
        <div className="space-y-4">
          <div>
            <Label htmlFor="preformatted-class" className="text-sm font-medium text-gray-700">Additional CSS Class(es)</Label>
            <Input
              id="preformatted-class"
              value={block.content?.className || ''}
              onChange={(e) => updateContent({ className: e.target.value })}
              placeholder="e.g. custom-preformatted"
              className="mt-1 h-9 text-sm"
            />
          </div>
        </div>
      </CollapsibleCard>
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