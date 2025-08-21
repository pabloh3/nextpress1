import React from "react";
import type { BlockConfig } from "@shared/schema";
import type { BlockDefinition } from "../types.ts";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Table as TableIcon } from "lucide-react";

interface TableCell {
  content: string;
  tag: 'td' | 'th';
}

interface TableRow {
  cells: TableCell[];
}

function TableRenderer({ block }: { block: BlockConfig; isPreview: boolean }) {
  const body: TableRow[] = (block.content as any)?.body || [];
  const head: TableRow[] = (block.content as any)?.head || [];
  const foot: TableRow[] = (block.content as any)?.foot || [];
  const hasFixedLayout = (block.content as any)?.hasFixedLayout || false;
  const caption = (block.content as any)?.caption || '';
  
  const className = [
    "wp-block-table",
    hasFixedLayout ? 'has-fixed-layout' : '',
    block.content?.className || "",
  ].filter(Boolean).join(" ");

  if (body.length === 0) {
    return (
      <div className={className} style={block.styles}>
        <div className="table-placeholder text-center text-gray-400 p-8 border-2 border-dashed border-gray-300 rounded">
          <TableIcon className="w-12 h-12 mx-auto mb-2" />
          <p>Table</p>
          <small>Add a table to display data</small>
        </div>
      </div>
    );
  }

  return (
    <figure className={className} style={block.styles}>
      <table style={{
        borderCollapse: 'collapse',
        width: '100%',
        tableLayout: hasFixedLayout ? 'fixed' : 'auto',
      }}>
        {caption && <caption>{caption}</caption>}
        {head.length > 0 && (
          <thead>
            {head.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.cells.map((cell, cellIndex) => (
                  <th
                    key={cellIndex}
                    style={{
                      border: '1px solid #ddd',
                      padding: '8px',
                      backgroundColor: '#f8f9fa',
                      fontWeight: 'bold',
                    }}
                    dangerouslySetInnerHTML={{ __html: cell.content }}
                  />
                ))}
              </tr>
            ))}
          </thead>
        )}
        <tbody>
          {body.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.cells.map((cell, cellIndex) => {
                const CellTag = cell.tag || 'td';
                return (
                  <CellTag
                    key={cellIndex}
                    style={{
                      border: '1px solid #ddd',
                      padding: '8px',
                      fontWeight: cell.tag === 'th' ? 'bold' : 'normal',
                      backgroundColor: cell.tag === 'th' ? '#f8f9fa' : 'transparent',
                    }}
                    dangerouslySetInnerHTML={{ __html: cell.content }}
                  />
                );
              })}
            </tr>
          ))}
        </tbody>
        {foot.length > 0 && (
          <tfoot>
            {foot.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.cells.map((cell, cellIndex) => (
                  <td
                    key={cellIndex}
                    style={{
                      border: '1px solid #ddd',
                      padding: '8px',
                      backgroundColor: '#f8f9fa',
                      fontWeight: 'bold',
                    }}
                    dangerouslySetInnerHTML={{ __html: cell.content }}
                  />
                ))}
              </tr>
            ))}
          </tfoot>
        )}
      </table>
    </figure>
  );
}

