import React from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import DevicePreview from './DevicePreview';
import BlockRenderer from './BlockRenderer';
import { Layers } from 'lucide-react';

export function BuilderCanvas({
  blocks,
  deviceView,
  selectedBlockId,
  setSelectedBlockId,
  setActiveTab,
  isPreviewMode,
  duplicateBlock,
  deleteBlock,
  hoverHighlight,
}: {
  blocks: any[];
  deviceView: 'desktop' | 'tablet' | 'mobile';
  selectedBlockId: string | null;
  setSelectedBlockId: (id: string) => void;
  setActiveTab: (tab: 'blocks' | 'settings') => void;
  isPreviewMode: boolean;
  duplicateBlock: (blockId: string) => void;
  deleteBlock: (blockId: string) => void;
  hoverHighlight: 'padding' | 'margin' | null;
}) {
  return (
    <div className="flex-1 overflow-auto bg-gray-100 p-8 min-h-0">
      <DevicePreview device={deviceView}>
        <div className="bg-white min-h-full shadow-lg">
          <Droppable droppableId="canvas">
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`min-h-full p-4 ${snapshot.isDraggingOver ? 'bg-blue-50' : ''}`}
              >
                {blocks.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <Layers className="w-12 h-12 mx-auto mb-4" />
                    <p>Drag blocks from the sidebar to start building your page</p>
                  </div>
                ) : (
                  blocks.map((block, index) => (
                    <Draggable key={block.id} draggableId={block.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`relative group ${snapshot.isDragging ? 'opacity-50' : ''} ${selectedBlockId === block.id ? 'ring-2 ring-blue-500' : ''}`}
                          onClick={() => {
                            setSelectedBlockId(block.id);
                            setActiveTab('settings');
                          }}
                        >
                          <BlockRenderer
                            block={block}
                            isSelected={selectedBlockId === block.id}
                            isPreview={isPreviewMode}
                            onDuplicate={() => duplicateBlock(block.id)}
                            onDelete={() => deleteBlock(block.id)}
                            hoverHighlight={selectedBlockId === block.id ? hoverHighlight : null}
                          />
                        </div>
                      )}
                    </Draggable>
                  ))
                )}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>
      </DevicePreview>
    </div>
  );
}
