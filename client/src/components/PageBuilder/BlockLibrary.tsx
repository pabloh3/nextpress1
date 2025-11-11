import { useState } from 'react';
import { Draggable, Droppable } from '@/lib/dnd';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { blockRegistry } from './blocks';
import { Box, ChevronDown, ChevronRight } from 'lucide-react';

// Utility function to truncate single words longer than 6 characters
const truncateBlockName = (name: string): string => {
  const words = name.trim().split(/\s+/);

  // Only truncate if it's a single word and longer than 6 characters
  if (words.length === 1 && words[0].length > 8) {
    return words[0].slice(0, 8) + '..';
  }

  return name;
};

// Dedupe by block definition id to avoid showing aliases (e.g., "heading" vs "core/heading")
if (import.meta.env.DEBUG_BUILDER) {
  console.log('blockRegistry:', blockRegistry);
}

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

  // State to track which categories are open (all open by default)
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>(
    categories.reduce(
      (acc, category) => ({
        ...acc,
        [category.id]: true,
      }),
      {}
    )
  );

  const toggleCategory = (categoryId: string) => {
    setOpenCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  return (
    <div className="space-y-4">
      {categories.map((category) => {
        const startIndex = globalIndex;
        globalIndex += category.blocks.length;

        return (
          <Card
            key={category.id}
            className="border border-gray-200 bg-white shadow-sm rounded-none">
            <Collapsible
              open={openCategories[category.id]}
              onOpenChange={() => toggleCategory(category.id)}>
              <CardHeader className="p-0">
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-between p-4 h-auto font-semibold text-sm text-gray-800 hover:text-gray-900 hover:bg-gray-50">
                    <span>{category.name}</span>
                    {openCategories[category.id] ? (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-500" />
                    )}
                  </Button>
                </CollapsibleTrigger>
              </CardHeader>
              <CollapsibleContent>
                <CardContent className="pt-0 pb-4 pl-4 pr-6">
                  <Droppable
                    droppableId={`block-library-${category.id}`}
                    isDropDisabled={true}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
                                data-dnd-debug-id={block.id}
                                title={block.description}
                                className={`cursor-grab bg-white text-gray-700 border border-gray-200 rounded-none hover:bg-gray-50 hover:border-gray-300 hover:shadow-md hover:scale-[1.02] transition-all duration-200 ease-out ${
                                  snapshot.isDragging
                                    ? 'opacity-60 scale-105 border-gray-400 shadow-xl bg-gray-50'
                                    : ''
                                }`}>
                                <CardContent className="p-4">
                                  <div className="flex flex-col items-center gap-3 text-center overflow-ellipsis">
                                    <div className="w-10 h-10 bg-gray-100 rounded-none flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                                      {block.icon ? (
                                        <block.icon className="w-5 h-5 text-gray-600" />
                                      ) : (
                                        <Box className="w-5 h-5 text-gray-600" />
                                      )}
                                    </div>
                                    <p className="text-sm font-medium text-gray-800 w-full leading-snug">
                                      {truncateBlockName(block.label)}
                                    </p>
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
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        );
      })}
    </div>
  );
}
