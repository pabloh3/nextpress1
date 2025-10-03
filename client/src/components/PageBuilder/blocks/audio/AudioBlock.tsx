import React, { useState } from "react";
import type { BlockConfig } from "@shared/schema";
import type { BlockDefinition } from "../types.ts";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import MediaPickerDialog from "@/components/media/MediaPickerDialog";
import { AudioLines as AudioIcon } from "lucide-react";
import { useBlockManager } from "@/hooks/useBlockManager";

function AudioRenderer({ block }: { block: BlockConfig; isPreview: boolean }) {
  const {
    src,
    controls = true,
    autoplay = false,
    loop = false,
    preload = 'none',
    align,
    caption,
    anchor,
    className,
  } = (block.content || {}) as any;

  const classes = [
    'wp-block-audio',
    align ? `align${align}` : '',
    className || '',
  ].filter(Boolean).join(' ');

  if (!src) {
    return (
      <div className="p-4 border border-dashed border-gray-300 rounded text-gray-500">
        Add an audio source URL to preview the player.
      </div>
    );
  }

  return (
    <figure id={anchor} className={classes} style={{ ...block.styles }}>
      <audio
        src={src}
        controls={controls}
        autoPlay={autoplay}
        loop={loop}
        preload={preload}
        style={{ display: 'block', width: '100%' }}
      >
        Your browser does not support the audio element.
      </audio>
      {caption ? (
        <figcaption className="wp-element-caption">{caption}</figcaption>
      ) : null}
    </figure>
  );
}

function AudioSettings({ block }: { block: BlockConfig }) {
  const { updateBlockContent } = useBlockManager();
  const [isPickerOpen, setPickerOpen] = useState(false);
  
  const updateContent = (contentUpdates: any) => {
    updateBlockContent(block.id, {
      ...block.content,
      ...contentUpdates,
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="audio-src">Audio URL</Label>
        <div className="flex items-center gap-2">
          <Input
            id="audio-src"
            value={(block.content as any)?.src || ''}
            onChange={(e) => updateContent({ src: e.target.value })}
            placeholder="https://example.com/audio.mp3"
          />
          <Button type="button" variant="outline" onClick={() => setPickerOpen(true)}>Choose from library</Button>
        </div>
        <MediaPickerDialog
          open={isPickerOpen}
          onOpenChange={setPickerOpen}
          kind="audio"
          onSelect={(m) => updateContent({ id: m.id, src: m.url })}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="audio-controls">Show Controls</Label>
          <Switch
            id="audio-controls"
            checked={((block.content as any)?.controls ?? true) !== false}
            onCheckedChange={(checked) => updateContent({ controls: checked })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="audio-autoplay">Autoplay</Label>
          <Switch
            id="audio-autoplay"
            checked={Boolean((block.content as any)?.autoplay)}
            onCheckedChange={(checked) => updateContent({ autoplay: checked })}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="audio-loop">Loop</Label>
          <Switch
            id="audio-loop"
            checked={Boolean((block.content as any)?.loop)}
            onCheckedChange={(checked) => updateContent({ loop: checked })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="audio-preload">Preload</Label>
          <Select
            value={(block.content as any)?.preload || 'none'}
            onValueChange={(value) => updateContent({ preload: value })}
          >
            <SelectTrigger id="audio-preload">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">Auto</SelectItem>
              <SelectItem value="metadata">Metadata</SelectItem>
              <SelectItem value="none">None</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="audio-align">Alignment</Label>
          <Select
            value={(block.content as any)?.align || 'default'}
            onValueChange={(value) => updateContent({ align: value === 'default' ? undefined : value })}
          >
            <SelectTrigger id="audio-align">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default</SelectItem>
              <SelectItem value="wide">Wide</SelectItem>
              <SelectItem value="full">Full</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="audio-caption">Caption</Label>
          <Input
            id="audio-caption"
            value={(block.content as any)?.caption || ''}
            onChange={(e) => updateContent({ caption: e.target.value })}
            placeholder="Add a caption (optional)"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="audio-anchor">Anchor</Label>
          <Input
            id="audio-anchor"
            value={(block.content as any)?.anchor || ''}
            onChange={(e) => updateContent({ anchor: e.target.value })}
            placeholder="section-id"
          />
        </div>
        <div>
          <Label htmlFor="audio-class">Additional CSS Class(es)</Label>
          <Input
            id="audio-class"
            value={(block.content as any)?.className || ''}
            onChange={(e) => updateContent({ className: e.target.value })}
            placeholder="custom-class"
          />
        </div>
      </div>
    </div>
  );
}

const AudioBlock: BlockDefinition = {
  id: 'core/audio',
  name: 'Audio',
  icon: AudioIcon,
  description: 'Add an audio player',
  category: 'media',
  defaultContent: {
    src: '',
    id: undefined,
    autoplay: false,
    controls: true,
    loop: false,
    preload: 'none',
    align: undefined,
    caption: '',
    anchor: '',
    className: '',
  },
  defaultStyles: {},
  renderer: AudioRenderer,
  settings: AudioSettings,
};

export default AudioBlock;


