import React, { useState } from "react";
import type { BlockConfig } from "@shared/schema-types";
import type { BlockDefinition } from "../types.ts";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import MediaPickerDialog from "@/components/media/MediaPickerDialog";
import { CollapsibleCard } from "@/components/ui/collapsible-card";
import { Image as ImageIcon, AlignLeft, AlignCenter, AlignRight, Maximize, Settings, Link, Wrench } from "lucide-react";

interface ImageBlockContent {
  url?: string;
  src?: string;
  alt?: string;
  caption?: string;
  align?: 'left' | 'center' | 'right' | 'wide' | 'full' | '';
  sizeSlug?: 'thumbnail' | 'medium' | 'large' | 'full';
  className?: string;
  linkDestination?: 'none' | 'media' | 'attachment' | 'custom';
  href?: string;
  linkTarget?: '_self' | '_blank';
  target?: string;
  rel?: string;
  title?: string;
  id?: number;
}

interface ImageBlockConfig extends Omit<BlockConfig, 'content'> {
  content?: ImageBlockContent;
}

function ImageRenderer({ block }: { block: ImageBlockConfig; isPreview: boolean }): JSX.Element | null {
  const url = (block.content?.url as string) || (block.content?.src as string);
  const alt = block.content?.alt as string | undefined;
  const caption = block.content?.caption as string | undefined;
  const align = block.content?.align as string | undefined;
  const sizeSlug = block.content?.sizeSlug as string | undefined;
  const className = block.content?.className as string | undefined;
  const linkDestination = (block.content?.linkDestination as string | undefined) || 'none';
  const href = block.content?.href as string | undefined;
  const linkTarget = (block.content?.linkTarget as string | undefined) || (block.content?.target as string | undefined);
  const rel = block.content?.rel as string | undefined;
  const title = block.content?.title as string | undefined;

  if (!url) return null;

  const wrapperClasses = [
    'wp-block-image',
    sizeSlug ? `size-${sizeSlug}` : '',
    align ? `align${align}` : '',
    (block.styles?.width || block.styles?.height) ? 'is-resized' : '',
    className || '',
  ].filter(Boolean).join(' ');

  const imgEl = (
    <img
      src={url}
      alt={alt}
      style={{ ...block.styles }}
    />
  );

  const linkHref = linkDestination === 'custom' && href
    ? href
    : linkDestination === 'media'
    ? url
    : undefined;

  const content = linkHref ? (
    <a href={linkHref} target={linkTarget} rel={rel} title={title}>
      {imgEl}
    </a>
  ) : imgEl;

  return (
    <figure className={wrapperClasses} style={{ padding: block.styles?.padding, margin: block.styles?.margin }}>
      {content}
      {caption ? (
        <figcaption className="wp-element-caption">{caption}</figcaption>
      ) : null}
    </figure>
  );
}

