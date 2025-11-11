Context: Drags from BlockLibrary reach the canvas during move (setOver shows canvas/index 0), but on release, over state is null and the result cancels with empty draggableId. This suggests reliance on stale state at end.

Scope of changes:
- Capture drag meta (id, sourceDroppableId, sourceIndex) at start in a ref local to Draggable to avoid reading possibly-reset context state.
- On end, recompute destination from event coordinates using elementFromPoint, falling back to stored over.
- Add logs for recompute and mismatch between stored over and recomputed destination.

Risk/Impact:
- Purely internal logic changes; preserves external API shape.
- More robust to missed move events or late pointer transitions.

Rollback:
- Use backups/dnd-index.tsx.touch-drag-fix.bak to revert to earlier behavior.

Date: 2025-11-11
