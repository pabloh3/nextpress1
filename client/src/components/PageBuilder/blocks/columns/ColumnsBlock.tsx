import type { BlockConfig, BlockContent } from "@shared/schema-types";
import type { BlockDefinition } from "../types";
import {
  Grid3x3 as GridIcon,
  Plus,
  Trash2,
  Wrench,
  Settings,
} from "lucide-react";
import { CollapsibleCard } from "@/components/ui/collapsible-card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Droppable, Draggable } from "@/lib/dnd";
import { useBlockActions } from "../../BlockActionsContext";
import BlockRenderer from "../../BlockRenderer";
import { generateBlockId } from "../../utils";

interface ColumnLayout {
  columnId: string;
  width?: string; // CSS width value like '33.33%', '200px', 'auto', '1fr'
  blockIds: string[]; // IDs of blocks assigned to this column
}

// Structured data shape stored under content: { kind: 'structured', data }
interface ColumnsData extends Record<string, unknown> {
  gap?: string;
  verticalAlignment?: "top" | "center" | "bottom" | "stretch";
  horizontalAlignment?: "left" | "center" | "right" | "space-between" | "space-around";
  direction?: "row" | "column";
}

/**
 * Extracts ColumnsData from a BlockContent which may be:
 * - structured: { kind: 'structured', data }
 * - legacy plain object (pre-union)
 * - undefined
 */
function readColumnsData(content: BlockContent): ColumnsData {
  if (!content) return {};
  if (typeof content === "object" && "kind" in content) {
    if (content.kind === "structured" && content.data && typeof content.data === "object") {
      const data = content.data as Record<string, unknown>;
      return {
        gap: typeof data.gap === "string" ? data.gap : undefined,
        verticalAlignment: typeof data.verticalAlignment === "string" ? (data.verticalAlignment as ColumnsData["verticalAlignment"]) : undefined,
        horizontalAlignment: typeof data.horizontalAlignment === "string" ? (data.horizontalAlignment as ColumnsData["horizontalAlignment"]) : undefined,
        direction: typeof data.direction === "string" ? (data.direction as ColumnsData["direction"]) : undefined,
      };
    }
    // non-structured kinds are not expected for this container
    return {};
  }
  // Legacy plain object: content may directly have keys
  const legacy = content as unknown as Record<string, unknown>;
  return {
    gap: typeof legacy.gap === "string" ? legacy.gap : undefined,
    verticalAlignment: typeof legacy.verticalAlignment === "string" ? (legacy.verticalAlignment as ColumnsData["verticalAlignment"]) : undefined,
    horizontalAlignment: typeof legacy.horizontalAlignment === "string" ? (legacy.horizontalAlignment as ColumnsData["horizontalAlignment"]) : undefined,
    direction: typeof legacy.direction === "string" ? (legacy.direction as ColumnsData["direction"]) : undefined,
  };
}

/**
 * Produces a structured BlockContent with merged updates for ColumnsData.
 * Always writes back as { kind: 'structured', data }
 */
function writeColumnsData(prev: BlockContent, updates: Partial<ColumnsData>): BlockContent {
  const current = readColumnsData(prev);
  const next: ColumnsData = { ...current, ...updates };
  return { kind: "structured", data: next as Record<string, unknown> };
}

