import React, { useState, useEffect } from 'react';
import BlockLibrary from './BlockLibrary';
import BlockSettings from './BlockSettings';
import PageSettings from './PageSettings';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import { Plus, Settings, Sidebar, FileText, Palette } from 'lucide-react';
import type { Post, Template } from '@shared/schema-types';

export function BuilderSidebar({
  activeTab,
  setActiveTab,
  selectedBlock,
  updateBlock,
  setHoverHighlight,
  sidebarVisible,
  onToggleSidebar,
  page,
  isTemplate,
  onPageUpdate,
}: {
  activeTab: 'blocks' | 'settings';
  setActiveTab: (tab: 'blocks' | 'settings') => void;
  selectedBlock: any;
  updateBlock: (blockId: string, updates: any) => void;
  setHoverHighlight: (area: 'padding' | 'margin' | null) => void;
  sidebarVisible: boolean;
  onToggleSidebar: () => void;
  page?: Post | Template;
  isTemplate?: boolean;
  onPageUpdate?: (updatedPage: Post | Template) => void;
}) {
  const [settingsView, setSettingsView] = useState<'page' | 'block'>('page');

  // Auto-set to 'page' when no block selected, 'block' when block selected
  useEffect(() => {
    if (!selectedBlock && settingsView !== 'page') {
      setSettingsView('page');
    }
  }, [selectedBlock, settingsView]);
  return (
    <div className="w-80 sm:w-80 lg:w-80 bg-white border-r border-gray-200 flex flex-col min-h-0 transition-all duration-300 ease-out shadow-sm">
      <div className="p-4 border-b border-gray-200 flex items-center gap-2 w-full justify-between bg-white">
        <h2 className="text-lg font-semibold text-gray-900">Nextpress Builder</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleSidebar}
          className="p-1 h-auto hover:bg-gray-100 text-gray-600 hover:text-gray-900">
          <Sidebar className="w-5 h-5" />
        </Button>
      </div>
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as 'blocks' | 'settings')}
        className="flex-1 flex flex-col p-4 min-h-0">
        <TabsList className="grid w-full grid-cols-2 bg-gray-100 p-1 rounded-lg">
          <TabsTrigger
            value="blocks"
            className="flex items-center gap-2 text-gray-600 data-[state=active]:text-white data-[state=active]:bg-black data-[state=active]:shadow-sm font-medium px-4 py-2.5 rounded-md transition-all">
            <Plus className="w-4 h-4" /> Blocks
          </TabsTrigger>
          <TabsTrigger
            value="settings"
            className="flex items-center gap-2 text-gray-600 data-[state=active]:text-white data-[state=active]:bg-black data-[state=active]:shadow-sm font-medium px-4 py-2.5 rounded-md transition-all">
            <Settings className="w-4 h-4" /> Settings
          </TabsTrigger>
        </TabsList>
        <TabsContent value="blocks" className="flex-1 mt-4 overflow-hidden">
          <div className="h-full overflow-x-hidden bg-gray-50 rounded-lg p-4">
            <ScrollArea className="h-full">
              <div className="max-w-full pr-2">
                <BlockLibrary />
              </div>
              <ScrollBar orientation="vertical" />
            </ScrollArea>
          </div>
        </TabsContent>
        <TabsContent value="settings" className="flex-1 mt-4 overflow-hidden">
          <div className="h-full overflow-x-hidden bg-gray-50 rounded-lg p-4">
            <ScrollArea className="h-full">
              <div className="max-w-full pr-2">
                {/* Toggle between Page and Block Settings */}
                <div className="mb-4">
                  <ButtonGroup>
                    <Button
                      variant={settingsView === 'page' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSettingsView('page')}
                      className="flex-1"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Page
                    </Button>
                    <Button
                      variant={settingsView === 'block' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSettingsView('block')}
                      className="flex-1"
                      disabled={!selectedBlock}
                    >
                      <Palette className="w-4 h-4 mr-2" />
                      Block
                    </Button>
                  </ButtonGroup>
                </div>

                {/* Show PageSettings when view is 'page' or no block selected */}
                {(settingsView === 'page' || !selectedBlock) ? (
                  <PageSettings
                    page={page}
                    isTemplate={isTemplate}
                    onUpdate={onPageUpdate}
                  />
                ) : selectedBlock ? (
                  <BlockSettings
                    block={selectedBlock}
                    onUpdate={(updates) =>
                      updateBlock(selectedBlock.id, updates)
                    }
                    onHoverArea={(area) => setHoverHighlight(area)}
                  />
                ) : null}
              </div>
              <ScrollBar orientation="vertical" />
            </ScrollArea>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
