# Intent: Add minimal drag overlay preview

## Date
2025-11-11

## Original Situation
Dragging blocks from the library to the canvas currently provides no visual feedback aside from opacity change on source card. Users do not see a ghost/preview following the cursor. This impacts usability and spatial reasoning when placing blocks.

## Problem
The existing custom DnD implementation tracks pointer movement and over-state but does not expose cursor coordinates nor render a transient overlay element. Without a preview, it is harder to target positions and provides lower quality UX vs common builders.

## Goal
Provide a lightweight drag overlay that:
- Appears when a drag starts (isDragging true) with block label + icon
- Follows cursor using `clientX/clientY` captured in move handler
- Closes on drag end/cancel
- Does not interfere with existing drop logic or pointer events
- Minimal styles: small card-like badge with subtle shadow and reduced opacity

## Scope of Change
File: `client/src/lib/dnd/index.tsx`
Changes:
1. Extend context with overlay state setters (`setOverlay`, `clearOverlay`) and current overlay data `{ id, label, x, y, visible }`.
2. In `handleDragStart`, initialize overlay with block metadata and starting pointer position.
3. In move handler, update overlay position.
4. In end handler, clear overlay.
5. Render overlay element inside `DragDropContext` provider (portal-like div absolutely positioned fixed at top-level).

No changes to public component props API; Draggable children remain same. Consumers (BlockLibrary) unaffected.

## Non-Goals
- Full reparenting of DOM element while dragging
- Animations or collision styling
- Placeholder adjustments

## Expected Impact
Improves drag UX clarity. Does not alter DropResult logic. Performance impact negligible due to minimal state updates (positions only during drag).

## Risks & Mitigations
- Frequent re-renders could affect performance: use single state object and requestAnimationFrame optimization if needed (future enhancement).
- Overlay might capture pointer events: will set `pointer-events: none` style.

## Rollback Plan
Restore prior file from latest backup: `backups/dnd-index.tsx.finalize-drag-invoke.bak`.

## Follow-ups (Out of Scope)
- Replace position updates with transform + RAF
- Add placeholder insertion animation
- Consolidate verbose logs
