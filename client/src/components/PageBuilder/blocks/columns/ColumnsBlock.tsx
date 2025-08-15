import React from "react";
import type { BlockConfig } from "@shared/schema";
import type { BlockDefinition } from "../types.ts";
import { Grid3x3 as GridIcon } from "lucide-react";

function ColumnsRenderer({ block }: { block: BlockConfig; isPreview: boolean }) {
  const columns = block.content?.columns;
  return (
    <div 
      style={{
        ...block.styles,
        display: 'flex',
        gap: '20px',
      }}
    >
      {columns?.map((column: any, index: number) => (
        <div
          key={index}
          style={{
            flex: column.width || 1,
            padding: '20px',
            border: '2px dashed #e2e8f0',
            borderRadius: '4px',
            minHeight: '100px',
          }}
        >
          <div className="text-center text-gray-400">
            Column {index + 1}
            <br />
            <small>Drag blocks here</small>
          </div>
        </div>
      )) || (
        <>
          <div className="flex-1 p-4 border-2 border-dashed border-gray-300 rounded">
            <div className="text-center text-gray-400">
              Column 1<br /><small>Drag blocks here</small>
            </div>
          </div>
          <div className="flex-1 p-4 border-2 border-dashed border-gray-300 rounded">
            <div className="text-center text-gray-400">
              Column 2<br /><small>Drag blocks here</small>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const ColumnsBlock: BlockDefinition = {
  id: 'columns',
  name: 'Columns',
  icon: GridIcon,
  description: 'Add multi-column layout',
  category: 'layout',
  defaultContent: {
    columns: [{ width: 1 }, { width: 1 }],
  },
  defaultStyles: {},
  renderer: ColumnsRenderer,
  settings: ({}) as any,
};

export default ColumnsBlock;

