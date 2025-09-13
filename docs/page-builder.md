The `PageBuilder` is a comprehensive component for creating and editing page content using a block-based editor. Here's a breakdown of its architecture and functionality based on the files in `client/src/components/PageBuilder`:

### Core Components and Their Roles:

1.  **`PageBuilder.tsx` (The Orchestrator)**
    *   This is the main component that brings everything together.
    *   **State Management:** It holds the primary state, including the array of `blocks` that constitute the page, the `selectedBlockId` for editing, and the current `deviceView` (desktop, tablet, mobile).
    *   **Drag & Drop:** It implements `@hello-pangea/dnd` to handle all drag-and-drop logic. This includes adding new blocks from the library, reordering existing blocks, and even moving blocks into and out of nested structures like columns.
    *   **Data Handling:** It uses `@tanstack/react-query` to save the page or template structure (`blocks` array) to the backend via API calls.
    *   **Block Operations:** It contains the core logic for creating, updating, duplicating, and deleting blocks from the canvas.

2.  **`blocks/` (The Content Building Blocks)**
    *   This directory contains individual React components for each type of content block (e.g., `TextBlock.tsx`, `ImageBlock.tsx`, `HeadingBlock.tsx`).
    *   Each component is responsible for rendering its specific content based on the properties (`content`, `styles`) passed to it.
    *   `blocks/index.ts` likely acts as a registry, exporting all available blocks and providing default configurations for them.

3.  **`BlockRenderer.tsx` (The Renderer)**
    *   This component acts as a dynamic renderer. It receives a single `block` configuration object.
    *   Based on the `block.type`, it selects and renders the corresponding component from the `blocks/` directory.
    *   It also wraps the rendered block with UI elements for selection, duplication, and deletion.

4.  **`BlockLibrary.tsx` (The Block Palette)**
    *   This component displays the list of all available blocks that a user can add to the page.
    *   It serves as the "source" area from which users can drag new blocks onto the main canvas.

5.  **`BlockSettings.tsx` (The Inspector)**
    *   When a user selects a block on the canvas, this component appears in the sidebar.
    *   It displays a form with input fields and controls specific to the selected block's type, allowing the user to modify its content (e.g., text, image URL) and styling (e.g., padding, color).

6.  **`DevicePreview.tsx` (The Responsive Simulator)**
    *   This component wraps the main canvas where blocks are rendered.
    *   It adjusts the container's width to simulate how the page will look on different devices, controlled by the device toggle buttons in the top bar.

### How It Works: A Step-by-Step Flow

1.  **Initialization:** The `PageBuilder` component loads the initial block configuration for a post or template.
2.  **Rendering:** It maps over the `blocks` array. For each block object, it uses `BlockRenderer` to render the appropriate visual component on the canvas.
3.  **Adding a New Block:**
    *   A user drags a block type from the `BlockLibrary`.
    *   They drop it onto the main canvas (`Droppable` area).
    *   The `onDragEnd` handler in `PageBuilder.tsx` detects this, creates a new default block configuration using a helper function, and inserts it into the `blocks` state array at the correct position.
4.  **Editing a Block:**
    *   A user clicks on a block on the canvas.
    *   The block's ID is stored in the `selectedBlockId` state.
    *   The `BlockSettings` component receives the configuration of the selected block and displays the relevant editing fields.
    *   As the user makes changes in the settings panel, an `onUpdate` function is called, which updates the configuration for that specific block within the main `blocks` array in `PageBuilder.tsx`.
5.  **Reordering Blocks:**
    *   A user drags an existing block on the canvas.
    *   The `onDragEnd` handler repositions the block's configuration object within the `blocks` array, and the UI re-renders to reflect the new order.
6.  **Saving:**
    *   When the user saves, the `saveMutation` is triggered, sending the entire `blocks` array to the server to be persisted in the database.

### `@hello-pangea/dnd` Integration

The drag-and-drop functionality is powered by `@hello-pangea/dnd` and is structured around three key components:

1.  **`<DragDropContext>` (The Conductor)**
    *   This component wraps the entire page builder layout.
    *   It manages the state of any drag-and-drop operation occurring within it.
    *   Its most important prop is `onDragEnd`, which points to the `handleDragEnd` function. This function is called once when a user drops a block, containing all the logic to update the state.

2.  **`<Droppable>` (The Drop Zones)**
    *   These define areas where a draggable item can be dropped.
    *   **Block Library:** The list of available blocks is a droppable area, allowing you to "pick up" a new block.
    *   **Main Canvas:** The primary content area is a droppable area with the ID `canvas`, where blocks are arranged.
    *   The component provides a `placeholder` to visually indicate where a dragged item will land.

3.  **`<Draggable>` (The Items)**
    *   This component is wrapped around each individual block on the canvas, making it movable.
    *   It requires a unique `draggableId` (the block's ID) and an `index`.
    *   It provides the necessary props to the underlying DOM element to enable drag-and-drop behavior.

### The `handleDragEnd` Function

When a user drops a block, the `handleDragEnd` function is executed with a `result` object containing:

*   `source`: Where the drag started (which droppable area and at what index).
*   `destination`: Where the drag ended.
*   `draggableId`: The ID of the item that was moved.

The function then uses this information to update the `blocks` state array by:
*   **Adding a new block** if dragged from the library.
*   **Reordering the array** if a block was moved within the canvas.
*   **Handling nested cases**, such as moving a block into a "Columns" block.
