import React from "react";
import type { BlockConfig } from "@shared/schema";
import type { BlockDefinition } from "../types.ts";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Droppable, Draggable } from "@hello-pangea/dnd";
import BlockRenderer from "../../BlockRenderer";
import { Package as GroupIcon } from "lucide-react";

function GroupRenderer({ block, isPreview }: { block: BlockConfig; isPreview: boolean }) {
  const blocks: BlockConfig[] = Array.isArray((block.content as any)?.innerBlocks)
    ? (block.content as any).innerBlocks
    : [];

  const tagName = (block.content as any)?.tagName || 'div';
  const className = [
    "wp-block-group",
    block.content?.className || "",
  ].filter(Boolean).join(" ");

  const TagName = tagName as keyof JSX.IntrinsicElements;

  return (
    <TagName
      className={className}
      style={{
        ...block.styles,
        padding: block.styles?.padding || '1.25em 2.375em',
      }}
    >
      <div className="wp-block-group__inner-container">
        {!isPreview ? (
          <Droppable
            droppableId={`${block.id}:inner`}
            direction="vertical"
          >
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                style={{
                  minHeight: blocks.length === 0 ? '120px' : 'auto',
                  border: snapshot.isDraggingOver ? '2px solid #3b82f6' : '2px dashed transparent',
                  borderRadius: '4px',
                  background: snapshot.isDraggingOver ? 'rgba(59,130,246,0.06)' : undefined,
                }}
              >
                {blocks.length > 0 ? (
                  blocks.map((child: BlockConfig, childIndex: number) => (
                    <Draggable key={child.id} draggableId={child.id} index={childIndex}>
                      {(dragProvided, dragSnapshot) => (
                        <div
                          ref={dragProvided.innerRef}
                          {...dragProvided.draggableProps}
                          {...dragProvided.dragHandleProps}
                          className={`relative group ${dragSnapshot.isDragging ? 'opacity-50' : ''}`}
                        >
                          <BlockRenderer
                            block={child}
                            isSelected={false}
                            isPreview={isPreview}
                            onDuplicate={() => {}}
                            onDelete={() => {}}
                          />
                        </div>
                      )}
                    </Draggable>
                  ))
                ) : (
                  <div className="text-center text-gray-400 p-8">
                    Group Block
                    <br />
                    <small>Drag blocks here to group them</small>
                  </div>
                )}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        ) : (
          <div>
            {blocks.map((child: BlockConfig) => (
              <BlockRenderer
                key={child.id}
                block={child}
                isSelected={false}
                isPreview={isPreview}
                onDuplicate={() => {}}
                onDelete={() => {}}
              />
            ))}
          </div>
        )}
      </div>
    </TagName>
  );
}

function GroupSettings({ block, onUpdate }: { block: BlockConfig; onUpdate: (updates: Partial<BlockConfig>) => void }) {
  const updateContent = (contentUpdates: any) => {
    onUpdate({
      content: {
        ...block.content,
        ...contentUpdates,
      },
    });
  };

  const updateStyles = (styleUpdates: any) => {
    onUpdate({
      styles: {
        ...block.styles,
        ...styleUpdates,
      },
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="group-tag">HTML Tag</Label>
        <Select
          value={(block.content as any)?.tagName || 'div'}
          onValueChange={(value) => updateContent({ tagName: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="div">div</SelectItem>
            <SelectItem value="section">section</SelectItem>
            <SelectItem value="article">article</SelectItem>
            <SelectItem value="main">main</SelectItem>
            <SelectItem value="header">header</SelectItem>
            <SelectItem value="footer">footer</SelectItem>
            <SelectItem value="aside">aside</SelectItem>
            <SelectItem value="nav">nav</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="group-background">Background Color</Label>
        <Input
          id="group-background"
          type="color"
          value={block.styles?.backgroundColor || "#ffffff"}
          onChange={(e) => updateStyles({ backgroundColor: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="group-padding">Padding</Label>
        <Input
          id="group-padding"
          value={block.styles?.padding || "1.25em 2.375em"}
          onChange={(e) => updateStyles({ padding: e.target.value })}
          placeholder="e.g. 20px, 1em 2em"
        />
      </div>
      <div>
        <Label htmlFor="group-class">Additional CSS Class(es)</Label>
        <Input
          id="group-class"
          value={block.content?.className || ''}
          onChange={(e) => updateContent({ className: e.target.value })}
          placeholder="e.g. has-background is-style-rounded"
        />
      </div>
    </div>
  );
}

const GroupBlock: BlockDefinition = {
  id: 'core/group',
  name: 'Group',
  icon: GroupIcon,
  description: 'Gather blocks in a layout container',
  category: 'layout',
  defaultContent: {
    tagName: 'div',
    innerBlocks: [],
    className: '',
  },
  defaultStyles: {
    padding: '1.25em 2.375em',
  },
  renderer: GroupRenderer,
  settings: GroupSettings,
};

export default GroupBlock;