import React from "react";
import type { BlockConfig } from "@shared/schema";
import type { BlockDefinition } from "../types.ts";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { CollapsibleCard } from "@/components/ui/collapsible-card";
import { Code2 as HtmlIcon, Wrench } from "lucide-react";

function HtmlRenderer({ block, isPreview }: { block: BlockConfig; isPreview: boolean }) {
  const content = (block.content as any)?.content || '';
  
  const className = [
    "wp-block-html",
    block.content?.className || "",
  ].filter(Boolean).join(" ");

  // In preview mode, render the HTML directly
  // In edit mode, show it as code
  if (isPreview && content) {
    return (
      <div
        className={className}
        style={block.styles}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }

  return (
    <div className={className} style={block.styles}>
      <div style={{
        backgroundColor: '#f8f9fa',
        padding: '1em',
        borderRadius: '4px',
        border: '1px solid #e9ecef',
        fontFamily: 'Monaco, Consolas, "Andale Mono", "DejaVu Sans Mono", monospace',
        fontSize: '14px',
        lineHeight: '1.4',
        whiteSpace: 'pre-wrap',
        color: '#6c757d',
      }}>
        {content || 'Enter custom HTML...'}
      </div>
    </div>
  );
}

function HtmlSettings({ block, onUpdate }: { block: BlockConfig; onUpdate: (updates: Partial<BlockConfig>) => void }) {
  
  
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
      {/* Content Card */}
      <CollapsibleCard title="Content" icon={HtmlIcon} defaultOpen={true}>
        <div className="space-y-4">
          <div>
            <Label htmlFor="html-content" className="text-sm font-medium text-gray-700">Custom HTML</Label>
            <Textarea
              id="html-content"
              value={(block.content as any)?.content || ''}
              onChange={(e) => updateContent({ content: e.target.value })}
              placeholder="<p>Enter your custom HTML here...</p>"
              rows={10}
              className="mt-1"
              style={{
                fontFamily: 'Monaco, Consolas, "Andale Mono", "DejaVu Sans Mono", monospace',
                fontSize: '14px',
              }}
            />
            <p className="text-sm text-gray-600 mt-2">
              Be careful when adding custom HTML. Make sure it's from a trusted source and won't break your site.
            </p>
          </div>
        </div>
      </CollapsibleCard>

      {/* Advanced Card */}
      <CollapsibleCard title="Advanced" icon={Wrench} defaultOpen={false}>
        <div className="space-y-4">
          <div>
            <Label htmlFor="html-class" className="text-sm font-medium text-gray-700">Additional CSS Class(es)</Label>
            <Input
              id="html-class"
              value={block.content?.className || ''}
              onChange={(e) => updateContent({ className: e.target.value })}
              placeholder="e.g. custom-widget"
              className="mt-1 h-9 text-sm"
            />
          </div>
        </div>
      </CollapsibleCard>
    </div>
  );
}

const HtmlBlock: BlockDefinition = {
  id: 'core/html',
  name: 'Custom HTML',
  icon: HtmlIcon,
  description: 'Add custom HTML code',
  category: 'advanced',
  defaultContent: {
    content: '',
    className: '',
  },
  defaultStyles: {
    margin: '1em 0',
  },
  renderer: HtmlRenderer,
  settings: HtmlSettings,
  hasSettings: true,
};

export default HtmlBlock;