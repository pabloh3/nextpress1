import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Trash2, Move } from "lucide-react";
import type { BlockConfig } from "@shared/schema";

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
    switch (block.type) {
      case 'heading':
        const HeadingTag = `h${block.content.level}` as keyof JSX.IntrinsicElements;
        return (
          <HeadingTag style={block.styles}>
            {block.content.text}
          </HeadingTag>
        );

      case 'text':
        const TextTag = block.content.tag || 'p';
        return (
          <TextTag style={block.styles}>
            {block.content.text}
          </TextTag>
        );

      case 'button':
        return (
          <a
            href={block.content.url}
            target={block.content.target}
            style={block.styles}
            className="inline-block text-decoration-none"
            onClick={(e) => isPreview ? undefined : e.preventDefault()}
          >
            {block.content.text}
          </a>
        );

      case 'image':
        return (
          <div style={{ padding: block.styles.padding, margin: block.styles.margin }}>
            <img
              src={block.content.src}
              alt={block.content.alt}
              style={{
                ...block.styles,
                padding: 0,
                margin: 0,
              }}
            />
            {block.content.caption && (
              <p className="text-sm text-gray-600 mt-2 text-center">
                {block.content.caption}
              </p>
            )}
          </div>
        );

      case 'video':
        return (
          <div style={{ padding: block.styles.padding, margin: block.styles.margin }}>
            <video
              src={block.content.src}
              poster={block.content.poster}
              controls={block.content.controls !== false}
              autoPlay={block.content.autoplay}
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

      case 'spacer':
        return (
          <div
            style={{
              height: `${block.content.height}px`,
              ...block.styles,
            }}
          />
        );

      case 'divider':
        return (
          <div style={{ padding: block.styles.padding, margin: block.styles.margin }}>
            <hr
              style={{
                borderStyle: block.content.style,
                borderWidth: '1px 0 0 0',
                borderColor: block.content.color,
                width: `${block.content.width}%`,
                margin: '0 auto',
              }}
            />
          </div>
        );

      case 'columns':
        return (
          <div 
            style={{
              ...block.styles,
              display: 'flex',
              gap: '20px',
            }}
          >
            {block.content.columns?.map((column: any, index: number) => (
              <div
                key={index}
                style={{
                  flex: column.width || 1,
                  padding: '20px',
                  border: '2px dashed #e2e8f0',
                  borderRadius: '4px',
                  minHeight: '100px',
                }}
              >
                <div className="text-center text-gray-400">
                  Column {index + 1}
                  <br />
                  <small>Drag blocks here</small>
                </div>
              </div>
            )) || (
              <>
                <div className="flex-1 p-4 border-2 border-dashed border-gray-300 rounded">
                  <div className="text-center text-gray-400">
                    Column 1<br /><small>Drag blocks here</small>
                  </div>
                </div>
                <div className="flex-1 p-4 border-2 border-dashed border-gray-300 rounded">
                  <div className="text-center text-gray-400">
                    Column 2<br /><small>Drag blocks here</small>
                  </div>
                </div>
              </>
            )}
          </div>
        );

      case 'quote':
        return (
          <blockquote
            style={{
              ...block.styles,
              borderLeft: '4px solid #e2e8f0',
              paddingLeft: '20px',
              fontStyle: 'italic',
            }}
          >
            {block.content.text}
            {block.content.author && (
              <cite style={{ display: 'block', marginTop: '10px', fontSize: '0.9em' }}>
                — {block.content.author}
              </cite>
            )}
          </blockquote>
        );

      case 'list':
        const ListTag = block.content.ordered ? 'ol' : 'ul';
        return (
          <ListTag style={block.styles}>
            {block.content.items?.map((item: string, index: number) => (
              <li key={index}>{item}</li>
            )) || (
              <>
                <li>List item 1</li>
                <li>List item 2</li>
                <li>List item 3</li>
              </>
            )}
          </ListTag>
        );

      default:
        return (
          <div style={block.styles} className="p-4 border border-dashed border-gray-300 rounded">
            <div className="text-center text-gray-400">
              {block.type} block
              <br />
              <small>Not implemented yet</small>
            </div>
          </div>
        );
    }
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