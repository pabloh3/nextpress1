import { Draggable, Droppable } from "@hello-pangea/dnd";
import { Card, CardContent } from "@/components/ui/card";
import { blockRegistry } from "./blocks";

// Dedupe by block definition id to avoid showing aliases (e.g., "heading" vs "core/heading")
const allBlocks = Object.values(blockRegistry).filter((block, index, arr) =>
  arr.findIndex((b) => b.id === block.id) === index
);

const categories = [
  { id: 'basic', name: 'Basic', blocks: allBlocks.filter(b => b.category === 'basic') },
  { id: 'media', name: 'Media', blocks: allBlocks.filter(b => b.category === 'media') },
  { id: 'layout', name: 'Layout', blocks: allBlocks.filter(b => b.category === 'layout') },
  { id: 'advanced', name: 'Advanced', blocks: allBlocks.filter(b => b.category === 'advanced') },
].filter(c => c.blocks.length > 0);

export default function BlockLibrary() {
  return (
    <div className="space-y-6">
      {categories.map((category) => (
        <div key={category.id}>
          <h3 className="text-sm font-medium text-gray-700 mb-3">{category.name}</h3>
          <Droppable droppableId="block-library" isDropDisabled={true}>
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="space-y-2"
              >
                {category.blocks.map((block, index) => (
                  <Draggable
                    key={block.id}
                    draggableId={block.id}
                    index={index}
                  >
                    {(provided, snapshot) => (
                      <Card
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={`cursor-grab hover:shadow-md transition-shadow ${
                          snapshot.isDragging ? 'opacity-50' : ''
                        }`}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                              <block.icon className="w-4 h-4 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900">{block.name}</p>
                              <p className="text-xs text-gray-500 truncate">{block.description}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>
      ))}
    </div>
  );
}