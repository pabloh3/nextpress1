import React, { useState, useEffect, useRef } from "react";
import type { BlockConfig, BlockContent } from "@shared/schema-types";
import type { BlockDefinition, BlockComponentProps } from "../types.ts";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CollapsibleCard } from "@/components/ui/collapsible-card";
import { File as FileIcon, Download, Settings, Wrench } from "lucide-react";
import MediaPickerDialog from "@/components/media/MediaPickerDialog";
import {
  registerBlockState,
  unregisterBlockState,
  getBlockStateAccessor,
  type BlockStateAccessor,
} from "../blockStateRegistry";

// ============================================================================
// TYPES
// ============================================================================

type FileData = {
  href?: string;
  fileName?: string;
  textLinkHref?: string;
  textLinkTarget?: '_self' | '_blank';
  showDownloadButton?: boolean;
  downloadButtonText?: string;
  displayPreview?: boolean;
  fileSize?: string;
  className?: string;
};

type FileContent = BlockContent & {
  data?: FileData;
};

const DEFAULT_DATA: FileData = {
  href: '',
  fileName: '',
  textLinkHref: '',
  textLinkTarget: '_self',
  showDownloadButton: true,
  downloadButtonText: 'Download',
  displayPreview: true,
  fileSize: '',
  className: '',
};

const DEFAULT_CONTENT: FileContent = {
  kind: 'structured',
  data: DEFAULT_DATA,
};

// ============================================================================
// UTILITIES
// ============================================================================

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// ============================================================================
// RENDERER
// ============================================================================

interface FileRendererProps {
  content: FileContent;
  styles?: React.CSSProperties;
}

