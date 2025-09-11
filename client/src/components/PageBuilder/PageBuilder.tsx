import { useState, useEffect } from 'react';
import type { Post, Template, BlockConfig } from '@shared/schema';
import { DragDropContext } from '@hello-pangea/dnd';
import { generateBlockId } from './utils';
import { useBlockManager } from '../../hooks/useBlockManager';
import { useDragAndDropHandler } from '../../hooks/useDragAndDropHandler';
import { usePageSave } from '../../hooks/usePageSave';
import { BuilderSidebar } from './BuilderSidebar';
import { BuilderTopBar } from './BuilderTopBar';
import { BuilderCanvas } from './BuilderCanvas';

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

  // Block state management
  const { blocks, setBlocks, updateBlock, duplicateBlock, deleteBlock } =
    useBlockManager(
      propBlocks ||
        (data
          ? (isTemplate
              ? ((data as any).blocks as BlockConfig[])
              : ((data as any).builderData as BlockConfig[])) || []
          : [])
    );

  // UI state
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [deviceView, setDeviceView] = useState<'desktop' | 'tablet' | 'mobile'>(
    'desktop'
  );
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'blocks' | 'settings'>('blocks');
  const [hoverHighlight, setHoverHighlight] = useState<
    'padding' | 'margin' | null
  >(null);

  // Sync blocks with parent when propBlocks change
  useEffect(() => {
    if (propBlocks) {
      setBlocks(propBlocks);
    }
  }, [propBlocks, setBlocks]);

  // Communicate block changes to parent
  useEffect(() => {
    onBlocksChange?.(blocks);
  }, [blocks, onBlocksChange]);

  const selectedBlock = blocks.find((block) => block.id === selectedBlockId);

  // Data saving
  const saveMutation = usePageSave({ isTemplate, data, onSave });

  // Drag-and-drop handler
  const { handleDragEnd } = useDragAndDropHandler(
    blocks,
    setBlocks,
    setSelectedBlockId,
    setActiveTab
  );

  // Save handler
  const handleSave = () => {
    saveMutation.mutate(blocks);
  };

  // Preview handler
  const handlePreview = () => {
    let previewUrl = '';
    if (isTemplate && data) {
      previewUrl = `/preview/template/${data.id}`;
    } else if (data) {
      const postType = (data as any).type === 'page' ? 'page' : 'post';
      previewUrl = `/preview/${postType}/${data.id}`;
    }
    if (previewUrl) {
      window.open(previewUrl, '_blank');
    } else {
      setIsPreviewMode(!isPreviewMode);
    }
    onPreview?.();
  };

  return (
    <div className="flex h-full bg-gray-50">
      <DragDropContext onDragEnd={handleDragEnd}>
        <BuilderSidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          selectedBlock={selectedBlock}
          updateBlock={updateBlock}
          setHoverHighlight={setHoverHighlight}
        />
        <div className="flex-1 flex flex-col">
          <BuilderTopBar
            data={data}
            isTemplate={isTemplate}
            deviceView={deviceView}
            setDeviceView={setDeviceView}
            blocks={blocks}
          />
          <BuilderCanvas
            blocks={blocks}
            deviceView={deviceView}
            selectedBlockId={selectedBlockId}
            setSelectedBlockId={setSelectedBlockId}
            setActiveTab={setActiveTab}
            isPreviewMode={isPreviewMode}
            duplicateBlock={(blockId) =>
              duplicateBlock(blockId, generateBlockId)
            }
            deleteBlock={deleteBlock}
            hoverHighlight={hoverHighlight}
          />
        </div>
      </DragDropContext>
    </div>
  );
}
