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
import PublishDialog from "./PublishDialog";
import { generateBlockId } from "./utils";
import { getDefaultBlock } from "./blocks";

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
    data ? (isTemplate ? ((data as any).blocks as BlockConfig[]) : ((data as any).builderData as BlockConfig[])) || [] : []
  );
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [deviceView, setDeviceView] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'blocks' | 'settings'>('blocks');
  const [hoverHighlight, setHoverHighlight] = useState<'padding' | 'margin' | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const selectedBlock = blocks.find(block => block.id === selectedBlockId);

  const saveMutation = useMutation({
    mutationFn: async (builderData: BlockConfig[]) => {
      if (isTemplate) {
        const response = await apiRequest('PUT', `/api/templates/${data!.id}`, {
          blocks: builderData,
        });
        return await response.json();
      } else {
        const response = await apiRequest('PUT', `/api/posts/${data!.id}`, {
          builderData,
          usePageBuilder: true
        });
        return await response.json();
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

    const parseColumnDroppable = (id: string): null | { blockId: string; columnIndex: number } => {
      const match = id.match(/^(.*?):column:(\d+)$/);
      if (!match) return null;
      return { blockId: match[1], columnIndex: parseInt(match[2], 10) };
    };

    const sourceCol = parseColumnDroppable(source.droppableId);
    const destCol = parseColumnDroppable(destination.droppableId);

    // Handle drag from block library to canvas
    if (source.droppableId === 'block-library' && destination.droppableId === 'canvas') {
      const blockType = draggableId;
      const newBlock = createDefaultBlock(blockType);
      const newBlocks = [...blocks];
      newBlocks.splice(destination.index, 0, newBlock);
      setBlocks(newBlocks);
      setSelectedBlockId(newBlock.id);
      setActiveTab('settings');
      return;
    }

    // Handle drag from block library to a column
    if (source.droppableId === 'block-library' && destCol) {
      const blockType = draggableId;
      const newChild = createDefaultBlock(blockType);
      const blocksCopy = [...blocks];
      const columnsBlockIndex = blocksCopy.findIndex((b) => b.id === destCol.blockId);
      if (columnsBlockIndex === -1) return;
      const columnsBlock = blocksCopy[columnsBlockIndex];
      const columnsArr: any[] = Array.isArray((columnsBlock.content as any)?.columns)
        ? [ ...(columnsBlock.content as any).columns ]
        : [];
      const targetColumn = { ...(columnsArr[destCol.columnIndex] || { width: 1, blocks: [] }) } as any;
      const targetBlocks: BlockConfig[] = Array.isArray(targetColumn.blocks) ? [ ...targetColumn.blocks ] : [];
      targetBlocks.splice(destination.index, 0, newChild);
      targetColumn.blocks = targetBlocks;
      columnsArr[destCol.columnIndex] = targetColumn;
      blocksCopy[columnsBlockIndex] = {
        ...columnsBlock,
        content: { ...(columnsBlock.content || {}), columns: columnsArr },
      } as any;
      setBlocks(blocksCopy);
      setSelectedBlockId(newChild.id);
      setActiveTab('settings');
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

    // Move from canvas to a column
    if (source.droppableId === 'canvas' && destCol) {
      const blocksCopy = [...blocks];
      const [moved] = blocksCopy.splice(source.index, 1);
      const columnsBlockIndex = blocksCopy.findIndex((b) => b.id === destCol.blockId);
      if (columnsBlockIndex === -1) return;
      const columnsBlock = blocksCopy[columnsBlockIndex];
      const columnsArr: any[] = Array.isArray((columnsBlock.content as any)?.columns)
        ? [ ...(columnsBlock.content as any).columns ]
        : [];
      const targetColumn = { ...(columnsArr[destCol.columnIndex] || { width: 1, blocks: [] }) } as any;
      const targetBlocks: BlockConfig[] = Array.isArray(targetColumn.blocks) ? [ ...targetColumn.blocks ] : [];
      targetBlocks.splice(destination.index, 0, moved);
      targetColumn.blocks = targetBlocks;
      columnsArr[destCol.columnIndex] = targetColumn;
      blocksCopy[columnsBlockIndex] = {
        ...columnsBlock,
        content: { ...(columnsBlock.content || {}), columns: columnsArr },
      } as any;
      setBlocks(blocksCopy);
      return;
    }

    // Move from a column to canvas
    if (sourceCol && destination.droppableId === 'canvas') {
      const blocksCopy = [...blocks];
      const columnsBlockIndex = blocksCopy.findIndex((b) => b.id === sourceCol.blockId);
      if (columnsBlockIndex === -1) return;
      const columnsBlock = blocksCopy[columnsBlockIndex];
      const columnsArr: any[] = Array.isArray((columnsBlock.content as any)?.columns)
        ? [ ...(columnsBlock.content as any).columns ]
        : [];
      const fromColumn = { ...(columnsArr[sourceCol.columnIndex] || { width: 1, blocks: [] }) } as any;
      const fromBlocks: BlockConfig[] = Array.isArray(fromColumn.blocks) ? [ ...fromColumn.blocks ] : [];
      const [moved] = fromBlocks.splice(source.index, 1);
      fromColumn.blocks = fromBlocks;
      columnsArr[sourceCol.columnIndex] = fromColumn;
      blocksCopy[columnsBlockIndex] = {
        ...columnsBlock,
        content: { ...(columnsBlock.content || {}), columns: columnsArr },
      } as any;
      blocksCopy.splice(destination.index, 0, moved);
      setBlocks(blocksCopy);
      return;
    }

    // Reorder within a column or move between columns
    if (sourceCol && destCol) {
      const blocksCopy = [...blocks];
      const columnsBlockIndex = blocksCopy.findIndex((b) => b.id === sourceCol.blockId);
      if (columnsBlockIndex === -1) return;
      const columnsBlock = blocksCopy[columnsBlockIndex];
      const columnsArr: any[] = Array.isArray((columnsBlock.content as any)?.columns)
        ? [ ...(columnsBlock.content as any).columns ]
        : [];
      const fromColumn = { ...(columnsArr[sourceCol.columnIndex] || { width: 1, blocks: [] }) } as any;
      const toColumn = sourceCol.columnIndex === destCol.columnIndex
        ? fromColumn
        : { ...(columnsArr[destCol.columnIndex] || { width: 1, blocks: [] }) } as any;

      const fromBlocks: BlockConfig[] = Array.isArray(fromColumn.blocks) ? [ ...fromColumn.blocks ] : [];
      const [moved] = fromBlocks.splice(source.index, 1);
      fromColumn.blocks = fromBlocks;

      const toBlocks: BlockConfig[] = Array.isArray(toColumn.blocks) ? [ ...toColumn.blocks ] : [];
      toBlocks.splice(destination.index, 0, moved);
      toColumn.blocks = toBlocks;

      columnsArr[sourceCol.columnIndex] = fromColumn;
      columnsArr[destCol.columnIndex] = toColumn;
      blocksCopy[columnsBlockIndex] = {
        ...columnsBlock,
        content: { ...(columnsBlock.content || {}), columns: columnsArr },
      } as any;
      setBlocks(blocksCopy);
      return;
    }
  }, [blocks]);

  const createDefaultBlock = (type: string): BlockConfig => {
    const id = generateBlockId();
    const fromRegistry = getDefaultBlock(type, id);
    if (fromRegistry) return fromRegistry;
    const baseBlock = {
      id,
      type,
      styles: {
        padding: '20px',
        margin: '0px',
        contentAlignHorizontal: 'left',
        contentAlignVertical: 'top',
      },
      settings: {},
    };

    switch (type) {
      case 'heading':
      case 'core/heading':
        return {
          ...baseBlock,
          content: {
            content: 'Add your heading',
            level: 2,
            textAlign: 'left',
            anchor: '',
            className: '',
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
      case 'core/paragraph':
        return {
          ...baseBlock,
          content: {
            content: 'Add your text content here. You can edit this text and customize its appearance.',
            align: 'left',
            dropCap: false,
            anchor: '',
            className: '',
          },
          styles: {
            ...baseBlock.styles,
            fontSize: '16px',
            lineHeight: '1.6',
            color: '#333333',
          },
        };
      case 'button':
      case 'core/button':
        return {
          ...baseBlock,
          content: {
            text: 'Click Me',
            url: '#',
            linkTarget: '_self',
            rel: '',
            title: '',
            className: '',
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
      case 'core/image':
        return {
          ...baseBlock,
          content: {
            url: 'https://via.placeholder.com/600x300?text=Add+Your+Image',
            alt: 'Placeholder image',
            caption: '',
            id: undefined,
            sizeSlug: 'full',
            align: '',
            linkDestination: 'none',
            href: '',
            linkTarget: '_self',
            rel: '',
            title: '',
            className: '',
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
        return {
          ...baseBlock,
          content: {},
        };
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
      setActiveTab('settings');
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
    // Generate preview URL based on content type and ID
    let previewUrl = '';
    
    if (isTemplate && data) {
      previewUrl = `/preview/template/${data.id}`;
    } else if (data) {
      const postType = (data as any).type === 'page' ? 'page' : 'post';
      previewUrl = `/preview/${postType}/${data.id}`;
    }
    
    if (previewUrl) {
      // Open preview in new tab
      window.open(previewUrl, '_blank');
    } else {
      // Fallback to old behavior if no ID available
      setIsPreviewMode(!isPreviewMode);
    }
    
    onPreview?.();
  };

  return (
    <div className="flex h-full bg-gray-50">
      <DragDropContext onDragEnd={handleDragEnd}>
        {/* Sidebar - Block Library and Settings */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col min-h-0">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">Page Builder</h2>
          </div>

          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'blocks' | 'settings')} className="flex-1 flex flex-col p-4 min-h-0">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="blocks" className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Blocks
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="blocks" className="flex-1 mt-4 overflow-hidden">
              <ScrollArea className="h-full">
                <BlockLibrary />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="settings" className="flex-1 mt-4 overflow-hidden">
              <ScrollArea className="h-full">
                {selectedBlock ? (
                  <BlockSettings
                    block={selectedBlock}
                    onUpdate={(updates) => updateBlock(selectedBlock.id, updates)}
                    onHoverArea={(area) => setHoverHighlight(area)}
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
                <h3 className="font-medium">{data ? (isTemplate ? (data as any).name : (data as any).title) : 'Untitled'}</h3>
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
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-500">
                  {blocks.length} blocks
                </div>
                <Separator orientation="vertical" className="h-6" />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePreview}
                    className="flex items-center gap-2"
                    data-testid="button-preview"
                  >
                    <Eye className="w-4 h-4" />
                    Preview
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={saveMutation.isPending}
                    className="flex items-center gap-2"
                    data-testid="button-save"
                  >
                    <Save className="w-4 h-4" />
                    {saveMutation.isPending ? 'Saving...' : 'Save'}
                  </Button>
                  {!isTemplate && (
                    <PublishDialog
                      post={data as Post}
                      blocks={blocks}
                      onPublished={onSave}
                      disabled={saveMutation.isPending}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Canvas */}
          <div className="flex-1 overflow-auto bg-gray-100 p-8 min-h-0">
            <DevicePreview device={deviceView}>
              <div className="bg-white min-h-full shadow-lg">
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
        </div>
      </DragDropContext>
    </div>
  );
}