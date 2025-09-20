import React from "react";
import type { BlockConfig } from "@shared/schema";
import type { BlockDefinition } from "../types";
import { Grid3x3 as GridIcon, Plus, Trash2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Droppable, Draggable } from "@hello-pangea/dnd";
import { useBlockActions } from "../../BlockActionsContext";
import BlockRenderer from "../../BlockRenderer";

interface ColumnItem {
  id: string;
  width?: string; // CSS width value like '33.33%', '200px', 'auto', '1fr'
  children: BlockConfig[];
}

export interface ColumnsBlockConfig extends BlockConfig {
  content: { 
    gap?: string;
    verticalAlignment?: 'top' | 'center' | 'bottom' | 'stretch';
    horizontalAlignment?: 'left' | 'center' | 'right' | 'space-between' | 'space-around';
    direction?: 'row' | 'column';
    columns: ColumnItem[];
  };
}

function ColumnsRenderer({ block, isPreview }: { block: BlockConfig; isPreview: boolean }) {
  const columnsBlock = block as ColumnsBlockConfig;
  const gap = (columnsBlock.content?.gap || '20px');
  const verticalAlignment = columnsBlock.content?.verticalAlignment || 'top';
  const horizontalAlignment = columnsBlock.content?.horizontalAlignment || 'left';
  const direction = columnsBlock.content?.direction || 'row';
  const columns = columnsBlock.content?.columns || [];
  
  // Convert alignment settings to CSS flexbox properties
  const alignItems = {
    'top': 'flex-start',
    'center': 'center', 
    'bottom': 'flex-end',
    'stretch': 'stretch'
  }[verticalAlignment];

  const justifyContent = {
    'left': 'flex-start',
    'center': 'center',
    'right': 'flex-end', 
    'space-between': 'space-between',
    'space-around': 'space-around'
  }[horizontalAlignment];

  const actions = useBlockActions();

  return (
    <div
      className="wp-block-columns"
      style={{
        display: 'flex',
        flexDirection: direction,
        flexWrap: direction === 'row' ? 'wrap' : 'nowrap',
        gap,
        width: '100%',
        alignItems,
        justifyContent,
        ...block.styles,
      }}
    >
      {columns.map((column, columnIndex) => (
        <div
          key={column.id}
          className="wp-block-column"
          style={{
            flex: column.width === 'auto' ? 'none' : '1',
            width: column.width && column.width !== 'auto' ? column.width : undefined,
            minWidth: 0, // Prevent flex items from overflowing
          }}
        >
          {isPreview ? (
            <div className="space-y-2">
              {column.children.map((childBlock) => (
                <BlockRenderer
                  key={childBlock.id}
                  block={childBlock}
                  isSelected={false}
                  isPreview={true}
                  onDuplicate={() => {}}
                  onDelete={() => {}}
                />
              ))}
            </div>
          ) : (
            <Droppable droppableId={column.id} direction="vertical">
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  style={{
                    minHeight: column.children.length === 0 ? '120px' : 'auto',
                    border: snapshot.isDraggingOver ? '2px solid #3b82f6' : '2px dashed #e2e8f0',
                    borderRadius: '4px',
                    background: snapshot.isDraggingOver ? 'rgba(59,130,246,0.06)' : undefined,
                    padding: '8px',
                  }}
                >
                  {column.children.length > 0 ? (
                    column.children.map((childBlock, childIndex) => (
                      <Draggable key={childBlock.id} draggableId={childBlock.id} index={childIndex}>
                        {(dragProvided, dragSnapshot) => (
                          <div
                            ref={dragProvided.innerRef}
                            {...dragProvided.draggableProps}
                            className={`relative group ${dragSnapshot.isDragging ? 'opacity-50' : ''}`}
                          >
                            <BlockRenderer
                              block={childBlock}
                              isSelected={actions?.selectedBlockId === childBlock.id}
                              isPreview={false}
                              onDuplicate={() => actions?.onDuplicate(childBlock.id)}
                              onDelete={() => actions?.onDelete(childBlock.id)}
                              dragHandleProps={dragProvided.dragHandleProps}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))
                  ) : (
                    <div className="text-center text-gray-400 p-8">
                      <small>Drop blocks here</small>
                    </div>
                  )}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          )}
        </div>
      ))}
    </div>
  );
}

function ColumnsSettings({ block, onUpdate }: { block: BlockConfig; onUpdate: (updates: Partial<BlockConfig>) => void }) {
  const columns: ColumnItem[] = Array.isArray((block.content as any)?.columns)
    ? (block.content as any).columns
    : [];

  const updateContent = (contentUpdates: any) => {
    onUpdate({
      content: {
        ...(block.content || {}),
        ...contentUpdates,
      }
    });
  };

  const updateColumns = (newColumns: ColumnItem[]) => {
    updateContent({ columns: newColumns });
  };

  const addColumn = () => {
    const newColumn: ColumnItem = {
      id: `col-${Date.now()}`,
      width: 'auto',
      children: [],
    };
    updateColumns([...columns, newColumn]);
  };

  const removeColumn = (index: number) => {
    const newColumns = columns.filter((_, i) => i !== index);
    updateColumns(newColumns);
  };

  const updateColumn = (index: number, updates: Partial<ColumnItem>) => {
    const newColumns = columns.map((col, i) => i === index ? { ...col, ...updates } : col);
    updateColumns(newColumns);
  };

  const addQuickColumns = (count: number) => {
    const width = `${(100 / count).toFixed(2)}%`;
    const newColumns: ColumnItem[] = Array.from({ length: count }, (_, i) => ({
      id: `col-${Date.now()}-${i}`,
      width,
      children: [],
    }));
    updateColumns(newColumns);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Column Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <Label>Columns ({columns.length})</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addColumn}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Column
            </Button>
          </div>

          <div className="grid grid-cols-4 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addQuickColumns(2)}
              className="text-xs"
            >
              2 Cols
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addQuickColumns(3)}
              className="text-xs"
            >
              3 Cols
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addQuickColumns(4)}
              className="text-xs"
            >
              4 Cols
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addQuickColumns(6)}
              className="text-xs"
            >
              6 Cols
            </Button>
          </div>

          {columns.map((column, index) => (
            <div key={column.id} className="border rounded p-3 space-y-2">
              <div className="flex justify-between items-center">
                <Label className="font-medium text-sm">Column {index + 1}</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeColumn(index)}
                  className="text-red-600 h-6 w-6 p-0"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
              
              <div>
                <Label htmlFor={`col-width-${index}`} className="text-xs">Width</Label>
                <Select
                  value={column.width || 'auto'}
                  onValueChange={(value) => updateColumn(index, { width: value })}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto</SelectItem>
                    <SelectItem value="25%">25%</SelectItem>
                    <SelectItem value="33.33%">33.33%</SelectItem>
                    <SelectItem value="50%">50%</SelectItem>
                    <SelectItem value="66.67%">66.67%</SelectItem>
                    <SelectItem value="75%">75%</SelectItem>
                    <SelectItem value="100%">100%</SelectItem>
                    <SelectItem value="200px">200px</SelectItem>
                    <SelectItem value="300px">300px</SelectItem>
                    <SelectItem value="1fr">1fr (flex)</SelectItem>
                    <SelectItem value="2fr">2fr (flex)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Layout Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-12 gap-2 items-center">
            <div className="col-span-4">
              <Label htmlFor="columns-direction">Direction</Label>
            </div>
            <div className="col-span-8">
              <Select
                value={(block.content as any)?.direction || 'row'}
                onValueChange={(value) => updateContent({ direction: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="row">Horizontal (Row)</SelectItem>
                  <SelectItem value="column">Vertical (Column)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-2 items-center">
            <div className="col-span-4">
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

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Alignment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-12 gap-2 items-center">
            <div className="col-span-4">
              <Label htmlFor="vertical-align">Vertical</Label>
            </div>
            <div className="col-span-8">
              <Select
                value={(block.content as any)?.verticalAlignment || 'top'}
                onValueChange={(value) => updateContent({ verticalAlignment: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="top">Top</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="bottom">Bottom</SelectItem>
                  <SelectItem value="stretch">Stretch</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-2 items-center">
            <div className="col-span-4">
              <Label htmlFor="horizontal-align">Horizontal</Label>
            </div>
            <div className="col-span-8">
              <Select
                value={(block.content as any)?.horizontalAlignment || 'left'}
                onValueChange={(value) => updateContent({ horizontalAlignment: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                  <SelectItem value="space-between">Space Between</SelectItem>
                  <SelectItem value="space-around">Space Around</SelectItem>
                </SelectContent>
              </Select>
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
    verticalAlignment: 'top',
    horizontalAlignment: 'left',
    direction: 'row',
  },
  defaultStyles: {},
  renderer: ColumnsRenderer,
  settings: ColumnsSettings,
};

export default ColumnsBlock;
