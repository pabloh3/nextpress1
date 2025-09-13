import React from "react";
import type { BlockConfig } from "@shared/schema";
import type { BlockDefinition } from "../types";
import { Grid3x3 as GridIcon } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ContainerChildren } from "../../BlockRenderer";

export interface ColumnsBlockConfig extends BlockConfig {
  content: { gap?: string };
  children?: BlockConfig[];
}

function ColumnsRenderer({ block, isPreview }: { block: ColumnsBlockConfig; isPreview: boolean }) {
  const gap = (block.content?.gap || '20px');
  return (
    <div
      className="wp-block-columns"
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap,
        width: '100%',
        ...block.styles,
      }}
    >
      <ContainerChildren block={block} isPreview={isPreview} />
    </div>
  );
}

function ColumnsSettings({ block, onUpdate }: { block: BlockConfig; onUpdate: (updates: Partial<BlockConfig>) => void }) {
  const updateContent = (contentUpdates: any) => {
    onUpdate({
      content: {
        ...(block.content || {}),
        ...contentUpdates,
      }
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Columns Layout</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-12 gap-2 items-center">
            <div className="col-span-4 flex items-center gap-2">
              <Label htmlFor="columns-gap">Gap</Label>
            </div>
            <div className="col-span-8">
              <Input
                id="columns-gap"
                value={(block.content as any)?.gap || '20px'}
                onChange={(e) => updateContent({ gap: e.target.value })}
                placeholder="e.g. 10px, 2rem"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

const ColumnsBlock: BlockDefinition = {
  id: 'core/columns',
  name: 'Columns',
  icon: GridIcon,
  description: 'Flexible horizontal container for any blocks',
  category: 'layout',
  isContainer: true,
  defaultContent: {
    gap: '20px',
  },
  defaultStyles: {},
  renderer: ColumnsRenderer,
  settings: ColumnsSettings,
};

export default ColumnsBlock;
