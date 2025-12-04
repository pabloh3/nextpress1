# Block State Architecture

## Goals
- Make each block component the single source of truth for its content, styles, and settings.
- Keep the page-level builder state canonical, handling undo/redo history and persistence.
- Reduce sync loops between the parent and child components, simplifying mental models and debugging.

## Data Flow
1. **Initialization**: When a block component mounts, it initializes local state from its incoming `value` *once*. A stable `clientId` (based on the incoming id or a generated one) is used to register a state accessor.
2. **Local Edits**: UI interactions mutate the component's local React state. The shared `useBlockState` hook immediately fires `onChange` with the full block payload.
3. **Parent Commit**: `PageBuilder` receives the updated block via `handleBlockChange` and deep-merges it into the canonical `blocks` array, recording the new snapshot in the undo/redo history.
4. **Persistence**: The builder continues to debounce writes to localStorage and, on explicit save, posts the latest block tree to the backend.

```
Block UI -> useBlockState -> onChange(updatedBlock)
   ↓                                         ↑
PageBuilder.commitBlocks(updateBlockDeep) ----
```

## Why This Matters
- **Predictability**: Blocks never wait for parent props to round-trip before reflecting user input. Editing a block updates immediately.
- **Performance**: Only the affected block rerenders. The parent stores immutable snapshots for undo/redo instead of diffing references.
- **Extensibility**: Features like collaborative cursors or per-block autosave can hook into a well-defined change pipeline.

## Key Pieces
- `[client/src/components/PageBuilder/PageBuilder.tsx](../client/src/components/PageBuilder/PageBuilder.tsx)`
  - wraps the canonical `blocks` array with `useUndoRedo`.
  - exposes `handleBlockChange`, `handleDuplicate`, `handleDelete`, and keyboard shortcuts.
- `[client/src/components/PageBuilder/blocks/useBlockState.ts](../client/src/components/PageBuilder/blocks/useBlockState.ts)`
  - centralizes local block state, registration, and `onChange` emission.
  - keeps the legacy settings sidebar working via the block-state registry.
- `[client/src/components/PageBuilder/BlockSettings.tsx](../client/src/components/PageBuilder/BlockSettings.tsx)`
  - now talks to live block state when an accessor is available, falling back to the old prop-updates path when needed.

## Rationale
The previous architecture attempted to keep block state only in the parent, forcing each block to "sync" props back into its own local state on every change. That bi-directional sync made undo/redo brittle and created infinite update loops. The new model embraces component-local state, treating the parent as a canonical log of block snapshots.

## Operational Notes
- **Block examples**: `text/TextBlock.tsx` and `heading/HeadingBlock.tsx` served as the initial reference implementations; every other block (gallery, media-text, tables, video, etc.) now follows the exact same `useBlockState` pattern with no legacy sync refs or manual registry wiring.
- **Settings access**: Because the hook registers `getContent/getStyles/getSettings`, sidebar components continue to work without change; see `BlockSettings.tsx` for the preferred accessor usage.
- **Shortcuts/controls**: Undo/Redo buttons live in the builder top bar with tooltips (`Ctrl/Cmd+Z`, `Ctrl/Cmd+Shift+Z`), and `Ctrl/Cmd+S` triggers the save mutation alongside the explicit Save button.

## Future Work
- **Async Persistence**: Surface status indicators (saving, failed save, etc.) now that block updates are deterministic.
- **Collaboration Hooks**: Emit granular block events for multi-user editing and comments.
- **Schema Validation**: Layer Zod/io-ts validation on block payloads before committing to prevent malformed data.
- **Testing**: Expand integration tests that render blocks end-to-end to ensure settings + local state stay in sync.

