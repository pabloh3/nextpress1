import React from "react";
import type { BlockConfig } from "@shared/schema";
import type { BlockDefinition } from "../types.ts";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Code as CodeIcon } from "lucide-react";

function CodeRenderer({ block }: { block: BlockConfig; isPreview: boolean }) {
  const content = (block.content as any)?.content || '';
  const language = (block.content as any)?.language || '';
  
  const className = [
    "wp-block-code",
    language ? `language-${language}` : '',
    block.content?.className || "",
  ].filter(Boolean).join(" ");

  return (
    <div className={className} style={block.styles}>
      <pre style={{
        backgroundColor: '#f8f9fa',
        padding: '1em',
        borderRadius: '4px',
        border: '1px solid #e9ecef',
        overflow: 'auto',
        fontFamily: 'Monaco, Consolas, "Andale Mono", "DejaVu Sans Mono", monospace',
        fontSize: '14px',
        lineHeight: '1.4',
        margin: 0,
      }}>
        <code>{content}</code>
      </pre>
    </div>
  );
}

function CodeSettings({ block, onUpdate }: { block: BlockConfig; onUpdate: (updates: Partial<BlockConfig>) => void }) {
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
        <Label htmlFor="code-content">Code</Label>
        <Textarea
          id="code-content"
          value={(block.content as any)?.content || ''}
          onChange={(e) => updateContent({ content: e.target.value })}
          placeholder="Enter your code here..."
          rows={8}
          style={{
            fontFamily: 'Monaco, Consolas, "Andale Mono", "DejaVu Sans Mono", monospace',
            fontSize: '14px',
          }}
        />
      </div>

      <div>
        <Label htmlFor="code-language">Language (optional)</Label>
        <Input
          id="code-language"
          value={(block.content as any)?.language || ''}
          onChange={(e) => updateContent({ language: e.target.value })}
          placeholder="e.g. javascript, python, html"
        />
      </div>

      <div>
        <Label htmlFor="code-class">Additional CSS Class(es)</Label>
        <Input
          id="code-class"
          value={block.content?.className || ''}
          onChange={(e) => updateContent({ className: e.target.value })}
          placeholder="e.g. line-numbers"
        />
      </div>
    </div>
  );
}

const CodeBlock: BlockDefinition = {
  id: 'core/code',
  name: 'Code',
  icon: CodeIcon,
  description: 'Display code with syntax highlighting',
  category: 'advanced',
  defaultContent: {
    content: '// Write your code here\nfunction hello() {\n  console.log("Hello, World!");\n}',
    language: '',
    className: '',
  },
  defaultStyles: {
    margin: '1em 0',
  },
  renderer: CodeRenderer,
  settings: CodeSettings,
};

export default CodeBlock;