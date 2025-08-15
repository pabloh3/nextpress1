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
}

export default function BlockRenderer({ 
  block, 
  isSelected, 
  isPreview, 
  onDuplicate, 
  onDelete 
}: BlockRendererProps) {
  const [isHovered, setIsHovered] = useState(false);

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

      {/* Block Content */}
      <div
        className={`
          ${!isPreview && isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
          ${!isPreview && isHovered && !isSelected ? 'ring-1 ring-gray-300' : ''}
          ${!isPreview ? 'cursor-pointer' : ''}
          transition-all duration-200
        `}
      >
        {renderContent()}
      </div>
    </div>
  );
}