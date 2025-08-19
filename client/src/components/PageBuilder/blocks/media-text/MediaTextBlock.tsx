import React from "react";
import type { BlockConfig } from "@shared/schema";
import type { BlockDefinition } from "../types.ts";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Image as ImageIcon } from "lucide-react";

function MediaTextRenderer({ block }: { block: BlockConfig; isPreview: boolean }) {
  const {
    mediaUrl,
    mediaAlt,
    mediaPosition = 'left',
    mediaWidth = 50,
    isStackedOnMobile = false,
    imageFill = false,
    verticalAlignment = 'center',
    href,
    linkTarget,
    rel,
    title,
    className,
    anchor,
  } = (block.content || {}) as any;

  const wrapperClasses = [
    'wp-block-media-text',
    mediaPosition === 'right' ? 'has-media-on-the-right' : '',
    isStackedOnMobile ? 'is-stacked-on-mobile' : '',
    imageFill ? 'is-image-fill' : '',
    className || '',
  ]
    .filter(Boolean)
    .join(' ');

  const alignItems = verticalAlignment === 'top' ? 'flex-start' : verticalAlignment === 'bottom' ? 'flex-end' : 'center';

  const mediaStyle: React.CSSProperties = imageFill
    ? { backgroundImage: mediaUrl ? `url(${mediaUrl})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center' }
    : {};

  const mediaInner = imageFill ? null : (
    mediaUrl ? <img src={mediaUrl} alt={mediaAlt || ''} /> : null
  );

  const mediaContent = href ? (
    <a href={href} target={linkTarget} rel={rel} title={title} className="wp-block-media-text__media" style={{ ...mediaStyle, flexBasis: `${mediaWidth}%` }}>
      {mediaInner}
    </a>
  ) : (
    <div className="wp-block-media-text__media" style={{ ...mediaStyle, flexBasis: `${mediaWidth}%` }}>
      {mediaInner}
    </div>
  );

  return (
    <div id={anchor} className={wrapperClasses} style={{ ...block.styles, display: 'flex', gap: '20px', alignItems }}>
      {mediaPosition === 'left' ? (
        <>
          {mediaContent}
          <div className="wp-block-media-text__content" style={{ flexBasis: `${100 - (mediaWidth || 50)}%` }} dangerouslySetInnerHTML={{ __html: (block.content as any)?.content || '<p>Add text…</p>' }} />
        </>
      ) : (
        <>
          <div className="wp-block-media-text__content" style={{ flexBasis: `${100 - (mediaWidth || 50)}%` }} dangerouslySetInnerHTML={{ __html: (block.content as any)?.content || '<p>Add text…</p>' }} />
          {mediaContent}
        </>
      )}
    </div>
  );
}

function MediaTextSettings({ block, onUpdate }: { block: BlockConfig; onUpdate: (updates: Partial<BlockConfig>) => void }) {
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
        <Label htmlFor="media-url">Media URL</Label>
        <Input
          id="media-url"
          value={(block.content as any)?.mediaUrl || ''}
          onChange={(e) => updateContent({ mediaUrl: e.target.value })}
          placeholder="https://example.com/image-or-video.jpg"
        />
      </div>
      <div>
        <Label htmlFor="media-alt">Alt Text</Label>
        <Input
          id="media-alt"
          value={(block.content as any)?.mediaAlt || ''}
          onChange={(e) => updateContent({ mediaAlt: e.target.value })}
          placeholder="Describe the media"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="media-position">Media Position</Label>
          <Select
            value={(block.content as any)?.mediaPosition || 'left'}
            onValueChange={(value) => updateContent({ mediaPosition: value })}
          >
            <SelectTrigger id="media-position">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="left">Left</SelectItem>
              <SelectItem value="right">Right</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="media-width">Media Width (%)</Label>
          <Input
            id="media-width"
            type="number"
            min={0}
            max={100}
            value={(block.content as any)?.mediaWidth ?? 50}
            onChange={(e) => updateContent({ mediaWidth: Number(e.target.value) })}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="stacked-mobile">Stack on mobile</Label>
          <Switch
            id="stacked-mobile"
            checked={Boolean((block.content as any)?.isStackedOnMobile)}
            onCheckedChange={(checked) => updateContent({ isStackedOnMobile: checked })}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="image-fill">Image fill</Label>
          <Switch
            id="image-fill"
            checked={Boolean((block.content as any)?.imageFill)}
            onCheckedChange={(checked) => updateContent({ imageFill: checked })}
          />
        </div>
      </div>
      <div>
        <Label htmlFor="vertical-align">Vertical alignment</Label>
        <Select
          value={(block.content as any)?.verticalAlignment || 'center'}
          onValueChange={(value) => updateContent({ verticalAlignment: value })}
        >
          <SelectTrigger id="vertical-align">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="top">Top</SelectItem>
            <SelectItem value="center">Center</SelectItem>
            <SelectItem value="bottom">Bottom</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="media-link">Media Link</Label>
          <Input
            id="media-link"
            value={(block.content as any)?.href || ''}
            onChange={(e) => updateContent({ href: e.target.value })}
            placeholder="https://example.com"
          />
        </div>
        <div>
          <Label htmlFor="media-target">Link Target</Label>
          <Select
            value={(block.content as any)?.linkTarget || '_self'}
            onValueChange={(value) => updateContent({ linkTarget: value })}
          >
            <SelectTrigger id="media-target">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_self">Same Window</SelectItem>
              <SelectItem value="_blank">New Window</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="media-rel">Rel</Label>
          <Input
            id="media-rel"
            value={(block.content as any)?.rel || ''}
            onChange={(e) => updateContent({ rel: e.target.value })}
            placeholder="noopener noreferrer"
          />
        </div>
        <div>
          <Label htmlFor="media-title">Title</Label>
          <Input
            id="media-title"
            value={(block.content as any)?.title || ''}
            onChange={(e) => updateContent({ title: e.target.value })}
            placeholder="Media title"
          />
        </div>
      </div>
      <div>
        <Label htmlFor="text-content">Text Content (HTML)</Label>
        <Textarea
          id="text-content"
          value={(block.content as any)?.content || ''}
          onChange={(e) => updateContent({ content: e.target.value })}
          placeholder="<p>Add your content…</p>"
          rows={4}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="anchor">Anchor</Label>
          <Input
            id="anchor"
            value={(block.content as any)?.anchor || ''}
            onChange={(e) => updateContent({ anchor: e.target.value })}
            placeholder="section-id"
          />
        </div>
        <div>
          <Label htmlFor="extra-class">Additional CSS Class(es)</Label>
          <Input
            id="extra-class"
            value={(block.content as any)?.className || ''}
            onChange={(e) => updateContent({ className: e.target.value })}
            placeholder="custom-class is-style-something"
          />
        </div>
      </div>
    </div>
  );
}

const MediaTextBlock: BlockDefinition = {
  id: 'core/media-text',
  name: 'Media & Text',
  icon: ImageIcon,
  description: 'Display media and text side by side',
  category: 'media',
  defaultContent: {
    mediaId: undefined,
    mediaUrl: 'https://via.placeholder.com/800x600?text=Media',
    mediaType: 'image',
    mediaAlt: '',
    mediaPosition: 'left',
    mediaWidth: 50,
    isStackedOnMobile: false,
    imageFill: false,
    verticalAlignment: 'center',
    href: '',
    linkTarget: '_self',
    rel: '',
    title: '',
    content: '<p>Add your content…</p>',
    anchor: '',
    className: '',
  },
  defaultStyles: {},
  renderer: MediaTextRenderer,
  settings: MediaTextSettings,
};

export default MediaTextBlock;


