import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Trash2, Move } from "lucide-react";
import type { BlockConfig } from "@shared/schema";
import { blockRegistry } from "./blocks";

interface BlockRendererProps {
  block: BlockConfig;
  isSelected: boolean;
  isPreview: boolean;
  onDuplicate: () => void;
  onDelete: () => void;
  hoverHighlight?: 'padding' | 'margin' | null;
}

export default function BlockRenderer({ 
  block, 
  isSelected, 
  isPreview, 
  onDuplicate, 
  onDelete,
  hoverHighlight = null,
}: BlockRendererProps) {
  const [isHovered, setIsHovered] = useState(false);
  const marginString: string = (block.styles?.margin as string) || '0px';
  const parseMargin = (value: string): [string, string, string, string] => {
    const parts = value.trim().split(/\s+/);
    if (parts.length === 1) return [parts[0], parts[0], parts[0], parts[0]];
    if (parts.length === 2) return [parts[0], parts[1], parts[0], parts[1]];
    if (parts.length === 3) return [parts[0], parts[1], parts[2], parts[1]];
    return [parts[0], parts[1], parts[2], parts[3]];
  };
  const [mTop, mRight, mBottom, mLeft] = parseMargin(marginString);
  const paddingString: string = (block.styles?.padding as string) || '0px';
  const parsePadding = parseMargin;
  const [pTop, pRight, pBottom, pLeft] = parsePadding(paddingString);

  const horizontal = (block.styles as any)?.contentAlignHorizontal as 'left' | 'center' | 'right' | undefined;
  const vertical = (block.styles as any)?.contentAlignVertical as 'top' | 'middle' | 'bottom' | undefined;
  const justifyContent = horizontal === 'center' ? 'center' : horizontal === 'right' ? 'flex-end' : 'flex-start';
  const alignItems = vertical === 'middle' ? 'center' : vertical === 'bottom' ? 'flex-end' : 'flex-start';

  const renderContent = () => {
    const def = blockRegistry[block.type];
    if (def?.renderer) {
      const Renderer = def.renderer;
      return <Renderer block={block} isPreview={isPreview} />;
    }
    return (
      <div style={block.styles} className="p-4 border border-dashed border-gray-300 rounded">
        <div className="text-center text-gray-400">
          {block.type} block
          <br />
          <small>Not implemented yet</small>
        </div>
      </div>
    );
  };

  return (
    <div
      className="relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Block Controls */}
      {!isPreview && (isSelected || isHovered) && (
        <div className="absolute -top-10 left-0 z-10 flex items-center gap-1 bg-white border border-gray-200 rounded shadow-sm p-1">
          <span className="text-xs text-gray-600 px-2">{block.type}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate();
            }}
            className="h-6 w-6 p-0"
          >
            <Copy className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
          <div className="w-6 h-6 flex items-center justify-center cursor-move">
            <Move className="w-3 h-3 text-gray-400" />
          </div>
        </div>
      )}

      {/* Block Content with spacing highlight overlays */}
      <div className={`${!isPreview ? 'cursor-pointer' : ''} transition-all duration-200`}>
        <div
          className={`${!isPreview && isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''} ${!isPreview && isHovered && !isSelected ? 'ring-1 ring-gray-300' : ''} relative`}
          style={{ display: 'flex', justifyContent, alignItems, width: '100%' }}
        >
          {/* Padding highlight (approximate) */}
          {(!isPreview && hoverHighlight === 'padding') && (
            <>
              <div className="absolute left-0 right-0 pointer-events-none" style={{ top: 0, height: pTop, background: 'rgba(34,197,94,0.15)' }} />
              <div className="absolute left-0 right-0 pointer-events-none" style={{ bottom: 0, height: pBottom, background: 'rgba(34,197,94,0.15)' }} />
              <div className="absolute top-0 bottom-0 pointer-events-none" style={{ left: 0, width: pLeft, background: 'rgba(34,197,94,0.15)' }} />
              <div className="absolute top-0 bottom-0 pointer-events-none" style={{ right: 0, width: pRight, background: 'rgba(34,197,94,0.15)' }} />
            </>
          )}
          {/* Margin highlight */}
          {(!isPreview && hoverHighlight === 'margin') && (
            <div
              className="pointer-events-none"
              style={{
                position: 'absolute',
                top: `calc(-1 * ${mTop})`,
                left: `calc(-1 * ${mLeft})`,
                right: `calc(-1 * ${mRight})`,
                bottom: `calc(-1 * ${mBottom})`,
                outline: '2px dashed rgba(59,130,246,0.6)',
                outlineOffset: 0,
                borderRadius: '6px',
              }}
            />
          )}
          {renderContent()}
        </div>
      </div>
    </div>
  );
}