import React from "react";
import type { BlockConfig } from "@shared/schema";
import type { BlockDefinition } from "../types.ts";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Video as VideoIcon } from "lucide-react";

function VideoRenderer({ block }: { block: BlockConfig; isPreview: boolean }) {
  return (
    <div style={{ padding: block.styles?.padding, margin: block.styles?.margin }}>
      <video
        src={block.content?.src}
        poster={block.content?.poster}
        controls={block.content?.controls !== false}
        autoPlay={block.content?.autoplay}
        style={{
          ...block.styles,
          padding: 0,
          margin: 0,
        }}
      >
        Your browser does not support the video tag.
      </video>
    </div>
  );
}

function VideoSettings({ block, onUpdate }: { block: BlockConfig; onUpdate: (updates: Partial<BlockConfig>) => void }) {
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
        <Label htmlFor="video-src">Video URL</Label>
        <Input
          id="video-src"
          value={block.content?.src || ''}
          onChange={(e) => updateContent({ src: e.target.value })}
          placeholder="https://example.com/video.mp4"
        />
      </div>
      <div>
        <Label htmlFor="video-poster">Poster Image URL</Label>
        <Input
          id="video-poster"
          value={block.content?.poster || ''}
          onChange={(e) => updateContent({ poster: e.target.value })}
          placeholder="https://example.com/poster.jpg"
        />
      </div>
      <div className="flex items-center space-x-2">
        <Switch
          id="video-controls"
          checked={block.content?.controls !== false}
          onCheckedChange={(checked) => updateContent({ controls: checked })}
        />
        <Label htmlFor="video-controls">Show Controls</Label>
      </div>
      <div className="flex items-center space-x-2">
        <Switch
          id="video-autoplay"
          checked={block.content?.autoplay || false}
          onCheckedChange={(checked) => updateContent({ autoplay: checked })}
        />
        <Label htmlFor="video-autoplay">Autoplay</Label>
      </div>
    </div>
  );
}

const VideoBlock: BlockDefinition = {
  id: 'video',
  name: 'Video',
  icon: VideoIcon,
  description: 'Add a video player',
  category: 'media',
  defaultContent: {
    src: '',
    poster: '',
    autoplay: false,
    controls: true,
  },
  defaultStyles: {},
  renderer: VideoRenderer,
  settings: VideoSettings,
};

export default VideoBlock;

