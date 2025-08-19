import React, { useEffect, useRef, useState } from "react";
import type { BlockConfig } from "@shared/schema";
import type { BlockDefinition } from "../types.ts";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Image as ImageIcon } from "lucide-react";

function ImageRenderer({ block }: { block: BlockConfig; isPreview: boolean }) {
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

function ImageSettings({ block, onUpdate }: { block: BlockConfig; onUpdate: (updates: Partial<BlockConfig>) => void }) {
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

  // Simple resizer state
  const previewRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [startWidth, setStartWidth] = useState<number | null>(null);
  const [startHeight, setStartHeight] = useState<number | null>(null);
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;
    const onLoad = () => {
      if (img.naturalWidth && img.naturalHeight) {
        setAspectRatio(img.naturalWidth / img.naturalHeight);
      }
    };
    if (img.complete) {
      onLoad();
    } else {
      img.addEventListener('load', onLoad);
      return () => img.removeEventListener('load', onLoad);
    }
  }, [block.content?.url]);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      if (startWidth == null || startHeight == null) return;
      const dx = e.clientX - startX;
      const newWidth = Math.max(1, startWidth + dx);
      const newHeight = aspectRatio ? Math.max(1, Math.round(newWidth / aspectRatio)) : startHeight;
      (imgRef.current as any)?.style && ((imgRef.current as any).style.width = `${newWidth}px`);
      (imgRef.current as any)?.style && ((imgRef.current as any).style.height = `${newHeight}px`);
    };
    const onMouseUp = () => {
      if (!isResizing) return;
      setIsResizing(false);
      const img = imgRef.current;
      if (img) {
        const appliedWidth = img.style.width || '';
        const appliedHeight = img.style.height || '';
        updateStyles({ width: appliedWidth, height: appliedHeight });
      }
    };
    if (isResizing) {
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, [isResizing, startX, startY, startWidth, startHeight, aspectRatio]);

  return (
    <div className="space-y-4">
      {/* Preview with drag-to-resize */}
      <div>
        <Label>Preview & Resize</Label>
        <div
          ref={previewRef}
          className="relative mt-2 inline-block border border-dashed border-gray-300 p-2"
          style={{ maxWidth: '100%' }}
        >
          <img
            ref={imgRef}
            src={block.content?.url || block.content?.src || ''}
            alt={block.content?.alt || ''}
            style={{
              width: block.styles?.width || 'auto',
              height: block.styles?.height || 'auto',
              objectFit: block.styles?.objectFit || 'contain',
              display: 'block',
              maxWidth: block.styles?.maxWidth || '100%',
              maxHeight: block.styles?.maxHeight || 'none',
            }}
          />
          <div
            onMouseDown={(e) => {
              e.preventDefault();
              const img = imgRef.current;
              if (!img) return;
              setIsResizing(true);
              setStartX(e.clientX);
              setStartY(e.clientY);
              const currentWidth = img.getBoundingClientRect().width;
              const currentHeight = img.getBoundingClientRect().height;
              setStartWidth(Math.round(currentWidth));
              setStartHeight(Math.round(currentHeight));
            }}
            className="absolute bottom-2 right-2 w-3 h-3 bg-blue-500 cursor-se-resize rounded-sm"
            title="Drag to resize"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="image-src">Image URL</Label>
        <Input
          id="image-src"
          value={block.content?.url || block.content?.src || ''}
          onChange={(e) => updateContent({ url: e.target.value, src: undefined })}
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
      {/* Dimensions */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="img-width">Width</Label>
          <Input
            id="img-width"
            value={block.styles?.width || ''}
            onChange={(e) => updateStyles({ width: e.target.value })}
            placeholder="e.g. 300px or 50%"
          />
        </div>
        <div>
          <Label htmlFor="img-height">Height</Label>
          <Input
            id="img-height"
            value={block.styles?.height || ''}
            onChange={(e) => updateStyles({ height: e.target.value })}
            placeholder="e.g. 200px or auto"
          />
        </div>
        <div>
          <Label htmlFor="img-max-width">Max Width</Label>
          <Input
            id="img-max-width"
            value={block.styles?.maxWidth || ''}
            onChange={(e) => updateStyles({ maxWidth: e.target.value })}
            placeholder="e.g. 100% or 800px"
          />
        </div>
        <div>
          <Label htmlFor="img-max-height">Max Height</Label>
          <Input
            id="img-max-height"
            value={block.styles?.maxHeight || ''}
            onChange={(e) => updateStyles({ maxHeight: e.target.value })}
            placeholder="e.g. none or 600px"
          />
        </div>
      </div>

      {/* Fit */}
      <div>
        <Label htmlFor="img-fit">Object Fit</Label>
        <Select
          value={block.styles?.objectFit || 'contain'}
          onValueChange={(value) => updateStyles({ objectFit: value })}
        >
          <SelectTrigger>
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
      <div>
        <Label htmlFor="image-caption">Caption</Label>
        <Input
          id="image-caption"
          value={block.content?.caption || ''}
          onChange={(e) => updateContent({ caption: e.target.value })}
          placeholder="Image caption (optional)"
        />
      </div>
      <div>
        <Label htmlFor="image-align">Align</Label>
        <Select
          value={block.content?.align || 'none'}
          onValueChange={(value) => updateContent({ align: value === 'none' ? '' : value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Default</SelectItem>
            <SelectItem value="left">Left</SelectItem>
            <SelectItem value="center">Center</SelectItem>
            <SelectItem value="right">Right</SelectItem>
            <SelectItem value="wide">Wide</SelectItem>
            <SelectItem value="full">Full</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="image-size">Image Size</Label>
        <Select
          value={block.content?.sizeSlug || 'full'}
          onValueChange={(value) => updateContent({ sizeSlug: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="thumbnail">Thumbnail</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="large">Large</SelectItem>
            <SelectItem value="full">Full</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="image-link-destination">Link To</Label>
        <Select
          value={block.content?.linkDestination || 'none'}
          onValueChange={(value) => updateContent({ linkDestination: value })}
        >
          <SelectTrigger>
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
      <div>
        <Label htmlFor="image-link-target">Link Target</Label>
        <Select
          value={(block.content?.linkTarget || block.content?.target || '_self')}
          onValueChange={(value) => updateContent({ linkTarget: value, target: undefined })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_self">Same Window</SelectItem>
            <SelectItem value="_blank">New Window</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="image-rel">Rel</Label>
        <Input
          id="image-rel"
          value={block.content?.rel || ''}
          onChange={(e) => updateContent({ rel: e.target.value })}
          placeholder="noopener noreferrer"
        />
      </div>
      <div>
        <Label htmlFor="image-title">Title</Label>
        <Input
          id="image-title"
          value={block.content?.title || ''}
          onChange={(e) => updateContent({ title: e.target.value })}
          placeholder="Image title"
        />
      </div>
      <div>
        <Label htmlFor="image-class">Additional CSS Class(es)</Label>
        <Input
          id="image-class"
          value={block.content?.className || ''}
          onChange={(e) => updateContent({ className: e.target.value })}
          placeholder="e.g. custom-class"
        />
      </div>
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
  renderer: ImageRenderer,
  settings: ImageSettings,
};

export default ImageBlock;

