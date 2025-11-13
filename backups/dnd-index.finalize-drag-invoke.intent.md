# Intent: Invoke finalizeDrag in Draggable end handler

## Date
2025-11-11

## Original Situation
Recent instrumentation showed that on drag end the DropResult built by `ctxOnDragEnd` had lost original `draggableId` and `source.droppableId` (they appeared as '' and 'unknown-source'). We added `dragMetaRef` to persist these but never switched the end handler to use `finalizeDrag`.

## Problem
`Draggable` currently calls `context.onDragEnd(finalDestination)` which relies on transient `dragState` that was cleared/reset before building result in some cases, causing source mis-identification and failing block-library insertion (library → canvas drop treated as reorder of unknown source).

## Goal
Replace `context.onDragEnd(...)` invocation with `context.finalizeDrag(meta, finalDestination)` so that:
- `draggableId` uses persistent meta.id
- `source.droppableId` correctly reflects originating droppable (e.g. `block-library-basic`)
- Library insert path (`isFromLibrary`) triggers in `useDragAndDropHandler`

## Scope of Change
Single file: `client/src/lib/dnd/index.tsx` modifying only the `handleEnd` logic inside `Draggable`. Add guard for missing meta and log accordingly. Keep existing recompute of destination. No change to public component props or types.

## Expected Impact
Enables successful insertion of new blocks from block library into canvas with accurate source metadata. Does not affect existing reorder of blocks within canvas since logic path remains similar.

## Rollback Plan
Restore from backup file: `backups/dnd-index.tsx.finalize-drag-invoke.bak` if issues arise.

## Additional Notes
After verification we may reduce verbose console logs; out of scope for this change.
