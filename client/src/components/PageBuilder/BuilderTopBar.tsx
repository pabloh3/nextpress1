import React from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Smartphone, Tablet, Monitor } from 'lucide-react';

export function BuilderTopBar({
  data,
  isTemplate,
  deviceView,
  setDeviceView,
  blocks,
}: {
  data: any;
  isTemplate: boolean;
  deviceView: 'desktop' | 'tablet' | 'mobile';
  setDeviceView: (view: 'desktop' | 'tablet' | 'mobile') => void;
  blocks: any[];
}) {
  return (
    <div className="bg-white border-b border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="font-medium">{data ? (isTemplate ? data.name : data.title) : 'Untitled'}</h3>
          <Separator orientation="vertical" className="h-6" />
          <div className="flex items-center gap-2">
            <Button variant={deviceView === 'desktop' ? 'default' : 'outline'} size="sm" onClick={() => setDeviceView('desktop')}>
              <Monitor className="w-4 h-4" />
            </Button>
            <Button variant={deviceView === 'tablet' ? 'default' : 'outline'} size="sm" onClick={() => setDeviceView('tablet')}>
              <Tablet className="w-4 h-4" />
            </Button>
            <Button variant={deviceView === 'mobile' ? 'default' : 'outline'} size="sm" onClick={() => setDeviceView('mobile')}>
              <Smartphone className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-500">{blocks.length} blocks</div>
        </div>
      </div>
    </div>
  );
}
