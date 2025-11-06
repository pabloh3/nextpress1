import React, { useState } from "react";
import type { BlockConfig, Media } from "@shared/schema-types";
import type { BlockDefinition } from "../types.ts";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Image as ImageIcon } from "lucide-react";
import MediaPickerDialog from "@/components/media/MediaPickerDialog";

interface GalleryImage {
  id: number;
  url: string;
  alt: string;
  caption?: string;
  sizeSlug?: string;
}

function GalleryRenderer({ block }: { block: BlockConfig; isPreview: boolean }) {
  const images: GalleryImage[] = Array.isArray((block.content as any)?.images)
    ? (block.content as any).images
    : [];

  const columns = (block.content as any)?.columns || 3;
  const imageCrop = (block.content as any)?.imageCrop !== false;
  const linkTo = (block.content as any)?.linkTo || 'none';
  const sizeSlug = (block.content as any)?.sizeSlug || 'large';
  const caption = (block.content as any)?.caption || '';

  const className = [
    "wp-block-gallery",
    `has-nested-images`,
    `columns-${columns}`,
    imageCrop ? 'is-cropped' : '',
    block.content?.className || "",
  ].filter(Boolean).join(" ");

  if (images.length === 0) {
    return (
      <div className={className} style={block.styles}>
        <div className="gallery-placeholder text-center text-gray-400 p-8 border-2 border-dashed border-gray-300 rounded">
          <ImageIcon className="w-12 h-12 mx-auto mb-2" />
          <p>Gallery</p>
          <small>Add images to create a gallery</small>
        </div>
      </div>
    );
  }

  return (
    <figure className={className} style={block.styles}>
      <div
        className="blocks-gallery-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gap: '16px',
        }}
      >
        {images.map((image, index) => {
          const imgElement = (
            <img
              key={image.id || index}
              src={image.url}
              alt={image.alt}
              style={{
                width: '100%',
                height: imageCrop ? '200px' : 'auto',
                objectFit: imageCrop ? 'cover' : 'contain',
                borderRadius: '4px',
              }}
            />
          );

          const content = linkTo === 'media' ? (
            <a href={image.url} target="_blank" rel="noopener noreferrer">
              {imgElement}
            </a>
          ) : imgElement;

          return (
            <div key={image.id || index} className="wp-block-image">
              {content}
              {image.caption && (
                <figcaption className="blocks-gallery-item__caption">
                  {image.caption}
                </figcaption>
              )}
            </div>
          );
        })}
      </div>
      {caption && (
        <figcaption className="blocks-gallery-caption">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

import { CollapsibleCard } from "@/components/ui/collapsible-card";
import { Settings, Wrench } from "lucide-react";

function GallerySettings({ block, onUpdate }: { block: BlockConfig; onUpdate: (updates: Partial<BlockConfig>) => void }) {
  const [isPickerOpen, setPickerOpen] = useState(false);
  
  
  const images: GalleryImage[] = Array.isArray((block.content as any)?.images)
    ? (block.content as any).images
    : [];

  const updateContent = (contentUpdates: any) => {
    onUpdate({
      content: {
        ...block.content,
        ...contentUpdates,
      },
    });
  };

  const updateImages = (newImages: GalleryImage[]) => {
    updateContent({ images: newImages });
  };

  const addImage = (selectedImage: Media) => {
    const newImage = {
      id: selectedImage.id,
      url: selectedImage.url,
      alt: selectedImage.alt || selectedImage.originalName || selectedImage.filename,
      caption: '',
      sizeSlug: 'large',
    };
    updateImages([...images, newImage]);
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    updateImages(newImages);
  };

  const updateImage = (index: number, updates: Partial<GalleryImage>) => {
    const newImages = images.map((img, i) => i === index ? { ...img, ...updates } : img);
    updateImages(newImages);
  };

  return (
    <div className="space-y-4">
      {/* Content Card */}
      <CollapsibleCard title="Content" icon={ImageIcon} defaultOpen={true}>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Label>Gallery Images ({images.length})</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPickerOpen(true)}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Images
            </Button>
          </div>

          <MediaPickerDialog
            open={isPickerOpen}
            onOpenChange={setPickerOpen}
            kind="image"
            onSelect={addImage}
          />

          <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto" aria-label="Gallery image grid">
            {images.map((image, index) => (
              <div key={image.id || index} className="relative border rounded p-2">
                <img
                  src={image.url}
                  alt={image.alt}
                  className="w-full h-20 object-cover rounded mb-2"
                />
                <Input
                  value={image.caption || ''}
                  onChange={(e) => updateImage(index, { caption: e.target.value })}
                  placeholder="Caption (optional)"
                  className="text-xs mb-1 h-9"
                  aria-label={`Caption for image ${index + 1}`}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 text-red-600 p-1 h-auto"
                  aria-label={`Remove image ${index + 1}`}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </CollapsibleCard>

      {/* Settings Card */}
      <CollapsibleCard title="Settings" icon={Settings} defaultOpen={true}>
        <div className="space-y-4">
          <div>
            <Label htmlFor="gallery-columns">Columns</Label>
            <Select
              value={((block.content as any)?.columns || 3).toString()}
              onValueChange={(value) => updateContent({ columns: parseInt(value) })}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1</SelectItem>
                <SelectItem value="2">2</SelectItem>
                <SelectItem value="3">3</SelectItem>
                <SelectItem value="4">4</SelectItem>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="6">6</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="gallery-crop">Crop images</Label>
            <Switch
              id="gallery-crop"
              checked={(block.content as any)?.imageCrop !== false}
              onCheckedChange={(checked) => updateContent({ imageCrop: checked })}
            />
          </div>

          <div>
            <Label htmlFor="gallery-link-to">Link to</Label>
            <Select
              value={(block.content as any)?.linkTo || 'none'}
              onValueChange={(value) => updateContent({ linkTo: value })}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="media">Media File</SelectItem>
                <SelectItem value="attachment">Attachment Page</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="gallery-size">Image Size</Label>
            <Select
              value={(block.content as any)?.sizeSlug || 'large'}
              onValueChange={(value) => updateContent({ sizeSlug: value })}
            >
              <SelectTrigger className="h-9">
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
            <Label htmlFor="gallery-caption">Gallery Caption</Label>
            <Input
              id="gallery-caption"
              value={(block.content as any)?.caption || ''}
              onChange={(e) => updateContent({ caption: e.target.value })}
              placeholder="Describe the gallery"
              className="h-9"
            />
          </div>
        </div>
      </CollapsibleCard>

      {/* Advanced Card */}
      <CollapsibleCard title="Advanced" icon={Wrench} defaultOpen={false}>
        <div className="space-y-4">
          <div>
            <Label htmlFor="gallery-class" className="text-sm font-medium text-gray-700">Additional CSS Class(es)</Label>
            <Input
              id="gallery-class"
              value={block.content?.className || ''}
              onChange={(e) => updateContent({ className: e.target.value })}
              placeholder="e.g. is-style-rounded"
              className="h-9 text-sm"
            />
          </div>
        </div>
      </CollapsibleCard>
    </div>
  );
}

const GalleryBlock: BlockDefinition = {
  id: 'core/gallery',
  name: 'Gallery',
  icon: ImageIcon,
  description: 'Display multiple images in a rich gallery',
  category: 'media',
  defaultContent: {
    images: [],
    columns: 3,
    imageCrop: true,
    linkTo: 'none',
    sizeSlug: 'large',
    caption: '',
    className: '',
  },
  defaultStyles: {},
  renderer: GalleryRenderer,
  settings: GallerySettings,
  hasSettings: true,
};

export default GalleryBlock;