function TableSettings({ block, onUpdate }: { block: BlockConfig; onUpdate: (updates: Partial<BlockConfig>) => void }) {
  const body: TableRow[] = (block.content as any)?.body || [];
  const head: TableRow[] = (block.content as any)?.head || [];
  const foot: TableRow[] = (block.content as any)?.foot || [];

  const updateContent = (contentUpdates: any) => {
    onUpdate({
      content: {
        ...block.content,
        ...contentUpdates,
      },
    });
  };

  const updateTableData = (section: 'body' | 'head' | 'foot', newData: TableRow[]) => {
    updateContent({ [section]: newData });
  };

  const addRow = (section: 'body' | 'head' | 'foot') => {
    const currentData = section === 'body' ? body : section === 'head' ? head : foot;
    const columnCount = currentData[0]?.cells.length || 2;
    const newRow: TableRow = {
      cells: Array(columnCount).fill(null).map(() => ({ content: '', tag: section === 'head' ? 'th' : 'td' }))
    };
    updateTableData(section, [...currentData, newRow]);
  };

  const removeRow = (section: 'body' | 'head' | 'foot', index: number) => {
    const currentData = section === 'body' ? body : section === 'head' ? head : foot;
    updateTableData(section, currentData.filter((_, i) => i !== index));
  };

  const addColumn = () => {
    const newBody = body.map(row => ({
      ...row,
      cells: [...row.cells, { content: '', tag: 'td' as const }]
    }));
    const newHead = head.map(row => ({
      ...row,
      cells: [...row.cells, { content: '', tag: 'th' as const }]
    }));
    const newFoot = foot.map(row => ({
      ...row,
      cells: [...row.cells, { content: '', tag: 'td' as const }]
    }));
    updateContent({ body: newBody, head: newHead, foot: newFoot });
  };

  const removeColumn = (columnIndex: number) => {
    const newBody = body.map(row => ({
      ...row,
      cells: row.cells.filter((_, i) => i !== columnIndex)
    }));
    const newHead = head.map(row => ({
      ...row,
      cells: row.cells.filter((_, i) => i !== columnIndex)
    }));
    const newFoot = foot.map(row => ({
      ...row,
      cells: row.cells.filter((_, i) => i !== columnIndex)
    }));
    updateContent({ body: newBody, head: newHead, foot: newFoot });
  };

  const updateCell = (section: 'body' | 'head' | 'foot', rowIndex: number, cellIndex: number, content: string) => {
    const currentData = section === 'body' ? body : section === 'head' ? head : foot;
    const newData = currentData.map((row, rIdx) => {
      if (rIdx === rowIndex) {
        return {
          ...row,
          cells: row.cells.map((cell, cIdx) => {
            if (cIdx === cellIndex) {
              return { ...cell, content };
            }
            return cell;
          })
        };
      }
      return row;
    });
    updateTableData(section, newData);
  };

  const createTable = (rows: number, cols: number) => {
    const newBody: TableRow[] = Array(rows).fill(null).map(() => ({
      cells: Array(cols).fill(null).map(() => ({ content: '', tag: 'td' as const }))
    }));
    updateContent({ body: newBody, head: [], foot: [] });
  };

  // Initialize table if empty
  if (body.length === 0) {
    return (
      <div className="space-y-4">
        <div>
          <Label>Create Table</Label>
          <div className="flex gap-2 items-center mt-2">
            <Button onClick={() => createTable(3, 3)} variant="outline">3x3</Button>
            <Button onClick={() => createTable(4, 4)} variant="outline">4x4</Button>
            <Button onClick={() => createTable(5, 3)} variant="outline">5x3</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button onClick={addColumn} variant="outline" size="sm">
          <Plus className="w-4 h-4 mr-1" />
          Add Column
        </Button>
        <Button onClick={() => addRow('body')} variant="outline" size="sm">
          <Plus className="w-4 h-4 mr-1" />
          Add Row
        </Button>
      </div>

      {/* Table Body Editor */}
      <div>
        <Label>Table Body</Label>
        <div className="border rounded p-2 space-y-2 max-h-64 overflow-y-auto">
          {body.map((row, rowIndex) => (
            <div key={rowIndex} className="flex items-center gap-1">
              <div className="flex-1 grid gap-1" style={{ gridTemplateColumns: `repeat(${row.cells.length}, 1fr)` }}>
                {row.cells.map((cell, cellIndex) => (
                  <Input
                    key={cellIndex}
                    value={cell.content}
                    onChange={(e) => updateCell('body', rowIndex, cellIndex, e.target.value)}
                    placeholder={`R${rowIndex + 1}C${cellIndex + 1}`}
                    className="text-xs"
                  />
                ))}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeRow('body', rowIndex)}
                className="text-red-600 p-1"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="table-header">Header section</Label>
        <Switch
          id="table-header"
          checked={head.length > 0}
          onCheckedChange={(checked) => {
            if (checked) {
              const columnCount = body[0]?.cells.length || 2;
              const newHead: TableRow[] = [{
                cells: Array(columnCount).fill(null).map(() => ({ content: '', tag: 'th' as const }))
              }];
              updateContent({ head: newHead });
            } else {
              updateContent({ head: [] });
            }
          }}
        />
      </div>

      {head.length > 0 && (
        <div>
          <Label>Table Header</Label>
          <div className="border rounded p-2 space-y-2">
            {head.map((row, rowIndex) => (
              <div key={rowIndex} className="flex items-center gap-1">
                <div className="flex-1 grid gap-1" style={{ gridTemplateColumns: `repeat(${row.cells.length}, 1fr)` }}>
                  {row.cells.map((cell, cellIndex) => (
                    <Input
                      key={cellIndex}
                      value={cell.content}
                      onChange={(e) => updateCell('head', rowIndex, cellIndex, e.target.value)}
                      placeholder={`Header ${cellIndex + 1}`}
                      className="text-xs font-medium"
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <Label htmlFor="table-footer">Footer section</Label>
        <Switch
          id="table-footer"
          checked={foot.length > 0}
          onCheckedChange={(checked) => {
            if (checked) {
              const columnCount = body[0]?.cells.length || 2;
              const newFoot: TableRow[] = [{
                cells: Array(columnCount).fill(null).map(() => ({ content: '', tag: 'td' as const }))
              }];
              updateContent({ foot: newFoot });
            } else {
              updateContent({ foot: [] });
            }
          }}
        />
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="table-fixed">Fixed width table cells</Label>
        <Switch
          id="table-fixed"
          checked={(block.content as any)?.hasFixedLayout || false}
          onCheckedChange={(checked) => updateContent({ hasFixedLayout: checked })}
        />
      </div>

      <div>
        <Label htmlFor="table-caption">Table Caption</Label>
        <Input
          id="table-caption"
          value={(block.content as any)?.caption || ''}
          onChange={(e) => updateContent({ caption: e.target.value })}
          placeholder="Describe your table"
        />
      </div>

      <div>
        <Label htmlFor="table-class">Additional CSS Class(es)</Label>
        <Input
          id="table-class"
          value={block.content?.className || ''}
          onChange={(e) => updateContent({ className: e.target.value })}
          placeholder="e.g. is-style-stripes"
        />
      </div>
    </div>
  );
}

const TableBlock: BlockDefinition = {
  id: 'core/table',
  name: 'Table',
  icon: TableIcon,
  description: 'Create a table to display data',
  category: 'advanced',
  defaultContent: {
    body: [],
    head: [],
    foot: [],
    hasFixedLayout: false,
    caption: '',
    className: '',
  },
  defaultStyles: {
    margin: '1em 0',
  },
  renderer: TableRenderer,
  settings: TableSettings,
};

export default TableBlock;