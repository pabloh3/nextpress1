# Page Builder Refactoring: A New Architecture

**Objective**: To refactor the page builder's block system into a more scalable, maintainable, and robust architecture. This plan will make adding new blocks (especially container blocks) easier and simplify the overall codebase.

**Author**: opencode
**Date**: Thu Sep 11 2025

---

## 1. Phase 1: Schema and Type Refactoring

This phase focuses on creating a flexible and self-contained type system for our blocks.

### 1.1. Update `shared/schema.ts`

**Why**: To create a single, generic `BlockConfig` that natively supports nesting and to decouple specific block types from the shared schema.

**Changes**:

1.  **Modify `BlockConfig`**:
    *   Add an optional `children` property: `children?: BlockConfig[];`.
    *   Ensure the `content` property is a generic `Record<string, any>`.

2.  **Remove Specific Block Configurations**:
    *   Delete all `...BlockConfig` interfaces (e.g., `TextBlockConfig`, `ImageBlockConfig`, `GroupBlockConfig`, etc.) from this file. These will be moved into their respective block component files.

### 1.2. Update `client/src/components/PageBuilder/blocks/types.ts`

**Why**: To add a simple, explicit flag that identifies which blocks can contain other blocks.

**Changes**:

1.  **Modify `BlockDefinition`**:
    *   Add a new optional property: `isContainer?: boolean;`.

### 1.3. Relocate Block-Specific Types

**Why**: To make each block component truly self-contained, with its own type definitions.

**Action**:

*   For every block in `client/src/components/PageBuilder/blocks/`, create and export a specific `...BlockConfig` interface that extends the base `BlockConfig`.

**Example (`HeadingBlock.tsx`)**:

```typescript
import type { BlockConfig } from '@shared/schema';
import type { BlockDefinition } from '../types';

// New self-contained type definition
export interface HeadingBlockConfig extends BlockConfig {
  content: {
    text: string;
    level: 1 | 2 | 3 | 4 | 5 | 6;
  };
}

// ... rest of the component
```

---

## 2. Phase 2: Block Implementation Updates

This phase involves updating the block components to align with the new architecture.

### 2.1. Update Container Blocks (`Group`, `Columns`, etc.)

**Why**: To standardize how container blocks are defined and how they render their children.

**Changes**:

1.  **Update Block Definition**:
    *   Set `isContainer: true` in the `BlockDefinition`.
    *   Update `defaultContent` to remove any `innerBlocks` or similar properties. Nested blocks will now be handled by the `children` property.

2.  **Update Renderer**:
    *   Read nested blocks from the new `block.children` property instead of a custom property on `block.content`.
    *   Simplify the `<Droppable>` component's `droppableId` to just be the block's ID (e.g., `droppableId={block.id}`).

**Example (`GroupBlock.tsx`)**:

```typescript
// ... imports

// 1. Define the specific type
export interface GroupBlockConfig extends BlockConfig {
  content: { tagName: string; };
  children: BlockConfig[];
}

// 2. Update the renderer
function GroupRenderer({ block }: { block: GroupBlockConfig }) {
  const children = block.children || []; // Use the new property
  // ...
  return (
    // ...
    <Droppable droppableId={block.id}> {/* Simplified ID */}
      {/* ... render children */}
    </Droppable>
    // ...
  );
}

// 3. Update the block definition
const GroupBlock: BlockDefinition = {
  id: 'core/group',
  name: 'Group',
  isContainer: true, // Mark as container
  // ...
};
```

### 2.2. Update Basic Blocks

**Why**: To ensure all blocks follow the new self-contained type definition pattern.

**Action**:

*   For each non-container block, ensure the specific `...BlockConfig` type has been moved into its file from `shared/schema.ts`. No other changes are likely needed for these simpler blocks.

---

## 3. Phase 3: Core Logic Refactoring

This is the most critical phase, where we overhaul the block management and drag-and-drop systems.

### 3.1. Refactor `useBlockManager.ts`

**Why**: The current functions only operate on a flat array of blocks. They must be updated to handle a nested tree structure.

**Changes**:

1.  **Create Recursive Helpers**: For each core function (`updateBlock`, `deleteBlock`, `duplicateBlock`), create a corresponding recursive helper function (e.g., `findAndDeleteBlock(blocks, blockId)`).
2.  **Update Core Functions**: The main functions will now call these recursive helpers, passing in the top-level `blocks` array.

**Hint (`deleteBlock` example)**:

```typescript
function findAndDelete(blocks: BlockConfig[], blockId: string): BlockConfig[] {
  // First, try to filter at the current level
  const filteredBlocks = blocks.filter(b => b.id !== blockId);
  if (filteredBlocks.length < blocks.length) {
    return filteredBlocks;
  }

  // If not found, recurse into children of containers
  return blocks.map(block => {
    if (block.children && block.children.length > 0) {
      block.children = findAndDelete(block.children, blockId);
    }
    return block;
  });
}

const deleteBlock = useCallback((blockId: string) => {
  setBlocks(blocks => findAndDelete(blocks, blockId));
}, []);
```

### 3.2. Refactor Drag-and-Drop Handlers

**Why**: To replace the brittle, column-specific logic with a generic, container-aware system.

**Actions**:

1.  **Delete Old Handlers**:
    *   Delete all files in `client/src/lib/handlers/` related to columns (e.g., `moveBetweenColumns.ts`, `moveFromCanvasToColumn.ts`, `parseColumnDroppable.ts`, etc.).

2.  **Create New Generic Handlers**:
    *   Create a new set of simplified, generic handlers. These will be placed in a new directory, e.g., `client/src/lib/dnd-handlers/`.
        *   `move-to-container.ts`: Handles moving a block into any container.
        *   `reorder-in-container.ts`: Handles reordering blocks within the same container.
        *   `move-between-containers.ts`: Handles moving a block from one container to another.
        *   `move-from-library.ts`: Handles dragging a new block from the library.

3.  **Rewrite `useDragAndDropHandler.ts`**:
    *   This hook will be completely rewritten.
    *   The `handleDragEnd` function will no longer use complex `if/else` logic based on `droppableId` strings.
    *   Instead, it will use the `blockRegistry` to look up the definitions of the source and destination blocks, check their `isContainer` flags, and call the appropriate new generic handler.

**Hint (`handleDragEnd` logic)**:

```typescript
// Inside handleDragEnd...
const { source, destination } = result;

// Get the block definitions
const sourceBlockDef = blockRegistry[source.droppableId];
const destBlockDef = blockRegistry[destination.droppableId];

// Scenario 1: Reordering in the same container
if (source.droppableId === destination.droppableId) {
  // Call reorder-in-container helper
}

// Scenario 2: Moving between two containers
if (sourceBlockDef?.isContainer && destBlockDef?.isContainer) {
  // Call move-between-containers helper
}

// Scenario 3: Moving from library to a container
if (source.droppableId === 'block-library' && destBlockDef?.isContainer) {
  // Call move-from-library-to-container helper
}

// ... and so on for all scenarios.
```

---

## 4. Phase 4: Verification

1.  **Manual Testing**:
    *   Thoroughly test all drag-and-drop scenarios:
        *   Dragging from the library to the canvas.
        *   Dragging from the library into a `Group`.
        *   Dragging from the library into a `Column`.
        *   Moving a block from the canvas into a `Group`.
        *   Moving a block from a `Group` back to the canvas.
        *   Moving a block between two different `Group`s.
        *   Reordering blocks within a `Group`.
    *   Verify that deleting, duplicating, and updating blocks works at any nesting level.
2.  **Code Review**: Ensure all old handlers have been removed and the new architecture is consistently applied.
