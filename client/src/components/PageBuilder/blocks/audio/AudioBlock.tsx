import React, { useState } from "react";
import type { BlockConfig } from "@shared/schema";
import type { BlockDefinition } from "../types.ts";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import MediaPickerDialog from "@/components/media/MediaPickerDialog";
import { CollapsibleCard } from "@/components/ui/collapsible-card";
import { AudioLines as AudioIcon, Settings, Wrench } from "lucide-react";

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

function AudioSettings({ block, onUpdate }: { block: BlockConfig; onUpdate: (updates: Partial<BlockConfig>) => void }) {
  
  const [isPickerOpen, setPickerOpen] = useState(false);
  
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
      {/* Content Card */}
      <CollapsibleCard title="Content" icon={AudioIcon} defaultOpen={true}>
        <div className="space-y-4">
          <div>
            <Label htmlFor="audio-src" className="text-sm font-medium text-gray-700">Audio URL</Label>
            <div className="flex items-center gap-2 mt-1">
              <Input
                id="audio-src"
                value={(block.content as any)?.src || ''}
                onChange={(e) => updateContent({ src: e.target.value })}
                placeholder="https://example.com/audio.mp3"
                className="h-9"
              />
              <Button type="button" variant="outline" size="sm" onClick={() => setPickerOpen(true)}>Choose</Button>
            </div>
            <MediaPickerDialog
              open={isPickerOpen}
              onOpenChange={setPickerOpen}
              kind="audio"
              onSelect={(m) => updateContent({ id: m.id, src: m.url })}
            />
          </div>
          
          <div>
            <Label htmlFor="audio-caption" className="text-sm font-medium text-gray-700">Caption</Label>
            <Input
              id="audio-caption"
              value={(block.content as any)?.caption || ''}
              onChange={(e) => updateContent({ caption: e.target.value })}
              placeholder="Add a caption (optional)"
              className="mt-1 h-9"
            />
          </div>
        </div>
      </CollapsibleCard>

      {/* Settings Card */}
      <CollapsibleCard title="Settings" icon={Settings} defaultOpen={true}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="audio-controls" className="text-sm font-medium text-gray-700">Show Controls</Label>
              <Switch
                id="audio-controls"
                checked={((block.content as any)?.controls ?? true) !== false}
                onCheckedChange={(checked) => updateContent({ controls: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="audio-autoplay" className="text-sm font-medium text-gray-700">Autoplay</Label>
              <Switch
                id="audio-autoplay"
                checked={Boolean((block.content as any)?.autoplay)}
                onCheckedChange={(checked) => updateContent({ autoplay: checked })}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="audio-loop" className="text-sm font-medium text-gray-700">Loop</Label>
              <Switch
                id="audio-loop"
                checked={Boolean((block.content as any)?.loop)}
                onCheckedChange={(checked) => updateContent({ loop: checked })}
              />
            </div>
            <div>
              <Label htmlFor="audio-preload" className="text-sm font-medium text-gray-700">Preload</Label>
              <Select
                value={(block.content as any)?.preload || 'none'}
                onValueChange={(value) => updateContent({ preload: value })}
              >
                <SelectTrigger id="audio-preload" className="h-9">
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
          
          <div>
            <Label htmlFor="audio-align" className="text-sm font-medium text-gray-700">Alignment</Label>
            <Select
              value={(block.content as any)?.align || 'default'}
              onValueChange={(value) => updateContent({ align: value === 'default' ? undefined : value })}
            >
              <SelectTrigger id="audio-align" className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="wide">Wide</SelectItem>
                <SelectItem value="full">Full</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CollapsibleCard>

      {/* Advanced Card */}
      <CollapsibleCard title="Advanced" icon={Wrench} defaultOpen={false}>
        <div className="space-y-4">
          <div>
            <Label htmlFor="audio-anchor" className="text-sm font-medium text-gray-700">Anchor ID</Label>
            <Input
              id="audio-anchor"
              value={(block.content as any)?.anchor || ''}
              onChange={(e) => updateContent({ anchor: e.target.value })}
              placeholder="section-id"
              className="mt-1 h-9 text-sm"
            />
          </div>
          <div>
            <Label htmlFor="audio-class" className="text-sm font-medium text-gray-700">Additional CSS Class(es)</Label>
            <Input
              id="audio-class"
              value={(block.content as any)?.className || ''}
              onChange={(e) => updateContent({ className: e.target.value })}
              placeholder="custom-class"
              className="mt-1 h-9 text-sm"
            />
          </div>
        </div>
      </CollapsibleCard>
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


