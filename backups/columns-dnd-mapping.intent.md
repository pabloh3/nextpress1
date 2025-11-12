Title: Map droppable column IDs to owning Columns block during DnD

Original issue and intent
- Drops into Columns sub-zones fail: destination.droppableId is a columnId (not a BlockConfig.id). insertNewBlock/moveExistingBlock expect parent ids to be actual block ids. Result: operations no-op and error toast shows.

Approach
- Minimal, local mapping inside useDragAndDropHandler only. Do not rewrite Columns renderer or treeUtils.
- Detect when source/destination droppableIds match a Columns `settings.columnLayout[].columnId` via a traversal helper.
- Translate to the owning Columns block id and compute a global child index mapping between column-local positions and the Columns children array.
- After insertion/move, update `settings.columnLayout[].blockIds` to reflect the new membership/order.

Scope
- File changed: client/src/hooks/useDragAndDropHandler.ts
- Backed up original to backups/useDragAndDropHandler.ts.columns-mapping.bak
- Added helpers: findColumnsContext, computeGlobalIndexForColumn, getGlobalIndexAtColumnPosition, updateColumnAssignments.

Notes
- This keeps `ColumnsBlock` JSX unchanged and preserves existing dnd library assumptions.
- Column ordering is enforced by layout.blockIds for rendering; global children ordering remains stable and compatible with treeUtils.
- Future: consolidate index computations if we generalize sub-zones.
