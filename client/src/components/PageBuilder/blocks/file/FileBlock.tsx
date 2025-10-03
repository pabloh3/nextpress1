import React, { useState } from "react";
import type { BlockConfig } from "@shared/schema";
import type { BlockDefinition } from "../types.ts";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { File as FileIcon, Download } from "lucide-react";
import MediaPickerDialog from "@/components/media/MediaPickerDialog";
import { useBlockManager } from "@/hooks/useBlockManager";

function FileRenderer({ block }: { block: BlockConfig; isPreview: boolean }) {
  const url = (block.content as any)?.href || '';
  const fileName = (block.content as any)?.fileName || '';
  const textLinkHref = (block.content as any)?.textLinkHref || url;
  const textLinkTarget = (block.content as any)?.textLinkTarget || '_self';
  const showDownloadButton = (block.content as any)?.showDownloadButton !== false;
  const downloadButtonText = (block.content as any)?.downloadButtonText || 'Download';
  const displayPreview = (block.content as any)?.displayPreview !== false;
  
  const className = [
    "wp-block-file",
    block.content?.className || "",
  ].filter(Boolean).join(" ");

  // Extract file extension and size info if available
  const fileExtension = fileName ? fileName.split('.').pop()?.toUpperCase() : '';
  const fileSize = (block.content as any)?.fileSize || '';

  if (!url) {
    return (
      <div className={className} style={block.styles}>
        <div className="file-placeholder text-center text-gray-400 p-8 border-2 border-dashed border-gray-300 rounded">
          <FileIcon className="w-12 h-12 mx-auto mb-2" />
          <p>File Block</p>
          <small>Add a file for users to download</small>
        </div>
      </div>
    );
  }

  return (
    <div className={className} style={block.styles}>
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

function FileSettings({ block }: { block: BlockConfig }) {
  const [isPickerOpen, setPickerOpen] = useState(false);
  const { updateBlockContent } = useBlockManager();

  const updateContent = (contentUpdates: any) => {
    updateBlockContent(block.id, contentUpdates);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="file-url">File URL</Label>
        <div className="flex items-center gap-2">
          <Input
            id="file-url"
            value={(block.content as any)?.href || ''}
            onChange={(e) => updateContent({ href: e.target.value, textLinkHref: e.target.value })}
            placeholder="https://example.com/document.pdf"
          />
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => setPickerOpen(true)}
          >
            Choose file
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
        <Label htmlFor="file-name">File Name</Label>
        <Input
          id="file-name"
          value={(block.content as any)?.fileName || ''}
          onChange={(e) => updateContent({ fileName: e.target.value })}
          placeholder="document.pdf"
        />
      </div>

      <div>
        <Label htmlFor="file-size">File Size (optional)</Label>
        <Input
          id="file-size"
          value={(block.content as any)?.fileSize || ''}
          onChange={(e) => updateContent({ fileSize: e.target.value })}
          placeholder="2.5 MB"
        />
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="file-show-preview">Show file preview</Label>
        <Switch
          id="file-show-preview"
          checked={(block.content as any)?.displayPreview !== false}
          onCheckedChange={(checked) => updateContent({ displayPreview: checked })}
        />
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="file-show-download">Show download button</Label>
        <Switch
          id="file-show-download"
          checked={(block.content as any)?.showDownloadButton !== false}
          onCheckedChange={(checked) => updateContent({ showDownloadButton: checked })}
        />
      </div>

      {(block.content as any)?.showDownloadButton !== false && (
        <div>
          <Label htmlFor="file-button-text">Download Button Text</Label>
          <Input
            id="file-button-text"
            value={(block.content as any)?.downloadButtonText || 'Download'}
            onChange={(e) => updateContent({ downloadButtonText: e.target.value })}
            placeholder="Download"
          />
        </div>
      )}

      <div>
        <Label htmlFor="file-link-target">Link Target</Label>
        <select
          id="file-link-target"
          value={(block.content as any)?.textLinkTarget || '_self'}
          onChange={(e) => updateContent({ textLinkTarget: e.target.value })}
          className="w-full p-2 border border-gray-300 rounded"
        >
          <option value="_self">Same Window</option>
          <option value="_blank">New Window</option>
        </select>
      </div>

      <div>
        <Label htmlFor="file-class">Additional CSS Class(es)</Label>
        <Input
          id="file-class"
          value={block.content?.className || ''}
          onChange={(e) => updateContent({ className: e.target.value })}
          placeholder="e.g. is-style-outline"
        />
      </div>
    </div>
  );
}

const FileBlock: BlockDefinition = {
  id: 'core/file',
  name: 'File',
  icon: FileIcon,
  description: 'Add a link to a downloadable file',
  category: 'media',
  defaultContent: {
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
  defaultStyles: {
    margin: '1em 0',
  },
  renderer: FileRenderer,
  settings: FileSettings,
  hasSettings: true,
};

export default FileBlock;