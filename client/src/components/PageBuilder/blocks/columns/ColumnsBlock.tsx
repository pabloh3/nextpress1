import React from "react";
import type { BlockConfig } from "@shared/schema";
import type { BlockDefinition } from "../types.ts";
import { Grid3x3 as GridIcon, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Droppable, Draggable } from "@hello-pangea/dnd";
import BlockRenderer from "../../BlockRenderer";

function ColumnsRenderer({ block, isPreview }: { block: BlockConfig; isPreview: boolean }) {
  const columns: Array<{ width?: number; blocks?: BlockConfig[] }> = Array.isArray((block.content as any)?.columns)
    ? (block.content as any).columns
    : [{ width: 1, blocks: [] }, { width: 1, blocks: [] }];

  return (
    <div
      style={{
        ...block.styles,
        display: 'flex',
        gap: '20px',
        width: '100%'
      }}
    >
      {columns.map((column: any, index: number) => (
        <Droppable
          droppableId={`${block.id}:column:${index}`}
          direction="vertical"
          key={`${block.id}:column:${index}`}
        >
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              style={{
                boxSizing: 'border-box',
                flex: column.width || 1,
                padding: '20px',
                border: snapshot.isDraggingOver ? '2px solid #3b82f6' : '2px dashed #e2e8f0',
                borderRadius: '4px',
                minHeight: '120px',
                background: snapshot.isDraggingOver ? 'rgba(59,130,246,0.06)' : undefined,
              }}
            >
              {Array.isArray(column.blocks) && column.blocks.length > 0 ? (
                column.blocks.map((child: BlockConfig, childIndex: number) => (
                  <Draggable key={child.id} draggableId={child.id} index={childIndex}>
                    {(dragProvided, dragSnapshot) => (
                      <div
                        ref={dragProvided.innerRef}
                        {...dragProvided.draggableProps}
                        {...dragProvided.dragHandleProps}
                        className={`relative group ${dragSnapshot.isDragging ? 'opacity-50' : ''}`}
                      >
                        <BlockRenderer
                          block={child}
                          isSelected={false}
                          isPreview={isPreview}
                          onDuplicate={() => {}}
                          onDelete={() => {}}
                        />
                      </div>
                    )}
                  </Draggable>
                ))
              ) : (
                <div className="text-center text-gray-400">
                  Column {index + 1}
                  <br />
                  <small>Drag blocks here</small>
                </div>
              )}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      ))}
    </div>
  );
}

function ColumnsSettings({ block, onUpdate }: { block: BlockConfig; onUpdate: (updates: Partial<BlockConfig>) => void }) {
  const columns: Array<{ width?: number }> = Array.isArray(block.content?.columns)
    ? block.content.columns
    : [];

  const updateColumns = (nextColumns: Array<{ width?: number }>) => {
    onUpdate({ content: { ...(block.content || {}), columns: nextColumns } });
  };

  const addColumn = () => {
    const next = [...columns, { width: 1 }];
    updateColumns(next);
  };

  const removeColumn = (index: number) => {
    if (columns.length <= 1) return; // keep at least one column
    const next = columns.slice();
    next.splice(index, 1);
    updateColumns(next);
  };

  const changeWidth = (index: number, value: string) => {
    const parsed = Number(value);
    const width = Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
    const next = columns.slice();
    next[index] = { ...(next[index] || {}), width };
    updateColumns(next);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Columns</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-end">
            <button type="button" className="text-xs inline-flex items-center gap-1 px-2 py-1 border rounded" onClick={addColumn}>
              <Plus className="w-3 h-3" /> Add column
            </button>
          </div>
          {columns.map((col, index) => (
            <div key={index} className="grid grid-cols-12 gap-2 items-center">
              <div className="col-span-6 flex items-center gap-2">
                <Label>Column {index + 1}</Label>
              </div>
              <div className="col-span-4">
                <Input
                  value={(col?.width ?? 1).toString()}
                  onChange={(e) => changeWidth(index, e.target.value)}
                  placeholder="Flex weight (e.g., 1, 2)"
                />
              </div>
              <div className="col-span-2 text-right">
                <button
                  type="button"
                  className="inline-flex items-center gap-1 px-2 py-1 border rounded text-xs text-red-600"
                  onClick={() => removeColumn(index)}
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

const ColumnsBlock: BlockDefinition = {
  id: 'core/columns',
  name: 'Columns',
  icon: GridIcon,
  description: 'Add multi-column layout',
  category: 'layout',
  defaultContent: {
    columns: [{ width: 1 }, { width: 1 }],
  },
  defaultStyles: {},
  renderer: ColumnsRenderer,
  settings: ColumnsSettings,
};

export default ColumnsBlock;

