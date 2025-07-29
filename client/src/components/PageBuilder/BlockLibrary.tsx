import { Draggable, Droppable } from "react-beautiful-dnd";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Type, 
  Heading1, 
  MousePointer, 
  Image, 
  Video, 
  Minus, 
  Space,
  FileText,
  Grid3x3,
  Quote,
  List,
  Link2
} from "lucide-react";

interface BlockType {
  id: string;
  name: string;
  icon: any;
  description: string;
  category: 'basic' | 'media' | 'layout' | 'advanced';
}

const blockTypes: BlockType[] = [
  {
    id: 'heading',
    name: 'Heading',
    icon: Heading1,
    description: 'Add a heading text',
    category: 'basic'
  },
  {
    id: 'text',
    name: 'Text',
    icon: Type,
    description: 'Add a paragraph of text',
    category: 'basic'
  },
  {
    id: 'button',
    name: 'Button',
    icon: MousePointer,
    description: 'Add a clickable button',
    category: 'basic'
  },
  {
    id: 'image',
    name: 'Image',
    icon: Image,
    description: 'Add an image',
    category: 'media'
  },
  {
    id: 'video',
    name: 'Video',
    icon: Video,
    description: 'Add a video player',
    category: 'media'
  },
  {
    id: 'spacer',
    name: 'Spacer',
    icon: Space,
    description: 'Add vertical spacing',
    category: 'layout'
  },
  {
    id: 'divider',
    name: 'Divider',
    icon: Minus,
    description: 'Add a horizontal line',
    category: 'layout'
  },
  {
    id: 'columns',
    name: 'Columns',
    icon: Grid3x3,
    description: 'Add multi-column layout',
    category: 'layout'
  },
  {
    id: 'quote',
    name: 'Quote',
    icon: Quote,
    description: 'Add a blockquote',
    category: 'advanced'
  },
  {
    id: 'list',
    name: 'List',
    icon: List,
    description: 'Add a bulleted or numbered list',
    category: 'advanced'
  }
];

const categories = [
  { id: 'basic', name: 'Basic', blocks: blockTypes.filter(b => b.category === 'basic') },
  { id: 'media', name: 'Media', blocks: blockTypes.filter(b => b.category === 'media') },
  { id: 'layout', name: 'Layout', blocks: blockTypes.filter(b => b.category === 'layout') },
  { id: 'advanced', name: 'Advanced', blocks: blockTypes.filter(b => b.category === 'advanced') },
];

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