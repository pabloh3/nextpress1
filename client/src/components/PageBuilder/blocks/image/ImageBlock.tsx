import React from "react";
import type { BlockConfig } from "@shared/schema";
import type { BlockDefinition } from "../types.ts";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Image as ImageIcon } from "lucide-react";

function ImageRenderer({ block }: { block: BlockConfig; isPreview: boolean }) {
  return (
    <div style={{ padding: block.styles?.padding, margin: block.styles?.margin }}>
      <img
        src={block.content?.src}
        alt={block.content?.alt}
        style={{
          ...block.styles,
          padding: 0,
          margin: 0,
        }}
      />
      {block.content?.caption && (
        <p className="text-sm text-gray-600 mt-2 text-center">
          {block.content.caption}
        </p>
      )}
    </div>
  );
}

function ImageSettings({ block, onUpdate }: { block: BlockConfig; onUpdate: (updates: Partial<BlockConfig>) => void }) {
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
        <Label htmlFor="image-src">Image URL</Label>
        <Input
          id="image-src"
          value={block.content?.src || ''}
          onChange={(e) => updateContent({ src: e.target.value })}
          placeholder="https://example.com/image.jpg"
        />
      </div>
      <div>
        <Label htmlFor="image-alt">Alt Text</Label>
        <Input
          id="image-alt"
          value={block.content?.alt || ''}
          onChange={(e) => updateContent({ alt: e.target.value })}
          placeholder="Image description"
        />
      </div>
      <div>
        <Label htmlFor="image-caption">Caption</Label>
        <Input
          id="image-caption"
          value={block.content?.caption || ''}
          onChange={(e) => updateContent({ caption: e.target.value })}
          placeholder="Image caption (optional)"
        />
      </div>
    </div>
  );
}

const ImageBlock: BlockDefinition = {
  id: 'image',
  name: 'Image',
  icon: ImageIcon,
  description: 'Add an image',
  category: 'media',
  defaultContent: {
    src: 'https://via.placeholder.com/600x300?text=Add+Your+Image',
    alt: 'Placeholder image',
    caption: '',
  },
  defaultStyles: {
    width: '100%',
    height: 'auto',
  },
  renderer: ImageRenderer,
  settings: ImageSettings,
};

export default ImageBlock;