function FileRenderer({ content, styles }: FileRendererProps) {
  const blockData = content?.kind === 'structured' 
    ? (content.data as FileData) 
    : DEFAULT_DATA;
    
  const url = blockData?.href || '';
  const fileName = blockData?.fileName || '';
  const textLinkHref = blockData?.textLinkHref || url;
  const textLinkTarget = blockData?.textLinkTarget || '_self';
  const showDownloadButton = blockData?.showDownloadButton !== false;
  const downloadButtonText = blockData?.downloadButtonText || 'Download';
  const displayPreview = blockData?.displayPreview !== false;
  
  const className = [
    "wp-block-file",
    blockData?.className || "",
  ].filter(Boolean).join(" ");

  const fileExtension = fileName ? fileName.split('.').pop()?.toUpperCase() : '';
  const fileSize = blockData?.fileSize || '';

  if (!url) {
    return (
      <div className={className} style={styles}>
        <div className="file-placeholder text-center text-gray-400 p-8 border-2 border-dashed border-gray-300 rounded">
          <FileIcon className="w-12 h-12 mx-auto mb-2" />
          <p>File Block</p>
          <small>Add a file for users to download</small>
        </div>
      </div>
    );
  }

  return (
    <div className={className} style={styles}>
      <div className="wp-block-file__content-wrapper">
        {displayPreview && (
          <div className="wp-block-file__preview">
            <div className="file-info" style={{ display: 'flex', alignItems: 'center', marginBottom: '1em' }}>
              <FileIcon className="w-8 h-8 mr-3 text-gray-600" />
              <div>
                <div className="file-name font-medium">
                  <a 
                    href={textLinkHref} 
                    target={textLinkTarget}
                    style={{ textDecoration: 'none', color: '#007cba' }}
                  >
                    {fileName || 'Download File'}
                  </a>
                </div>
                {(fileExtension || fileSize) && (
                  <div className="file-details text-sm text-gray-500">
                    {fileExtension && <span>{fileExtension}</span>}
                    {fileExtension && fileSize && <span> • </span>}
                    {fileSize && <span>{fileSize}</span>}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {showDownloadButton && (
          <div className="wp-block-file__button-container">
            <a
              href={url}
              className="wp-block-file__button"
              download={fileName}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                backgroundColor: '#007cba',
                color: '#ffffff',
                padding: '12px 24px',
                borderRadius: '4px',
                textDecoration: 'none',
                fontSize: '16px',
                fontWeight: '600',
                gap: '8px',
              }}
            >
              <Download className="w-4 h-4" />
              {downloadButtonText}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function FileBlockComponent({
  value,
  onChange,
}: BlockComponentProps) {
  // State
  const [content, setContent] = useState<FileContent>(() => {
    return (value.content as FileContent) || DEFAULT_CONTENT;
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
        const newContent = (value.content as FileContent) || DEFAULT_CONTENT;
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

  return <FileRenderer content={content} styles={styles} />;
}

// ============================================================================
// SETTINGS COMPONENT
// ============================================================================

interface FileSettingsProps {
  block: BlockConfig;
  onUpdate?: (updates: Partial<BlockConfig>) => void;
}

function FileSettings({ block, onUpdate }: FileSettingsProps) {
  const accessor = getBlockStateAccessor(block.id);
  const [, setUpdateTrigger] = React.useState(0);
  const [isPickerOpen, setPickerOpen] = useState(false);

  // Get current state
  const content = accessor
    ? (accessor.getContent() as FileContent)
    : (block.content as FileContent) || DEFAULT_CONTENT;

  const blockData = content?.kind === 'structured' 
    ? (content.data as FileData) 
    : DEFAULT_DATA;

  // Update handlers
  const updateContent = (updates: Partial<FileData>) => {
    if (accessor) {
      const current = accessor.getContent() as FileContent;
      const currentData = current?.kind === 'structured' ? (current.data as FileData) : DEFAULT_DATA;
      accessor.setContent({
        ...current,
        kind: 'structured',
        data: {
          ...currentData,
          ...updates,
        },
      } as FileContent);
      setUpdateTrigger((prev) => prev + 1);
    } else if (onUpdate) {
      const currentData = block.content?.kind === 'structured' 
        ? (block.content.data as FileData) 
        : DEFAULT_DATA;
      onUpdate({
        content: {
          kind: 'structured',
          data: {
            ...currentData,
            ...updates,
          },
        } as BlockContent,
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Content Card */}
      <CollapsibleCard title="Content" icon={FileIcon} defaultOpen={true}>
        <div className="space-y-4">
          <div>
            <Label htmlFor="file-url" className="text-sm font-medium text-gray-700">File URL</Label>
            <div className="flex items-center gap-2 mt-1">
              <Input
                id="file-url"
                value={blockData?.href || ''}
                onChange={(e) => updateContent({ href: e.target.value, textLinkHref: e.target.value })}
                placeholder="https://example.com/document.pdf"
                className="h-9"
              />
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => setPickerOpen(true)}
              >
                Choose
              </Button>
            </div>
            <MediaPickerDialog
              open={isPickerOpen}
              onOpenChange={setPickerOpen}
              kind="any"
              onSelect={(m) => {
                updateContent({
                  href: m.url,
                  textLinkHref: m.url,
                  fileName: m.originalName || m.filename,
                  fileSize: m.size ? formatFileSize(m.size) : '',
                });
              }}
            />
          </div>

          <div>
            <Label htmlFor="file-name" className="text-sm font-medium text-gray-700">File Name</Label>
            <Input
              id="file-name"
              value={blockData?.fileName || ''}
              onChange={(e) => updateContent({ fileName: e.target.value })}
              placeholder="document.pdf"
              className="mt-1 h-9"
            />
          </div>

          <div>
            <Label htmlFor="file-size" className="text-sm font-medium text-gray-700">File Size (optional)</Label>
            <Input
              id="file-size"
              value={blockData?.fileSize || ''}
              onChange={(e) => updateContent({ fileSize: e.target.value })}
              placeholder="2.5 MB"
              className="mt-1 h-9"
            />
          </div>
        </div>
      </CollapsibleCard>

      {/* Settings Card */}
      <CollapsibleCard title="Settings" icon={Settings} defaultOpen={true}>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="file-show-preview" className="text-sm font-medium text-gray-700">Show file preview</Label>
            <Switch
              id="file-show-preview"
              checked={blockData?.displayPreview !== false}
              onCheckedChange={(checked) => updateContent({ displayPreview: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="file-show-download" className="text-sm font-medium text-gray-700">Show download button</Label>
            <Switch
              id="file-show-download"
              checked={blockData?.showDownloadButton !== false}
              onCheckedChange={(checked) => updateContent({ showDownloadButton: checked })}
            />
          </div>

          {blockData?.showDownloadButton !== false && (
            <div>
              <Label htmlFor="file-button-text" className="text-sm font-medium text-gray-700">Download Button Text</Label>
              <Input
                id="file-button-text"
                value={blockData?.downloadButtonText || 'Download'}
                onChange={(e) => updateContent({ downloadButtonText: e.target.value })}
                placeholder="Download"
                className="mt-1 h-9"
              />
            </div>
          )}

          <div>
            <Label htmlFor="file-link-target" className="text-sm font-medium text-gray-700">Link Target</Label>
            <Select
              value={blockData?.textLinkTarget || '_self'}
              onValueChange={(value) => updateContent({ textLinkTarget: value as '_self' | '_blank' })}
            >
              <SelectTrigger id="file-link-target" className="h-9">
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

      {/* Advanced Card */}
      <CollapsibleCard title="Advanced" icon={Wrench} defaultOpen={false}>
        <div className="space-y-4">
          <div>
            <Label htmlFor="file-class" className="text-sm font-medium text-gray-700">Additional CSS Class(es)</Label>
            <Input
              id="file-class"
              value={blockData?.className || ''}
              onChange={(e) => updateContent({ className: e.target.value })}
              placeholder="e.g. is-style-outline"
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

function LegacyFileRenderer({
  block,
}: {
  block: BlockConfig;
  isPreview: boolean;
}) {
  return (
    <FileRenderer
      content={(block.content as FileContent) || DEFAULT_CONTENT}
      styles={block.styles}
    />
  );
}

// ============================================================================
// BLOCK DEFINITION
// ============================================================================

const FileBlock: BlockDefinition = {
  id: 'core/file',
  label: 'File',
  icon: FileIcon,
  description: 'Add a link to a downloadable file',
  category: 'media',
  defaultContent: {
    kind: 'structured',
    data: {
      href: '',
      fileName: '',
      textLinkHref: '',
      textLinkTarget: '_self',
      showDownloadButton: true,
      downloadButtonText: 'Download',
      displayPreview: true,
      fileSize: '',
      className: '',
    },
  },
  defaultStyles: {
    margin: '1em 0',
  },
  component: FileBlockComponent,
  renderer: LegacyFileRenderer,
  settings: FileSettings,
  hasSettings: true,
};

export default FileBlock;
