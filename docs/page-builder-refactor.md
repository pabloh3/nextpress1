### High-Level Refactoring Strategy

The main goal is to separate concerns. The `PageBuilder` component currently manages UI state, block data, drag-and-drop logic, data saving, and the overall layout. We can break these apart into more focused, single-purpose modules.

### Suggested Refactoring Ideas

1.  **Extract Logic into Custom Hooks:** The component's logic is tightly coupled with its view. We can extract most of this into custom hooks to make the `PageBuilder` component itself primarily responsible for layout.

    *   **`useBlockManager` Hook:** Create a hook to manage the `blocks` array. It would encapsulate all state and functions related to block manipulation.
        *   **Manages:** The `blocks` state.
        *   **Exposes Functions:** `updateBlock`, `duplicateBlock`, `deleteBlock`, `setBlocks`.
        *   **Benefit:** Centralizes all block state operations in one place.

    *   **`useDragAndDropHandler` Hook:** The `handleDragEnd` function is by far the most complex part of the component. It could be its own module.
        *   **Input:** Takes the current `blocks` array and the `result` object from `dnd`.
        *   **Output:** Returns a new, updated `blocks` array.
        *   **Internal Logic:** The large `if/else` chain can be broken down into smaller, pure functions for each specific drag-and-drop scenario (e.g., `moveFromLibraryToCanvas`, `reorderInCanvas`, `moveIntoColumn`).
        *   **Benefit:** This makes the complex drag-and-drop logic isolated, easier to test, and more readable.

2.  **Break Down the JSX into Smaller Components:** The `return` statement is very large and describes the entire layout. This can be broken down into structural components.

    *   **`BuilderSidebar.tsx`:** A new component to render the entire left sidebar, containing the `BlockLibrary` and `BlockSettings`.
    *   **`BuilderTopBar.tsx`:** A component for the top bar, which includes the device preview toggles and the save/preview buttons.
    *   **`BuilderCanvas.tsx`:** A component for the main droppable area where blocks are rendered.

3.  **Decouple Data Saving:** The `useMutation` logic for saving the page is defined directly inside the component. This can be extracted.

    *   **`usePageSave` Hook:** A hook that encapsulates the `useMutation` logic.
        *   **Handles:** The API call, success/error toasts, and query invalidation.
        *   **Exposes:** A `savePage` function and the mutation status (e.g., `isSaving`).
        *   **Benefit:** Separates the data-saving concern from the UI, making the `PageBuilder` cleaner.

4.  **Centralize Block Creation Logic:** The `createDefaultBlock` function contains a large `switch` statement. This logic is already partially delegated to `getDefaultBlock` from the `blocks` directory. This delegation should be made absolute.

    *   **Refactor `createDefaultBlock`:** Remove the `switch` statement entirely. The `blocks/index.ts` file should act as a complete "block registry," responsible for providing the default configuration for every block type.
    *   **Benefit:** To add a new block to the page builder, a developer would only need to define it in the `blocks` directory and register it, without ever needing to modify the `PageBuilder` component itself.

### Summary of Benefits

If we implement these changes:

*   **Readability:** The `PageBuilder.tsx` file would shrink dramatically, becoming a much clearer composition of hooks and smaller components.
*   **Extensibility:** Adding a new block or a new drag-and-drop behavior would involve modifying a small, isolated module rather than the entire component.
*   **Testability:** Hooks and smaller functions can be unit-tested in isolation, which is much easier than testing a massive component.
*   **Debugging:** It would be easier to pinpoint the source of a bug when logic is separated by concern (e.g., a display issue would be in a view component, a state issue in a hook).

### Further Refactoring: `useDragAndDropHandler.ts`

The `useDragAndDropHandler` hook can be further improved by breaking its monolithic `handleDragEnd` function into smaller, single-purpose functions.

**Proposed Refactoring Plan:**

1.  **Create Pure Handler Functions for Each Scenario:**
    Extract the logic from each `if` block into a separate, pure function. Each function will take the current `blocks` array and the drag `result` and return a new, updated `blocks` array.

    *   `moveFromLibraryToCanvas(blocks, destination, draggableId)`
    *   `moveFromLibraryToColumn(blocks, destination, draggableId, destCol)`
    *   `reorderInCanvas(blocks, source, destination)`
    *   `moveFromCanvasToColumn(blocks, source, destination, destCol)`
    *   `moveFromColumnToCanvas(blocks, source, destination, sourceCol)`
    *   `moveBetweenColumns(blocks, source, destination, sourceCol, destCol)`

2.  **Create a Dispatcher:**
    The main `handleDragEnd` function will be simplified into a dispatcher. It will determine the type of drag operation and call the corresponding pure function, making the flow of control clear and concise.

3.  **Isolate Column-Specific Logic:**
    To reduce code duplication, create dedicated helper functions for the complex logic of manipulating blocks within a "Columns" block.

    *   `findColumnBlock(blocks, blockId)`
    *   `updateBlocksInColumn(columnBlock, columnIndex, newBlocks)`

**Benefits of This Refactoring:**

*   **Readability:** The logic will be broken down into small, descriptively named functions, making it easy to understand.
*   **Testability:** Each pure function can be unit-tested in isolation.
*   **Maintainability:** Bugs can be fixed in small, specific functions without affecting the rest of the module.
*   **Extensibility:** Adding new drag behaviors (e.g., for a "Group" block) becomes as simple as adding a new handler function and updating the dispatcher.