function ColumnsRenderer({
  block,
  isPreview,
}: {
  block: BlockConfig;
  isPreview: boolean;
}) {
  const data = readColumnsData(block.content);
  const gap = data.gap || "20px";
  const verticalAlignment = data.verticalAlignment || "top";
  const horizontalAlignment = data.horizontalAlignment || "left";
  const direction = data.direction || "row";

  const columnLayout = (block.settings?.columnLayout as ColumnLayout[] | undefined) || [
    { columnId: "default-col-1", width: "100%", blockIds: [] },
  ];

  const children = block.children || [];

  const alignItems = {
    top: "flex-start",
    center: "center",
    bottom: "flex-end",
    stretch: "stretch",
  }[verticalAlignment];

  const justifyContent = {
    left: "flex-start",
    center: "center",
    right: "flex-end",
    "space-between": "space-between",
    "space-around": "space-around",
  }[horizontalAlignment];

  const actions = useBlockActions();

  return (
    <div
      className="wp-block-columns"
      style={{
        display: "flex",
        flexDirection: direction,
        flexWrap: direction === "row" ? "wrap" : "nowrap",
        gap,
        width: "100%",
        alignItems,
        justifyContent,
        ...block.styles,
      }}
    >
      {columnLayout.map((column) => {
        const columnChildren = children.filter((child) =>
          column.blockIds.includes(child.id)
        );

        return (
          <div
            key={column.columnId}
            className="wp-block-column"
            style={{
              flex: column.width === "auto" ? "none" : "1",
              width:
                column.width && column.width !== "auto" ? column.width : undefined,
              minWidth: 0,
            }}
          >
            {isPreview ? (
              <div className="space-y-2">
                {columnChildren.map((childBlock) => (
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
              <Droppable droppableId={column.columnId} direction="vertical">
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    style={{
                      minHeight: "60px",
                      border: snapshot.isDraggingOver ? "2px solid #3b82f6" : "2px dashed #e2e8f0",
                      borderRadius: "4px",
                      background: snapshot.isDraggingOver ? "rgba(59,130,246,0.06)" : undefined,
                      padding: "8px",
                      paddingBottom: columnChildren.length > 0 ? "20px" : "8px",
                    }}
                  >
                    {columnChildren.length > 0 ? (
                      columnChildren.map((childBlock, childIndex) => (
                        <Draggable
                          key={childBlock.id}
                          draggableId={childBlock.id}
                          index={childIndex}
                        >
                          {(dragProvided, dragSnapshot) => (
                            <div
                              ref={dragProvided.innerRef}
                              {...dragProvided.draggableProps}
                              className={`relative group ${
                                dragSnapshot.isDragging ? "opacity-50" : ""
                              }`}
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
        );
      })}
    </div>
  );
}

function ColumnsSettings({
  block,
  onUpdate,
}: {
  block: BlockConfig;
  onUpdate: (updates: Partial<BlockConfig>) => void;
}) {
  const columnLayout = (block.settings?.columnLayout as ColumnLayout[] | undefined) || [
    { columnId: "default-col-1", width: "100%", blockIds: [] },
  ];

  const updateContent = (contentUpdates: Partial<ColumnsData>) => {
    onUpdate({ content: writeColumnsData(block.content, contentUpdates) });
  };

  const updateSettings = (settingsUpdates: Partial<{ columnLayout: ColumnLayout[] }>) => {
    onUpdate({
      settings: {
        ...(block.settings || {}),
        ...settingsUpdates,
      },
    });
  };

  const updateColumnLayout = (newColumnLayout: ColumnLayout[]) => {
    updateSettings({ columnLayout: newColumnLayout });
  };

  const addColumn = () => {
    const newColumn: ColumnLayout = {
      columnId: generateBlockId(),
      width: "auto",
      blockIds: [],
    };
    updateColumnLayout([...columnLayout, newColumn]);
  };

  const removeColumn = (index: number) => {
    const newColumnLayout = columnLayout.filter((_, i) => i !== index);
    updateColumnLayout(newColumnLayout);
  };

  const updateColumn = (index: number, updates: Partial<ColumnLayout>) => {
    const newColumnLayout = columnLayout.map((col, i) => (i === index ? { ...col, ...updates } : col));
    updateColumnLayout(newColumnLayout);
  };

  const addQuickColumns = (count: number) => {
    const width = `${(100 / count).toFixed(2)}%`;
    const ids = Array.from({ length: count }, () => generateBlockId());
    const newColumnLayout: ColumnLayout[] = ids.map((id) => ({
      columnId: `col-${id}`,
      width,
      blockIds: [],
    }));
    updateColumnLayout(newColumnLayout);
  };

  const data = readColumnsData(block.content);

  return (
    <div className="space-y-4">
      <CollapsibleCard title="Content" icon={GridIcon} defaultOpen={true}>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Label aria-label="Number of columns">Columns ({columnLayout.length})</Label>
            <Button type="button" variant="outline" size="sm" onClick={addColumn} aria-label="Add column">
              <Plus className="w-4 h-4 mr-1" />
              Add Column
            </Button>
          </div>

          <div className="grid grid-cols-4 gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => addQuickColumns(2)} className="text-xs" aria-label="2 columns">
              2 Cols
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => addQuickColumns(3)} className="text-xs" aria-label="3 columns">
              3 Cols
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => addQuickColumns(4)} className="text-xs" aria-label="4 columns">
              4 Cols
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => addQuickColumns(6)} className="text-xs" aria-label="6 columns">
              6 Cols
            </Button>
          </div>

          {columnLayout.map((column, index) => (
            <div key={column.columnId} className="border rounded p-3 space-y-2">
              <div className="flex justify-between items-center">
                <Label className="font-medium text-sm" aria-label={`Column ${index + 1}`}>
                  Column {index + 1}
                </Label>
                <Button type="button" variant="ghost" size="sm" onClick={() => removeColumn(index)} className="text-red-600 h-6 w-6 p-0" aria-label={`Remove column ${index + 1}`}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
              <div>
                <Label htmlFor={`col-width-${index}`} className="text-xs">
                  Width
                </Label>
                <Select value={column.width || "auto"} onValueChange={(value) => updateColumn(index, { width: value })}>
                  <SelectTrigger className="h-9" id={`col-width-${index}`} aria-label={`Column ${index + 1} width`}>
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
        </div>
      </CollapsibleCard>

      <CollapsibleCard title="Settings" icon={Settings} defaultOpen={true}>
        <div className="space-y-3">
          <div className="grid grid-cols-12 gap-2 items-center">
            <div className="col-span-4">
              <Label htmlFor="columns-direction">Direction</Label>
            </div>
            <div className="col-span-8">
              <Select value={data.direction || "row"} onValueChange={(value) => updateContent({ direction: value as "row" | "column" })}>
                <SelectTrigger className="h-9" id="columns-direction" aria-label="Columns direction">
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
              <Input id="columns-gap" className="h-9" value={data.gap || "20px"} onChange={(e) => updateContent({ gap: e.target.value })} placeholder="e.g. 10px, 2rem" aria-label="Gap between columns" />
            </div>
          </div>
        </div>
      </CollapsibleCard>

      <CollapsibleCard title="Advanced" icon={Wrench} defaultOpen={false}>
        <div className="space-y-3">
          <div className="grid grid-cols-12 gap-2 items-center">
            <div className="col-span-4">
              <Label htmlFor="vertical-align">Vertical Alignment</Label>
            </div>
            <div className="col-span-8">
              <Select value={data.verticalAlignment || "top"} onValueChange={(value) => updateContent({ verticalAlignment: value as ColumnsData["verticalAlignment"] })}>
                <SelectTrigger className="h-9" id="vertical-align" aria-label="Vertical alignment">
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
              <Label htmlFor="horizontal-align">Horizontal Alignment</Label>
            </div>
            <div className="col-span-8">
              <Select value={data.horizontalAlignment || "left"} onValueChange={(value) => updateContent({ horizontalAlignment: value as ColumnsData["horizontalAlignment"] })}>
                <SelectTrigger className="h-9" id="horizontal-align" aria-label="Horizontal alignment">
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
        </div>
      </CollapsibleCard>
    </div>
  );
}

const ColumnsBlock: BlockDefinition = {
  id: "core/columns",
  label: "Columns",
  icon: GridIcon,
  description: "Flexible horizontal container for any blocks",
  category: "layout",
  isContainer: true,
  handlesOwnChildren: true,
  defaultContent: { kind: "structured", data: { gap: "20px", verticalAlignment: "top", horizontalAlignment: "left", direction: "row" } },
  defaultStyles: {},
  renderer: ColumnsRenderer,
  settings: ColumnsSettings,
};

export default ColumnsBlock;
