import { Draggable, Droppable } from '@hello-pangea/dnd';
import { Card, CardContent } from '@/components/ui/card';
import { blockRegistry } from './blocks';
import { Box } from 'lucide-react';

// Dedupe by block definition id to avoid showing aliases (e.g., "heading" vs "core/heading")
const allBlocks = Object.values(blockRegistry).filter(
  (block, index, arr) => arr.findIndex((b) => b.id === block.id) === index
);

let categories = [
  {
    id: 'basic',
    name: 'Basic',
    blocks: allBlocks.filter((b: any) => b.category === 'basic'),
  },
  {
    id: 'media',
    name: 'Media',
    blocks: allBlocks.filter((b: any) => b.category === 'media'),
  },
  {
    id: 'layout',
    name: 'Layout',
    blocks: allBlocks.filter((b: any) => b.category === 'layout'),
  },
  {
    id: 'advanced',
    name: 'Advanced',
    blocks: allBlocks.filter((b: any) => b.category === 'advanced'),
  },
].filter((c) => c.blocks.length > 0);

// Fallback when blocks have no categories (e.g., in tests with mocked registry)
if (categories.length === 0 && allBlocks.length > 0) {
  categories = [{ id: 'all', name: 'All Blocks', blocks: allBlocks as any[] }];
}

export default function BlockLibrary() {
  // Calculate continuous index across all categories to avoid duplicate indexes
  let globalIndex = 0;

  return (
    <div className="space-y-6">
      {categories.map((category) => {
        const startIndex = globalIndex;
        globalIndex += category.blocks.length;

        return (
          <div key={category.id}>
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              {category.name}
            </h3>
            <Droppable
              droppableId={`block-library-${category.id}`}
              isDropDisabled={true}>
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="space-y-2">
                  {category.blocks.map((block: any, index: number) => (
                    <Draggable
                      key={block.id}
                      draggableId={block.id}
                      index={startIndex + index}>
                      {(provided, snapshot) => (
                        <Card
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`cursor-grab hover:shadow-md transition-shadow ${
                            snapshot.isDragging ? 'opacity-50' : ''
                          }`}>
                          <CardContent className="p-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                                {block.icon ? (
                                  <block.icon className="w-4 h-4 text-blue-600" />
                                ) : (
                                  <Box className="w-4 h-4 text-blue-600" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {block.name}
                                </p>
                                {block.description && (
                                  <p className="text-xs text-gray-500 truncate">
                                    {block.description}
                                  </p>
                                )}
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
        );
      })}
    </div>
  );
}
