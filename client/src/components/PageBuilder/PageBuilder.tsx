import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Save, Eye, Smartphone, Tablet, Monitor, Plus, Settings, Layers } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Post, Template, BlockConfig } from "@shared/schema";
import BlockLibrary from "./BlockLibrary";
import BlockRenderer from "./BlockRenderer";
import BlockSettings from "./BlockSettings";
import DevicePreview from "./DevicePreview";
import { generateBlockId } from "./utils";

interface PageBuilderProps {
  post?: Post | Template;
  template?: Template;
  onSave?: (updatedData: Post | Template) => void;
  onPreview?: () => void;
}

export default function PageBuilder({ post, template, onSave, onPreview }: PageBuilderProps) {
  const data = template || post;
  const isTemplate = !!template;
  
  const [blocks, setBlocks] = useState<BlockConfig[]>(
    data?.builderData ? (data.builderData as BlockConfig[]) : []
  );
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [deviceView, setDeviceView] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const selectedBlock = blocks.find(block => block.id === selectedBlockId);

  const saveMutation = useMutation({
    mutationFn: async (builderData: BlockConfig[]) => {
      if (isTemplate) {
        return await apiRequest('PUT', `/api/templates/${data!.id}`, {
          builderData,
        });
      } else {
        return await apiRequest('PUT', `/api/posts/${data!.id}`, {
          builderData,
          usePageBuilder: true
        });
      }
    },
    onSuccess: (updatedData) => {
      toast({
        title: "Success",
        description: `${isTemplate ? 'Template' : 'Page'} saved successfully`,
      });
      onSave?.(updatedData);
      queryClient.invalidateQueries({ 
        queryKey: isTemplate ? ['/api/templates'] : ['/api/posts'] 
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: `Failed to save ${isTemplate ? 'template' : 'page'}`,
        variant: "destructive",
      });
    },
  });

  const handleDragEnd = useCallback((result: any) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;

    // Handle drag from block library to canvas
    if (source.droppableId === 'block-library' && destination.droppableId === 'canvas') {
      const blockType = draggableId;
      const newBlock = createDefaultBlock(blockType);
      const newBlocks = [...blocks];
      newBlocks.splice(destination.index, 0, newBlock);
      setBlocks(newBlocks);
      setSelectedBlockId(newBlock.id);
      return;
    }

    // Handle reordering blocks in canvas
    if (source.droppableId === 'canvas' && destination.droppableId === 'canvas') {
      const newBlocks = Array.from(blocks);
      const [removed] = newBlocks.splice(source.index, 1);
      newBlocks.splice(destination.index, 0, removed);
      setBlocks(newBlocks);
      return;
    }
  }, [blocks]);

  const createDefaultBlock = (type: string): BlockConfig => {
    const id = generateBlockId();
    const baseBlock = {
      id,
      type,
      styles: {
        padding: '20px',
        margin: '0px',
      },
      settings: {},
    };

    switch (type) {
      case 'heading':
        return {
          ...baseBlock,
          content: {
            text: 'Add your heading',
            level: 2,
          },
          styles: {
            ...baseBlock.styles,
            fontSize: '32px',
            fontWeight: 'bold',
            color: '#000000',
            textAlign: 'left',
          },
        };
      case 'text':
        return {
          ...baseBlock,
          content: {
            text: 'Add your text content here. You can edit this text and customize its appearance.',
            tag: 'p',
          },
          styles: {
            ...baseBlock.styles,
            fontSize: '16px',
            lineHeight: '1.6',
            color: '#333333',
          },
        };
      case 'button':
        return {
          ...baseBlock,
          content: {
            text: 'Click Me',
            url: '#',
            target: '_self',
          },
          styles: {
            ...baseBlock.styles,
            backgroundColor: '#007cba',
            color: '#ffffff',
            padding: '12px 24px',
            borderRadius: '4px',
            border: 'none',
            fontSize: '16px',
            textAlign: 'center',
            display: 'inline-block',
            cursor: 'pointer',
          },
        };
      case 'image':
        return {
          ...baseBlock,
          content: {
            src: 'https://via.placeholder.com/600x300?text=Add+Your+Image',
            alt: 'Placeholder image',
            caption: '',
          },
          styles: {
            ...baseBlock.styles,
            width: '100%',
            height: 'auto',
          },
        };
      case 'spacer':
        return {
          ...baseBlock,
          content: {
            height: 50,
          },
          styles: {
            ...baseBlock.styles,
            padding: '0px',
          },
        };
      case 'divider':
        return {
          ...baseBlock,
          content: {
            style: 'solid',
            width: 100,
            color: '#cccccc',
          },
          styles: {
            ...baseBlock.styles,
            padding: '20px 0px',
          },
        };
      default:
        return baseBlock;
    }
  };

  const updateBlock = useCallback((blockId: string, updates: Partial<BlockConfig>) => {
    setBlocks(prev => prev.map(block => 
      block.id === blockId 
        ? { ...block, ...updates }
        : block
    ));
  }, []);

  const duplicateBlock = useCallback((blockId: string) => {
    const blockIndex = blocks.findIndex(block => block.id === blockId);
    if (blockIndex >= 0) {
      const blockToDuplicate = blocks[blockIndex];
      const duplicatedBlock = {
        ...blockToDuplicate,
        id: generateBlockId(),
      };
      const newBlocks = [...blocks];
      newBlocks.splice(blockIndex + 1, 0, duplicatedBlock);
      setBlocks(newBlocks);
      setSelectedBlockId(duplicatedBlock.id);
    }
  }, [blocks]);

  const deleteBlock = useCallback((blockId: string) => {
    setBlocks(prev => prev.filter(block => block.id !== blockId));
    if (selectedBlockId === blockId) {
      setSelectedBlockId(null);
    }
  }, [selectedBlockId]);

  const handleSave = () => {
    saveMutation.mutate(blocks);
  };

  const handlePreview = () => {
    setIsPreviewMode(!isPreviewMode);
    onPreview?.();
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <DragDropContext onDragEnd={handleDragEnd}>
        {/* Sidebar - Block Library and Settings */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Page Builder</h2>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreview}
                  className="flex items-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  Preview
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={saveMutation.isPending}
                  className="flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {saveMutation.isPending ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>
          </div>

          <Tabs defaultValue="blocks" className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-2 mx-4 mt-4">
              <TabsTrigger value="blocks" className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Blocks
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="blocks" className="flex-1 px-4 pb-4">
              <ScrollArea className="h-full">
                <BlockLibrary />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="settings" className="flex-1 px-4 pb-4">
              <ScrollArea className="h-full">
                {selectedBlock ? (
                  <BlockSettings
                    block={selectedBlock}
                    onUpdate={(updates) => updateBlock(selectedBlock.id, updates)}
                  />
                ) : (
                  <div className="text-center text-gray-500 mt-8">
                    Select a block to edit its settings
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>

        {/* Main Canvas Area */}
        <div className="flex-1 flex flex-col">
          {/* Top Bar */}
          <div className="bg-white border-b border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h3 className="font-medium">{post.title}</h3>
                <Separator orientation="vertical" className="h-6" />
                <div className="flex items-center gap-2">
                  <Button
                    variant={deviceView === 'desktop' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setDeviceView('desktop')}
                  >
                    <Monitor className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={deviceView === 'tablet' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setDeviceView('tablet')}
                  >
                    <Tablet className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={deviceView === 'mobile' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setDeviceView('mobile')}
                  >
                    <Smartphone className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="text-sm text-gray-500">
                {blocks.length} blocks
              </div>
            </div>
          </div>

          {/* Canvas */}
          <div className="flex-1 overflow-auto bg-gray-100 p-8">
            <DevicePreview device={deviceView}>
              <div className="bg-white min-h-screen shadow-lg">
                <Droppable droppableId="canvas">
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`min-h-full p-4 ${
                        snapshot.isDraggingOver ? 'bg-blue-50' : ''
                      }`}
                    >
                      {blocks.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                          <Layers className="w-12 h-12 mx-auto mb-4" />
                          <p>Drag blocks from the sidebar to start building your page</p>
                        </div>
                      ) : (
                        blocks.map((block, index) => (
                          <Draggable
                            key={block.id}
                            draggableId={block.id}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`relative group ${
                                  snapshot.isDragging ? 'opacity-50' : ''
                                } ${
                                  selectedBlockId === block.id ? 'ring-2 ring-blue-500' : ''
                                }`}
                                onClick={() => setSelectedBlockId(block.id)}
                              >
                                <BlockRenderer
                                  block={block}
                                  isSelected={selectedBlockId === block.id}
                                  isPreview={isPreviewMode}
                                  onDuplicate={() => duplicateBlock(block.id)}
                                  onDelete={() => deleteBlock(block.id)}
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
        </div>
      </DragDropContext>
    </div>
  );
}