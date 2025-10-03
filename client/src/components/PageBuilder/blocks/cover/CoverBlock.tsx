import React, { useState } from "react";
import type { BlockConfig } from "@shared/schema";
import type { BlockDefinition } from "../types.ts";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Square as CoverIcon } from "lucide-react";
import MediaPickerDialog from "@/components/media/MediaPickerDialog";
import { useBlockManager } from "@/hooks/useBlockManager";

function CoverRenderer({ block }: { block: BlockConfig; isPreview: boolean }) {
  const url = (block.content as any)?.url || '';
  const alt = (block.content as any)?.alt || '';
  const hasParallax = (block.content as any)?.hasParallax || false;
  const dimRatio = (block.content as any)?.dimRatio || 50;
  const overlayColor = (block.content as any)?.overlayColor || 'rgba(0,0,0,0.5)';
  const minHeight = (block.content as any)?.minHeight || 400;
  const contentPosition = (block.content as any)?.contentPosition || 'center center';
  const customOverlayColor = (block.content as any)?.customOverlayColor || '';
  const backgroundType = (block.content as any)?.backgroundType || 'image';
  const focalPoint = (block.content as any)?.focalPoint || { x: 0.5, y: 0.5 };
  
  // Inner content
  const innerContent = (block.content as any)?.innerContent || '<p>Write title…</p>';

  const className = [
    "wp-block-cover",
    hasParallax ? 'has-parallax' : '',
    backgroundType === 'video' ? 'has-background-video' : '',
    block.content?.className || "",
  ].filter(Boolean).join(" ");

  const overlayStyle = {
    backgroundColor: customOverlayColor || overlayColor,
    opacity: dimRatio / 100,
  };

  const backgroundImageStyle = url && backgroundType === 'image' ? {
    backgroundImage: `url(${url})`,
    backgroundPosition: `${focalPoint.x * 100}% ${focalPoint.y * 100}%`,
    backgroundSize: 'cover',
    backgroundRepeat: 'no-repeat',
    backgroundAttachment: hasParallax ? 'fixed' : 'scroll',
  } : {};

  const contentAlignment = (() => {
    const [vertical, horizontal] = contentPosition.split(' ');
    return {
      display: 'flex',
      alignItems: vertical === 'top' ? 'flex-start' : vertical === 'bottom' ? 'flex-end' : 'center',
      justifyContent: horizontal === 'left' ? 'flex-start' : horizontal === 'right' ? 'flex-end' : 'center',
    };
  })();

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        minHeight: `${minHeight}px`,
        overflow: 'hidden',
        ...backgroundImageStyle,
        ...block.styles,
      }}
    >
      {/* Background Video (if applicable) */}
      {backgroundType === 'video' && url && (
        <video
          autoPlay
          muted
          loop
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            zIndex: 1,
          }}
        >
          <source src={url} type="video/mp4" />
        </video>
      )}

      {/* Overlay */}
      <div
        className="wp-block-cover__background"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 2,
          ...overlayStyle,
        }}
      />

      {/* Content */}
      <div
        className="wp-block-cover__inner-container"
        style={{
          position: 'relative',
          zIndex: 3,
          width: '100%',
          height: '100%',
          padding: '1.25em 2.375em',
          color: 'white',
          ...contentAlignment,
        }}
      >
        <div
          className="cover-content"
          dangerouslySetInnerHTML={{ __html: innerContent }}
          style={{
            textAlign: contentPosition.includes('center') ? 'center' : 
                      contentPosition.includes('right') ? 'right' : 'left',
          }}
        />
      </div>
    </div>
  );
}

