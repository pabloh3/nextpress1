import React, { useState, useEffect, useRef } from "react";
import type { BlockConfig, BlockContent } from "@shared/schema-types";
import type { BlockDefinition, BlockComponentProps } from "../types.ts";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import MediaPickerDialog from "@/components/media/MediaPickerDialog";
import { CollapsibleCard } from "@/components/ui/collapsible-card";
import { AudioLines as AudioIcon, Settings, Wrench } from "lucide-react";
import {
  registerBlockState,
  unregisterBlockState,
  getBlockStateAccessor,
  type BlockStateAccessor,
} from "../blockStateRegistry";

// ============================================================================
// TYPES
// ============================================================================

type AudioContent = BlockContent & {
  controls?: boolean;
  autoplay?: boolean;
  loop?: boolean;
  preload?: string;
  align?: 'default' | 'wide' | 'full';
  caption?: string;
  anchor?: string;
  className?: string;
  id?: number;
};

const DEFAULT_CONTENT: AudioContent = {
  kind: 'media',
  url: '',
  mediaType: 'audio',
  id: undefined,
  autoplay: false,
  controls: true,
  loop: false,
  preload: 'none',
  align: undefined,
  caption: '',
  anchor: '',
  className: '',
};

// ============================================================================
// RENDERER
// ============================================================================

interface AudioRendererProps {
  content: AudioContent;
  styles?: React.CSSProperties;
}

function AudioRenderer({ content, styles }: AudioRendererProps) {
  const audioUrl = content?.kind === 'media' && content.mediaType === 'audio' 
    ? content.url 
    : '';
  
  const {
    controls = true,
    autoplay = false,
    loop = false,
    preload = 'none',
    align,
    caption,
    anchor,
    className,
  } = content || {};

  const classes = [
    'wp-block-audio',
    align ? `align${align}` : '',
    className || '',
  ].filter(Boolean).join(' ');

  if (!audioUrl) {
    return (
      <div className="p-4 border border-dashed border-gray-300 rounded text-gray-500">
        Add an audio source URL to preview the player.
      </div>
    );
  }

  return (
    <figure id={anchor} className={classes} style={{ ...styles }}>
      <audio
        src={audioUrl}
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

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function AudioBlockComponent({
  value,
  onChange,
}: BlockComponentProps) {
  // State
  const [content, setContent] = useState<AudioContent>(() => {
    return (value.content as AudioContent) || DEFAULT_CONTENT;
  });
  const [styles, setStyles] = useState<React.CSSProperties | undefined>(
    () => value.styles
  );

  // Sync with props only when block ID changes
  const lastSyncedBlockIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (lastSyncedBlockIdRef.current !== value.id) {
      lastSyncedBlockIdRef.current = value.id;
      const newContent = (value.content as AudioContent) || DEFAULT_CONTENT;
      setContent(newContent);
      setStyles(value.styles);
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
  useEffect(() => {
    onChange({
      ...value,
      content: content as BlockContent,
      styles,
    });
  }, [content, styles, value, onChange]);

  return <AudioRenderer content={content} styles={styles} />;
}

// ============================================================================
// SETTINGS COMPONENT
// ============================================================================

interface AudioSettingsProps {
  block: BlockConfig;
  onUpdate?: (updates: Partial<BlockConfig>) => void;
}

function AudioSettings({ block, onUpdate }: AudioSettingsProps) {
  const accessor = getBlockStateAccessor(block.id);
  const [, setUpdateTrigger] = React.useState(0);
  const [isPickerOpen, setPickerOpen] = useState(false);

  // Get current state
  const content = accessor
    ? (accessor.getContent() as AudioContent)
    : (block.content as AudioContent) || DEFAULT_CONTENT;

  // Update handlers
  const updateContent = (updates: Partial<AudioContent>) => {
    if (accessor) {
      const current = accessor.getContent() as AudioContent;
      accessor.setContent({ ...current, ...updates } as AudioContent);
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

  const audioUrl = content?.kind === 'media' ? content.url : '';

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
                value={audioUrl}
                onChange={(e) => updateContent({ kind: 'media', mediaType: 'audio', url: e.target.value } as AudioContent)}
                placeholder="https://example.com/audio.mp3"
                className="h-9"
              />
              <Button type="button" variant="outline" size="sm" onClick={() => setPickerOpen(true)}>Choose</Button>
            </div>
            <MediaPickerDialog
              open={isPickerOpen}
              onOpenChange={setPickerOpen}
              kind="audio"
              onSelect={(m) => updateContent({ kind: 'media', mediaType: 'audio', id: m.id, url: m.url } as AudioContent)}
            />
          </div>
          
          <div>
            <Label htmlFor="audio-caption" className="text-sm font-medium text-gray-700">Caption</Label>
            <Input
              id="audio-caption"
              value={content?.caption || ''}
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
          <div className="flex items-center justify-between">
            <Label htmlFor="audio-controls" className="text-sm font-medium text-gray-700">Show Controls</Label>
            <Switch
              id="audio-controls"
              checked={(content?.controls ?? true) !== false}
              onCheckedChange={(checked) => updateContent({ controls: checked })}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="audio-autoplay" className="text-sm font-medium text-gray-700">Autoplay</Label>
            <Switch
              id="audio-autoplay"
              checked={Boolean(content?.autoplay)}
              onCheckedChange={(checked) => updateContent({ autoplay: checked })}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="audio-loop" className="text-sm font-medium text-gray-700">Loop</Label>
            <Switch
              id="audio-loop"
              checked={Boolean(content?.loop)}
              onCheckedChange={(checked) => updateContent({ loop: checked })}
            />
          </div>
          
          <div>
            <Label htmlFor="audio-preload" className="text-sm font-medium text-gray-700">Preload</Label>
            <Select
              value={content?.preload || 'none'}
              onValueChange={(value) => updateContent({ preload: value })}
              >
                <SelectTrigger id="audio-preload" className="h-9 mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto</SelectItem>
                  <SelectItem value="metadata">Metadata</SelectItem>
                  <SelectItem value="none">None</SelectItem>
                </SelectContent>
              </Select>
            </div>
          
          <div>
            <Label htmlFor="audio-align" className="text-sm font-medium text-gray-700">Alignment</Label>
            <Select
              value={content?.align || 'default'}
              onValueChange={(value) => updateContent({ align: value === 'default' ? undefined : value as any })}
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
              value={content?.anchor || ''}
              onChange={(e) => updateContent({ anchor: e.target.value })}
              placeholder="section-id"
              className="mt-1 h-9 text-sm"
            />
          </div>
          <div>
            <Label htmlFor="audio-class" className="text-sm font-medium text-gray-700">Additional CSS Class(es)</Label>
            <Input
              id="audio-class"
              value={content?.className || ''}
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

// ============================================================================
// LEGACY RENDERER (Backward Compatibility)
// ============================================================================

function LegacyAudioRenderer({
  block,
}: {
  block: BlockConfig;
  isPreview: boolean;
}) {
  return (
    <AudioRenderer
      content={(block.content as AudioContent) || DEFAULT_CONTENT}
      styles={block.styles}
    />
  );
}

// ============================================================================
// BLOCK DEFINITION
// ============================================================================

const AudioBlock: BlockDefinition = {
  id: 'core/audio',
  label: 'Audio',
  icon: AudioIcon,
  description: 'Add an audio player',
  category: 'media',
  defaultContent: {
    kind: 'media',
    url: '',
    mediaType: 'audio',
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
  component: AudioBlockComponent,
  renderer: LegacyAudioRenderer,
  settings: AudioSettings,
  hasSettings: true,
};

export default AudioBlock;