function ImageSettings({ block, onUpdate }: { block: ImageBlockConfig; onUpdate: (updates: Partial<BlockConfig>) => void }) {
  const [isPickerOpen, setPickerOpen] = useState(false);

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

  const alignmentOptions = [
    { value: '', label: 'Default', icon: AlignCenter },
    { value: 'left', label: 'Left', icon: AlignLeft },
    { value: 'center', label: 'Center', icon: AlignCenter },
    { value: 'right', label: 'Right', icon: AlignRight },
    { value: 'wide', label: 'Wide', icon: Maximize },
    { value: 'full', label: 'Full', icon: Maximize }
  ];

  const sizeOptions = [
    { value: 'thumbnail', label: 'Thumbnail' },
    { value: 'medium', label: 'Medium' },
    { value: 'large', label: 'Large' },
    { value: 'full', label: 'Full' }
  ];

  const currentAlign = block.content?.align || '';
  const currentSize = block.content?.sizeSlug || 'full';

  return (
    <div className="space-y-4">
      <CollapsibleCard
        title="Content"
        icon={ImageIcon}
        defaultOpen={true}
      >
        <div className="space-y-4">
          {/* Image Preview */}
          <div>
            <Label>Preview</Label>
            <div className="mt-2 inline-block border border-dashed border-gray-300 p-2 rounded-lg" style={{ maxWidth: '100%' }}>
              <img
                src={block.content?.url || block.content?.src || ''}
                alt={block.content?.alt || ''}
                style={{ width: '240px', height: 'auto', display: 'block' }}
              />
            </div>
          </div>

          {/* Image URL */}
          <div>
            <Label htmlFor="image-src">Image URL</Label>
            <div className="flex items-center gap-2">
              <Input
                id="image-src"
                value={block.content?.url || block.content?.src || ''}
                onChange={(e) => updateContent({ url: e.target.value, src: undefined })}
                placeholder="https://example.com/image.jpg"
              />
              <Button type="button" variant="outline" onClick={() => setPickerOpen(true)}>Choose from library</Button>
            </div>
            <MediaPickerDialog
              open={isPickerOpen}
              onOpenChange={setPickerOpen}
              kind="image"
              onSelect={(m) => {
                updateContent({
                  id: m.id,
                  url: m.url,
                  src: undefined,
                  alt: (block.content as any)?.alt || m.alt || m.originalName || m.filename,
                  caption: (block.content as any)?.caption,
                });
              }}
            />
          </div>

          {/* Alt Text */}
          <div>
            <Label htmlFor="image-alt">Alt Text</Label>
            <Input
              id="image-alt"
              aria-label="Alt text"
              className="h-9"
              value={block.content?.alt || ''}
              onChange={(e) => updateContent({ alt: e.target.value })}
              placeholder="Image description"
            />
          </div>

          {/* Caption */}
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
      </CollapsibleCard>

      <CollapsibleCard
        title="Settings"
        icon={Settings}
        defaultOpen={true}
      >
        <div className="space-y-4">
          {/* Alignment */}
          <div>
            <Label>Alignment</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {alignmentOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    onClick={() => updateContent({ align: option.value })}
                    className={`flex items-center gap-2 p-3 h-9 text-sm font-medium rounded-lg border transition-colors ${
                      currentAlign === option.value
                        ? 'bg-gray-200 text-gray-800 border-gray-200 hover:bg-gray-300'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
                    aria-label={`Image align ${option.label}`}
                  >
                    <Icon className="w-4 h-4" />
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Image Size */}
          <div>
            <Label>Image Size</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {sizeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => updateContent({ sizeSlug: option.value })}
                  className={`flex items-center justify-center p-3 text-sm font-medium rounded-lg border transition-colors ${
                    currentSize === option.value
                      ? 'bg-gray-200 text-gray-800 border-gray-200 hover:bg-gray-300'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Dimensions */}
          <div>
            <Label>Dimensions</Label>
            <div className="grid grid-cols-2 gap-3 mt-2">
              <div>
                <Label htmlFor="img-width" className="text-sm text-gray-600">Width</Label>
<Input
                   id="img-width"
                   aria-label="Image width"
                   className="h-9"
                   value={block.styles?.width || ''}
                   onChange={(e) => updateStyles({ width: e.target.value })}
                   placeholder="e.g. 300px or 50%"
                 />
              </div>
              <div>
                <Label htmlFor="img-height" className="text-sm text-gray-600">Height</Label>
<Input
                 id="img-height"
                 aria-label="Image height"
                 className="h-9"
                 value={block.styles?.height || ''}
                 onChange={(e) => updateStyles({ height: e.target.value })}
                 placeholder="e.g. 200px or auto"
               />
              </div>
              <div>
                <Label htmlFor="img-max-width" className="text-sm text-gray-600">Max Width</Label>
                <Input
                  id="img-max-width"
                  value={block.styles?.maxWidth || ''}
                  onChange={(e) => updateStyles({ maxWidth: e.target.value })}
                  placeholder="e.g. 100% or 800px"
                />
              </div>
              <div>
                <Label htmlFor="img-max-height" className="text-sm text-gray-600">Max Height</Label>
<Input
                 id="img-max-height"
                 aria-label="Image max height"
                 className="h-9"
                 value={block.styles?.maxHeight || ''}
                 onChange={(e) => updateStyles({ maxHeight: e.target.value })}
                 placeholder="e.g. none or 600px"
               />
              </div>
            </div>
          </div>

          {/* Object Fit */}
          <div>
            <Label htmlFor="img-fit-select">Object Fit</Label>
            <Select
              value={block.styles?.objectFit || 'contain'}
              onValueChange={(value) => updateStyles({ objectFit: value })}
            >
              <SelectTrigger id="img-fit-select" aria-label="Object fit">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="contain">Contain</SelectItem>
                <SelectItem value="cover">Cover</SelectItem>
                <SelectItem value="fill">Fill</SelectItem>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="scale-down">Scale Down</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CollapsibleCard>

      <CollapsibleCard
        title="Link Settings"
        icon={Link}
        defaultOpen={false}
      >
        <div className="space-y-4">
          {/* Link Destination */}
          <div>
            <Label htmlFor="image-link-destination-select">Link To</Label>
            <Select
              value={block.content?.linkDestination || 'none'}
              onValueChange={(value) => updateContent({ linkDestination: value })}
            >
              <SelectTrigger id="image-link-destination-select" aria-label="Link destination">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="media">Media File</SelectItem>
                <SelectItem value="attachment">Attachment Page</SelectItem>
                <SelectItem value="custom">Custom URL</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Custom Link URL */}
          {(block.content?.linkDestination === 'custom') && (
            <div>
              <Label htmlFor="image-link-url">Custom Link URL</Label>
              <Input
                id="image-link-url"
                value={block.content?.href || ''}
                onChange={(e) => updateContent({ href: e.target.value })}
                placeholder="https://example.com"
              />
            </div>
          )}

          {/* Link Target */}
          <div>
            <Label htmlFor="image-link-target-select">Link Target</Label>
            <Select
              value={(block.content?.linkTarget || block.content?.target || '_self')}
              onValueChange={(value) => updateContent({ linkTarget: value, target: undefined })}
            >
              <SelectTrigger id="image-link-target-select" aria-label="Link target">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_self">Same Window</SelectItem>
                <SelectItem value="_blank">New Window</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CollapsibleCard>

      <CollapsibleCard
        title="Advanced"
        icon={Wrench}
        defaultOpen={false}
      >
        <div className="space-y-4">
          {/* Rel */}
          <div>
            <Label htmlFor="image-rel">Rel</Label>
            <Input
              id="image-rel"
              value={block.content?.rel || ''}
              onChange={(e) => updateContent({ rel: e.target.value })}
              placeholder="noopener noreferrer"
            />
          </div>

          {/* Title */}
          <div>
            <Label htmlFor="image-title">Title</Label>
            <Input
              id="image-title"
              aria-label="Title"
              className="h-9"
              value={block.content?.title || ''}
              onChange={(e) => updateContent({ title: e.target.value })}
              placeholder="Image title"
            />
          </div>

          {/* Additional CSS Class */}
          <div>
            <Label htmlFor="image-class">Additional CSS Class(es)</Label>
            <Input
              id="image-class"
              aria-label="Additional CSS classes"
              className="h-9"
              value={block.content?.className || ''}
              onChange={(e) => updateContent({ className: e.target.value })}
              placeholder="e.g. custom-class"
            />
          </div>
        </div>
      </CollapsibleCard>
    </div>
  );
}

const ImageBlock: BlockDefinition = {
  id: 'core/image',
  name: 'Image',
  icon: ImageIcon,
  description: 'Add an image',
  category: 'media',
  defaultContent: {
    url: 'https://via.placeholder.com/600x300?text=Add+Your+Image',
    alt: 'Placeholder image',
    caption: '',
    id: undefined,
    sizeSlug: 'full',
    align: '',
    linkDestination: 'none',
    href: '',
    linkTarget: '_self',
    rel: '',
    title: '',
    className: '',
  },
  defaultStyles: {
    width: '100%',
    height: 'auto',
  },
  renderer: ImageRenderer as any,
  settings: ImageSettings as any,
  hasSettings: true,
};

export default ImageBlock;

