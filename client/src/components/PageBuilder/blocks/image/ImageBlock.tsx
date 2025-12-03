import React, { useState, useEffect, useRef } from "react";
import type { BlockConfig, BlockContent } from "@shared/schema-types";
import type { BlockDefinition, BlockComponentProps } from "../types.ts";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import MediaPickerDialog from "@/components/media/MediaPickerDialog";
import { CollapsibleCard } from "@/components/ui/collapsible-card";
import { Image as ImageIcon, AlignLeft, AlignCenter, AlignRight, Maximize, Settings, Link, Wrench } from "lucide-react";
import {
  registerBlockState,
  unregisterBlockState,
  getBlockStateAccessor,
  type BlockStateAccessor,
} from "../blockStateRegistry";

// ============================================================================
// TYPES
// ============================================================================

type ImageContent = BlockContent & {
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
};

const DEFAULT_CONTENT: ImageContent = {
  kind: 'media',
  url: 'https://via.placeholder.com/600x300?text=Add+Your+Image',
  mediaType: 'image',
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
};

// ============================================================================
// RENDERER
// ============================================================================

interface ImageRendererProps {
  content: ImageContent;
  styles?: React.CSSProperties;
}

function ImageRenderer({ content, styles }: ImageRendererProps): JSX.Element | null {
  const url = content?.kind === 'media' && content.mediaType === 'image'
    ? content.url
    : '';
  const alt = content?.alt as string | undefined;
  const caption = content?.caption as string | undefined;
  const align = content?.align as string | undefined;
  const sizeSlug = content?.sizeSlug as string | undefined;
  const className = content?.className as string | undefined;
  const linkDestination = (content?.linkDestination as string | undefined) || 'none';
  const href = content?.href as string | undefined;
  const linkTarget = (content?.linkTarget as string | undefined) || (content?.target as string | undefined);
  const rel = content?.rel as string | undefined;
  const title = content?.title as string | undefined;

  if (!url) return null;

  const wrapperClasses = [
    'wp-block-image',
    sizeSlug ? `size-${sizeSlug}` : '',
    align ? `align${align}` : '',
    (styles?.width || styles?.height) ? 'is-resized' : '',
    className || '',
  ].filter(Boolean).join(' ');

  const imgEl = (
    <img
      src={url}
      alt={alt}
      style={{ ...styles }}
    />
  );

  const linkHref = linkDestination === 'custom' && href
    ? href
    : linkDestination === 'media'
    ? url
    : undefined;

  const contentEl = linkHref ? (
    <a href={linkHref} target={linkTarget} rel={rel} title={title}>
      {imgEl}
    </a>
  ) : imgEl;

  return (
    <figure className={wrapperClasses} style={{ padding: styles?.padding, margin: styles?.margin }}>
      {contentEl}
      {caption ? (
        <figcaption className="wp-element-caption">{caption}</figcaption>
      ) : null}
    </figure>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ImageBlockComponent({
  value,
  onChange,
}: BlockComponentProps) {
  // State
  const [content, setContent] = useState<ImageContent>(() => {
    return (value.content as ImageContent) || DEFAULT_CONTENT;
  });
  const [styles, setStyles] = useState<React.CSSProperties | undefined>(
    () => value.styles
  );

  // Sync with props when block ID changes OR when content/styles change significantly
  // This prevents syncing to default values when parent state resets
  const lastSyncedBlockIdRef = useRef<string | null>(null);
  const lastSyncedContentRef = useRef<string | null>(null);
  const lastSyncedStylesRef = useRef<string | null>(null);
  const isSyncingFromPropsRef = useRef(false);
  
  useEffect(() => {
    const contentKey = JSON.stringify(value.content);
    const stylesKey = JSON.stringify(value.styles);
    
    // Sync if ID changed OR if content/styles changed significantly (not just reference)
    if (
      lastSyncedBlockIdRef.current !== value.id ||
      (lastSyncedBlockIdRef.current === value.id && 
       (lastSyncedContentRef.current !== contentKey || lastSyncedStylesRef.current !== stylesKey))
    ) {
      lastSyncedBlockIdRef.current = value.id;
      lastSyncedContentRef.current = contentKey;
      lastSyncedStylesRef.current = stylesKey;
      
      // Mark that we're syncing from props to prevent onChange loop
      isSyncingFromPropsRef.current = true;
      
      // Only sync if props have actual content, not defaults
      // This prevents syncing to defaults when parent state resets
      if (value.content && Object.keys(value.content).length > 0) {
        const newContent = (value.content as ImageContent) || DEFAULT_CONTENT;
        setContent(newContent);
      }
      if (value.styles && Object.keys(value.styles).length > 0) {
        setStyles(value.styles);
      }
      
      // Reset flag after state updates
      setTimeout(() => {
        isSyncingFromPropsRef.current = false;
      }, 0);
    }
  }, [value.id, value.content, value.styles]);

  // Register state accessors for settings
  useEffect(() => {
    const accessor: BlockStateAccessor = {
      getContent: () => content,
      getStyles: () => styles,
      setContent: setContent,
      setStyles: setStyles,
      getFullState: () => ({
        ...value,
        content: content as BlockContent,
        styles,
      }),
    };
    registerBlockState(value.id, accessor);
    return () => unregisterBlockState(value.id);
  }, [value.id, content, styles, value]);

  // Immediate onChange to notify parent (parent handles debouncing for localStorage)
  // Skip if we're syncing from props to prevent infinite loop
  useEffect(() => {
    if (!isSyncingFromPropsRef.current) {
      onChange({
        ...value,
        content: content as BlockContent,
        styles,
      });
    }
  }, [content, styles, value, onChange]);

  return <ImageRenderer content={content} styles={styles} />;
}

// ============================================================================
// SETTINGS COMPONENT
// ============================================================================

interface ImageSettingsProps {
  block: BlockConfig;
  onUpdate?: (updates: Partial<BlockConfig>) => void;
}

function ImageSettings({ block, onUpdate }: ImageSettingsProps) {
  const accessor = getBlockStateAccessor(block.id);
  const [, setUpdateTrigger] = React.useState(0);
  const [isPickerOpen, setPickerOpen] = useState(false);

  // Get current state
  const content = accessor
    ? (accessor.getContent() as ImageContent)
    : (block.content as ImageContent) || DEFAULT_CONTENT;
  const styles = accessor
    ? accessor.getStyles()
    : block.styles;

  // Update handlers
  const updateContent = (updates: Partial<ImageContent>) => {
    if (accessor) {
      const current = accessor.getContent() as ImageContent;
      accessor.setContent({ ...current, ...updates } as ImageContent);
      setUpdateTrigger((prev) => prev + 1);
    } else if (onUpdate) {
      onUpdate({
        content: {
          ...block.content,
          ...updates,
        } as BlockContent,
      });
    }
  };

  const updateStyles = (styleUpdates: Partial<React.CSSProperties>) => {
    if (accessor) {
      const current = accessor.getStyles() || {};
      accessor.setStyles({ ...current, ...styleUpdates });
      setUpdateTrigger((prev) => prev + 1);
    } else if (onUpdate) {
      onUpdate({
        styles: {
          ...block.styles,
          ...styleUpdates,
        },
      });
    }
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

  const currentAlign = content?.align || '';
  const currentSize = content?.sizeSlug || 'full';
  const imageUrl = content?.kind === 'media' ? content.url : '';

  return (
    <div className="space-y-4">
      <CollapsibleCard
        title="Content"
        icon={ImageIcon}
        defaultOpen={true}
      >
        <div className="space-y-4">
          {/* Image Preview */}
          {imageUrl && (
            <div>
              <Label>Preview</Label>
              <div className="mt-2 inline-block border border-dashed border-gray-300 p-2 rounded-lg" style={{ maxWidth: '100%' }}>
                <img
                  src={imageUrl}
                  alt={content?.alt || ''}
                  style={{ width: '240px', height: 'auto', display: 'block' }}
                />
              </div>
            </div>
          )}

          {/* Image URL */}
          <div>
            <Label htmlFor="image-src">Image URL</Label>
            <div className="flex items-center gap-2">
              <Input
                id="image-src"
                value={imageUrl}
                onChange={(e) => updateContent({ kind: 'media', mediaType: 'image', url: e.target.value } as ImageContent)}
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
                  kind: 'media',
                  mediaType: 'image',
                  id: m.id,
                  url: m.url,
                  alt: content?.alt || m.alt || m.originalName || m.filename,
                  caption: content?.caption,
                } as ImageContent);
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
              value={content?.alt || ''}
              onChange={(e) => updateContent({ alt: e.target.value } as ImageContent)}
              placeholder="Image description"
            />
          </div>

          {/* Caption */}
          <div>
            <Label htmlFor="image-caption">Caption</Label>
            <Input
              id="image-caption"
              value={content?.caption || ''}
              onChange={(e) => updateContent({ caption: e.target.value } as ImageContent)}
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
                    onClick={() => updateContent({ align: option.value as any })}
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
                  onClick={() => updateContent({ sizeSlug: option.value as any })}
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
                  value={styles?.width || ''}
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
                  value={styles?.height || ''}
                  onChange={(e) => updateStyles({ height: e.target.value })}
                  placeholder="e.g. 200px or auto"
                />
              </div>
              <div>
                <Label htmlFor="img-max-width" className="text-sm text-gray-600">Max Width</Label>
                <Input
                  id="img-max-width"
                  value={styles?.maxWidth || ''}
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
                  value={styles?.maxHeight || ''}
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
              value={styles?.objectFit || 'contain'}
              onValueChange={(value) => updateStyles({ objectFit: value as any })}
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
              value={content?.linkDestination || 'none'}
              onValueChange={(value) => updateContent({ linkDestination: value as any })}
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
          {(content?.linkDestination === 'custom') && (
            <div>
              <Label htmlFor="image-link-url">Custom Link URL</Label>
              <Input
                id="image-link-url"
                value={content?.href || ''}
                onChange={(e) => updateContent({ href: e.target.value })}
                placeholder="https://example.com"
              />
            </div>
          )}

          {/* Link Target */}
          <div>
            <Label htmlFor="image-link-target-select">Link Target</Label>
            <Select
              value={(content?.linkTarget || content?.target || '_self')}
              onValueChange={(value) => updateContent({ linkTarget: value as any, target: undefined })}
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
              value={content?.rel || ''}
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
              value={content?.title || ''}
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
              value={content?.className || ''}
              onChange={(e) => updateContent({ className: e.target.value })}
              placeholder="e.g. custom-class"
            />
          </div>
        </div>
      </CollapsibleCard>
    </div>
  );
}

// ============================================================================
// LEGACY RENDERER (Backward Compatibility)
// ============================================================================

function LegacyImageRenderer({
  block,
}: {
  block: BlockConfig;
  isPreview: boolean;
}) {
  return (
    <ImageRenderer
      content={(block.content as ImageContent) || DEFAULT_CONTENT}
      styles={block.styles}
    />
  );
}

// ============================================================================
// BLOCK DEFINITION
// ============================================================================

const ImageBlock: BlockDefinition = {
  id: 'core/image',
  label: 'Image',
  icon: ImageIcon,
  description: 'Add an image',
  category: 'media',
  defaultContent: {
    kind: 'media',
    url: 'https://via.placeholder.com/600x300?text=Add+Your+Image',
    mediaType: 'image',
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
  component: ImageBlockComponent,
  renderer: LegacyImageRenderer,
  settings: ImageSettings,
  hasSettings: true,
};

export default ImageBlock;
