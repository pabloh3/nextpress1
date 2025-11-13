// blocks/heading/HeadingBlock.tsx
import { Heading1 } from "lucide-react";
import type { BlockDefinition } from "../types.ts";
import type { BlockConfig } from "@shared/schema-types";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CollapsibleCard } from "@/components/ui/collapsible-card";
import { Type, Settings, AlignLeft } from "lucide-react";
import React from "react";

interface HeadingBlockContent {
  content?: string;
  text?: string;
  level?: number;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  anchor?: string;
  className?: string;
}

interface HeadingBlockConfig extends Omit<BlockConfig, 'content'> {
  content?: HeadingBlockContent;
}

function HeadingRenderer({ block }: { block: HeadingBlockConfig; isPreview: boolean }) {
  // Extract text content safely using discriminated union pattern
  const textContent = block.content?.kind === 'text' ? block.content.value : '';
  
  const level = (block.content?.level as number) || 2;
  const Tag = ("h" + level) as keyof JSX.IntrinsicElements;

  const textAlign = (block.content?.textAlign as string) || block.styles?.textAlign;
  const anchor = block.content?.anchor as string | undefined;
  const extraClass = (block.content?.className as string) || "";

  const className = [
    "wp-block-heading",
    textAlign ? `has-text-align-${textAlign}` : "",
    extraClass || "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Tag id={anchor} className={className} style={block.styles}>
      {textContent}
    </Tag>
  );
}

function HeadingSettings({ block, onUpdate }: { block: HeadingBlockConfig; onUpdate: (updates: Partial<BlockConfig>) => void }) {
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
      <CollapsibleCard title="Content" icon={Type} defaultOpen={true}>
        <div>
          <Label htmlFor="heading-text" className="text-sm font-medium text-gray-700">Heading Text</Label>
<Input
             id="heading-text"
             aria-label="Heading text"
             value={block.content?.kind === 'text' ? block.content.value : ''}
             onChange={(e) => updateContent({ kind: 'text', value: e.target.value })}
             placeholder="Enter heading text"
             className="mt-1 h-9"
           />
        </div>
      </CollapsibleCard>
      
      <CollapsibleCard title="Settings" icon={Settings} defaultOpen={true}>
        <div className="space-y-3">
          <Label className="text-sm font-medium text-gray-700">Heading Level</Label>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5, 6].map((level) => (
<button
                 key={level}
                 onClick={() => updateContent({ level })}
                 className={`h-9 px-3 text-sm font-semibold rounded-md transition-all ${
                   (block.content?.level || 2) === level
                     ? "bg-gray-200 text-gray-800 hover:bg-gray-300" 
                     : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                 }`}
                 aria-label={`Heading level ${level}`}
               >
                 H{level}
               </button>
            ))}
          </div>
        </div>
      </CollapsibleCard>
      
      <CollapsibleCard title="Alignment" icon={AlignLeft} defaultOpen={false}>
        <div className="space-y-3">
          <Label className="text-sm font-medium text-gray-700">Text Alignment</Label>
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'left', label: 'Left' },
              { value: 'center', label: 'Center' },
              { value: 'right', label: 'Right' },
              { value: 'justify', label: 'Justify' }
          ].map((align) => (
<button
               key={align.value}
               onClick={() => updateContent({ textAlign: align.value })}
                className={`h-9 px-3 text-xs font-medium rounded-md transition-all ${
                  (block.content?.textAlign || 'left') === align.value
                    ? "bg-gray-200 text-gray-800 hover:bg-gray-300" 
                    : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                }`}
                aria-label={`Text align ${align.label}`}
             >
               {align.label}
             </button>
           ))}
          </div>
        </div>
      </CollapsibleCard>
      
      <CollapsibleCard title="Advanced" icon={Settings} defaultOpen={false}>
        <div className="space-y-4">
          <div>
            <Label htmlFor="heading-anchor" className="text-sm font-medium text-gray-700">Anchor ID</Label>
<Input
               id="heading-anchor"
               aria-label="Anchor ID"
               value={block.content?.anchor || ''}
               onChange={(e) => updateContent({ anchor: e.target.value })}
               placeholder="Add an anchor (without #)"
               className="mt-1 h-9 text-sm"
             />
          </div>
          
          <div>
            <Label htmlFor="heading-class" className="text-sm font-medium text-gray-700">CSS Classes</Label>
<Input
               id="heading-class"
               aria-label="CSS Classes"
               value={block.content?.className || ''}
               onChange={(e) => updateContent({ className: e.target.value })}
               placeholder="e.g. my-custom-heading"
               className="mt-1 h-9 text-sm"
             />
          </div>
        </div>
      </CollapsibleCard>
    </div>
  );
}

export const HeadingBlock: BlockDefinition = {
  id: 'core/heading',
  label: 'Heading',
  icon: Heading1,
  description: 'Add a heading text',
  category: 'basic',
  defaultContent: {
    kind: 'text',
    value: 'Your heading here',
    level: 2,
    textAlign: 'left',
    anchor: '',
    className: '',
  },
  defaultStyles: {
    fontSize: '2rem',
    fontWeight: 'bold',
    margin: '1rem 0'
  },
  renderer: HeadingRenderer,
  settings: HeadingSettings,
  hasSettings: true
};

export default HeadingBlock;
