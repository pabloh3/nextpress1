import { useState, useEffect, useCallback } from 'react';
import type { Post, Template, BlockConfig } from '@shared/schema';
import { DragDropContext } from '@/lib/dnd';
import type { DropResult as DndDropResult } from '@/lib/dnd';
import { generateBlockId } from './utils';
import { useBlockManager } from '../../hooks/useBlockManager';
import { useDragAndDropHandler } from '../../hooks/useDragAndDropHandler';
import { usePageSave } from '../../hooks/usePageSave';
import { BuilderSidebar } from './BuilderSidebar';
import { BuilderTopBar } from './BuilderTopBar';
import { BuilderCanvas } from './BuilderCanvas';
import { BlockActionsProvider } from './BlockActionsContext';

interface PageBuilderProps {
  post?: Post | Template;
  template?: Template;
  blocks?: BlockConfig[];
  onBlocksChange?: (blocks: BlockConfig[]) => void;
  onSave?: (updatedData: Post | Template) => void;
  onPreview?: () => void;
}

export default function PageBuilder({
  post,
  template,
  blocks: propBlocks,
  onBlocksChange,
  onSave,
  onPreview,
}: PageBuilderProps) {
  const data = template || post;
  const isTemplate = !!template; 

  const {
    blocks,
    setBlocks,
    updateBlock,
    duplicateBlock,
    deleteBlock,
    findBlockById,
  } = useBlockManager(
    propBlocks ||
      (data
        ? (isTemplate
            ? ((data as any).blocks as BlockConfig[])
            : ((data as any).builderData as BlockConfig[])) || []
        : [])
  );

  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [deviceView, setDeviceView] = useState<'desktop' | 'tablet' | 'mobile'>(
    'desktop'
  );
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'blocks' | 'settings'>('blocks');
  const [hoverHighlight, setHoverHighlight] = useState<
    'padding' | 'margin' | null
  >(null);
  const [sidebarVisible, setSidebarVisible] = useState(true);

  useEffect(() => {
    if (propBlocks) {
      setBlocks(propBlocks);
    }
  }, [propBlocks, setBlocks]);

  useEffect(() => {
    onBlocksChange?.(blocks);
  }, [blocks, onBlocksChange]);

  const selectedBlock = selectedBlockId ? findBlockById(selectedBlockId) : null;

  const saveMutation = usePageSave({ isTemplate, data, onSave });

  const { handleDragEnd } = useDragAndDropHandler(
    blocks,
    setBlocks,
    setSelectedBlockId,
    setActiveTab
  );

  const handleDuplicate = useCallback(
    (id: string) => {
      const res = duplicateBlock(id, generateBlockId);
      const newId = (res.data as any)?.newId;
      if (newId) {
        setSelectedBlockId(newId);
        setActiveTab('settings');
      }
    },
    [duplicateBlock]
  );

  const handleDelete = useCallback(
    (id: string) => {
      deleteBlock(id);
      if (selectedBlockId === id) {
        setSelectedBlockId(null);
      }
    },
    [deleteBlock, selectedBlockId]
  );

  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  return (
    <div className="flex h-full bg-gray-50">
      <BlockActionsProvider
        value={{
          selectedBlockId,
          onSelect: (id) => {
            setSelectedBlockId(id);
            setActiveTab('settings');
          },
          onDuplicate: handleDuplicate,
          onDelete: handleDelete,
          hoverHighlight,
        }}>
        <DragDropContext
          onDragEnd={(result: DndDropResult) => {
            console.log('[DND] PageBuilder onDragEnd (received)', result)
            return handleDragEnd(result as any)
          }}
          onDragStart={() => console.log('Drag started, id:', selectedBlockId)}>
          {sidebarVisible && (
            <BuilderSidebar
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              selectedBlock={selectedBlock}
              updateBlock={updateBlock}
              setHoverHighlight={setHoverHighlight}
              sidebarVisible={sidebarVisible}
              onToggleSidebar={toggleSidebar}
            />
          )}
          <div className="flex-1 flex flex-col">
            <BuilderTopBar
              data={data}
              isTemplate={isTemplate}
              deviceView={deviceView}
              setDeviceView={setDeviceView}
              blocks={blocks}
              sidebarVisible={sidebarVisible}
              onToggleSidebar={toggleSidebar}
              onSaveClick={() => {
                saveMutation.mutate(blocks);
                onSave?.(data as any);
              }}
            />
            <BuilderCanvas
              blocks={blocks}
              deviceView={deviceView}
              selectedBlockId={selectedBlockId}
              isPreviewMode={isPreviewMode}
              duplicateBlock={handleDuplicate}
              deleteBlock={handleDelete}
              hoverHighlight={hoverHighlight}
            />
          </div>
        </DragDropContext>
      </BlockActionsProvider>
    </div>
  );
}