function CoverSettings({ block }: { block: BlockConfig }) {
  const [isPickerOpen, setPickerOpen] = useState(false);
  const { updateBlockContent, updateBlockStyles } = useBlockManager();

  const updateContent = (contentUpdates: any) => {
    updateBlockContent(block.id, contentUpdates);
  };

  const updateStyles = (styleUpdates: any) => {
    updateBlockStyles(block.id, styleUpdates);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="cover-content">Cover Content</Label>
        <Textarea
          id="cover-content"
          value={(block.content as any)?.innerContent || '<p>Write title…</p>'}
          onChange={(e) => updateContent({ innerContent: e.target.value })}
          placeholder="Enter your cover content (HTML allowed)"
          rows={4}
        />
      </div>

      <div>
        <Label htmlFor="cover-background-type">Background Type</Label>
        <Select
          value={(block.content as any)?.backgroundType || 'image'}
          onValueChange={(value) => updateContent({ backgroundType: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="image">Image</SelectItem>
            <SelectItem value="video">Video</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="cover-media">Background {(block.content as any)?.backgroundType === 'video' ? 'Video' : 'Image'}</Label>
        <div className="flex items-center gap-2">
          <Input
            id="cover-media"
            value={(block.content as any)?.url || ''}
            onChange={(e) => updateContent({ url: e.target.value })}
            placeholder={`https://example.com/${(block.content as any)?.backgroundType === 'video' ? 'video.mp4' : 'image.jpg'}`}
          />
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => setPickerOpen(true)}
          >
            Choose from library
          </Button>
        </div>
        <MediaPickerDialog
          open={isPickerOpen}
          onOpenChange={setPickerOpen}
          kind={(block.content as any)?.backgroundType === 'video' ? 'video' : 'image'}
          onSelect={(m) => {
            updateContent({
              url: m.url,
              alt: (block.content as any)?.alt || m.alt || m.originalName || m.filename,
            });
          }}
        />
      </div>

      {(block.content as any)?.backgroundType === 'image' && (
        <>
          <div>
            <Label htmlFor="cover-alt">Alt Text</Label>
            <Input
              id="cover-alt"
              value={(block.content as any)?.alt || ''}
              onChange={(e) => updateContent({ alt: e.target.value })}
              placeholder="Background image description"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="cover-parallax">Fixed Background</Label>
            <Switch
              id="cover-parallax"
              checked={(block.content as any)?.hasParallax || false}
              onCheckedChange={(checked) => updateContent({ hasParallax: checked })}
            />
          </div>
        </>
      )}

      <div>
        <Label htmlFor="cover-min-height">Minimum Height (px)</Label>
        <Input
          id="cover-min-height"
          type="number"
          value={(block.content as any)?.minHeight || 400}
          onChange={(e) => updateContent({ minHeight: parseInt(e.target.value) || 400 })}
        />
      </div>

      <div>
        <Label htmlFor="cover-content-position">Content Position</Label>
        <Select
          value={(block.content as any)?.contentPosition || 'center center'}
          onValueChange={(value) => updateContent({ contentPosition: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="top left">Top Left</SelectItem>
            <SelectItem value="top center">Top Center</SelectItem>
            <SelectItem value="top right">Top Right</SelectItem>
            <SelectItem value="center left">Center Left</SelectItem>
            <SelectItem value="center center">Center Center</SelectItem>
            <SelectItem value="center right">Center Right</SelectItem>
            <SelectItem value="bottom left">Bottom Left</SelectItem>
            <SelectItem value="bottom center">Bottom Center</SelectItem>
            <SelectItem value="bottom right">Bottom Right</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="cover-overlay-opacity">Overlay Opacity (%)</Label>
        <div className="flex items-center space-x-4">
          <Slider
            value={[(block.content as any)?.dimRatio || 50]}
            onValueChange={([value]) => updateContent({ dimRatio: value })}
            max={100}
            min={0}
            step={5}
            className="flex-1"
          />
          <Input
            type="number"
            value={(block.content as any)?.dimRatio || 50}
            onChange={(e) => updateContent({ dimRatio: parseInt(e.target.value) || 50 })}
            className="w-20"
            min="0"
            max="100"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="cover-overlay-color">Overlay Color</Label>
        <Input
          id="cover-overlay-color"
          type="color"
          value={(block.content as any)?.customOverlayColor || '#000000'}
          onChange={(e) => updateContent({ customOverlayColor: e.target.value })}
        />
      </div>

      <div>
        <Label htmlFor="cover-class">Additional CSS Class(es)</Label>
        <Input
          id="cover-class"
          value={block.content?.className || ''}
          onChange={(e) => updateContent({ className: e.target.value })}
          placeholder="e.g. is-light has-background-gradient"
        />
      </div>
    </div>
  );
}

const CoverBlock: BlockDefinition = {
  id: 'core/cover',
  name: 'Cover',
  icon: CoverIcon,
  description: 'Add an image or video with a text overlay',
  category: 'media',
  defaultContent: {
    url: '',
    alt: '',
    hasParallax: false,
    dimRatio: 50,
    minHeight: 400,
    contentPosition: 'center center',
    customOverlayColor: '#000000',
    backgroundType: 'image',
    focalPoint: { x: 0.5, y: 0.5 },
    innerContent: '<p style="font-size: 2.5em; font-weight: bold;">Write title…</p>',
    className: '',
  },
  defaultStyles: {},
  renderer: CoverRenderer,
  settings: CoverSettings,
  hasSettings: true,
};

export default CoverBlock;