import React from 'react';
import BlockLibrary from './BlockLibrary';
import BlockSettings from './BlockSettings';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Settings } from 'lucide-react';

export function BuilderSidebar({
  activeTab,
  setActiveTab,
  selectedBlock,
  updateBlock,
  setHoverHighlight,
}: {
  activeTab: 'blocks' | 'settings';
  setActiveTab: (tab: 'blocks' | 'settings') => void;
  selectedBlock: any;
  updateBlock: (blockId: string, updates: any) => void;
  setHoverHighlight: (area: 'padding' | 'margin' | null) => void;
}) {
  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col min-h-0">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold">Page Builder</h2>
      </div>
      <Tabs value={activeTab} onValueChange={value => setActiveTab(value as 'blocks' | 'settings')} className="flex-1 flex flex-col p-4 min-h-0">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="blocks" className="flex items-center gap-2" onClick={() => setActiveTab('blocks')}>
              <Plus className="w-4 h-4" /> Blocks
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2" onClick={() => setActiveTab('settings')}>
              <Settings className="w-4 h-4" /> Settings
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
                onUpdate={updates => updateBlock(selectedBlock.id, updates)}
                onHoverArea={area => setHoverHighlight(area)}
              />
            ) : (
              <div className="text-center text-gray-500 mt-8">Select a block to edit its settings</div>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
