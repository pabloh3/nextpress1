import React from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Smartphone,
  Tablet,
  Monitor,
  Sidebar,
  Settings as SettingsIcon,
  FileText,
  Pen,
  Palette,
  RotateCcw,
  RotateCw,
} from 'lucide-react';
import { SiteMenu, PagesMenu, BlogMenu, DesignMenu } from '@/components/PageBuilder/EditorBar';

export function BuilderTopBar({
  data,
  isTemplate,
  deviceView,
  setDeviceView,
  blocks,
  sidebarVisible,
  onToggleSidebar,
  onSaveClick,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}: {
  data: any;
  isTemplate: boolean;
  deviceView: 'desktop' | 'tablet' | 'mobile';
  setDeviceView: (view: 'desktop' | 'tablet' | 'mobile') => void;
  blocks: any[];
  sidebarVisible: boolean;
  onToggleSidebar: () => void;
  onSaveClick?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}) {
  return (
    <div className="bg-white border-b border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {!sidebarVisible && (
            <>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onToggleSidebar}
                className="p-1 h-auto"
              >
                <Sidebar className="w-5 h-5 text-black" />
              </Button>
              <Separator orientation="vertical" className="h-6" />
            </>
          )}
          <h3 className="font-medium">{data ? (isTemplate ? data.name : data.title) : 'Untitled'}</h3>
          <Separator orientation="vertical" className="h-6" />
          <div className="flex items-center gap-2">
            <Button
              variant={deviceView === 'desktop' ? 'default' : 'outline'}
              size="sm"
              aria-label="desktop"
              className={deviceView === 'desktop' ? 'active' : ''}
              onClick={() => setDeviceView('desktop')}
            >
              <Monitor className="w-4 h-4" />
            </Button>
            <Button
              variant={deviceView === 'tablet' ? 'default' : 'outline'}
              size="sm"
              aria-label="tablet"
              className={deviceView === 'tablet' ? 'active' : ''}
              onClick={() => setDeviceView('tablet')}
            >
              <Tablet className="w-4 h-4" />
            </Button>
            <Button
              variant={deviceView === 'mobile' ? 'default' : 'outline'}
              size="sm"
              aria-label="mobile"
              className={deviceView === 'mobile' ? 'active' : ''}
              onClick={() => setDeviceView('mobile')}
            >
              <Smartphone className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-500">{blocks.length} blocks</div>

          {/* Menus moved here next to the inner Save */}
          <SiteMenu>
            <Button variant="outline" size="sm" className="gap-2">
              <SettingsIcon className="w-4 h-4" />
              Site
            </Button>
          </SiteMenu>

          <PagesMenu currentPageId={data?.id}>
            <Button variant="outline" size="sm" className="gap-2">
              <FileText className="w-4 h-4" />
              Pages
            </Button>
          </PagesMenu>

          <BlogMenu currentPostId={data?.id} blogId={data?.blogId ?? undefined}>
            <Button variant="outline" size="sm" className="gap-2">
              <Pen className="w-4 h-4" />
              Blog
            </Button>
          </BlogMenu>

          <DesignMenu currentPostId={data?.id} currentType={isTemplate ? 'template' : 'post'}>
            <Button variant="outline" size="sm" className="gap-2">
              <Palette className="w-4 h-4" />
              Design
            </Button>
          </DesignMenu>

          <div className="flex items-center gap-2">
            {onUndo && (
              <Button
                size="sm"
                variant="outline"
                onClick={onUndo}
                disabled={canUndo === false}
                title="Undo (Ctrl+Z)"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            )}
            {onRedo && (
              <Button
                size="sm"
                variant="outline"
                onClick={onRedo}
                disabled={canRedo === false}
                title="Redo (Ctrl+Shift+Z)"
              >
                <RotateCw className="w-4 h-4" />
              </Button>
            )}
            {onSaveClick && (
              <Button size="sm" onClick={onSaveClick} title="Save (Ctrl+S)">
                Save
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
