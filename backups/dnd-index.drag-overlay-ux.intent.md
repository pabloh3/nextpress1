# Intent: Enhance Drag Overlay UX

## Original Intent (Previous Session Summary)
- Provide a minimal overlay that follows cursor during drag showing raw block id.
- Preserve meta data for finalizeDrag.
- Reduce noisy logs behind DEBUG_BUILDER flag.

## Current Enhancement Scope
1. Add ability for consumer to customize overlay content (icon + human label) rather than hard-coded id string.
2. Avoid coupling dnd internals to block registry; expose a `renderOverlay` prop to `DragDropContext` so parent (PageBuilder) passes renderer.
3. Preserve existing public types and behaviour (DropResult structure unchanged).
4. Keep overlay state mgmt internal (id + coords), only delegate rendering of inner content.
5. Guard any new verbose logging with `import.meta.env.DEBUG_BUILDER`.

## Planned Changes
- Extend `DragDropContextProps` with optional `renderOverlay?: (data: { id: string }) => React.ReactNode`.
- Replace inline overlay DOM with wrapper container that calls provided renderer; fallback to id text when renderer absent.
- Do NOT import block registry into dnd layer (maintain separation of concerns).
- Update PageBuilder to supply `renderOverlay` using `blockRegistry` (lookup label + icon, fallback to id).

## Non-Goals
- No change to drag mechanics or finalize algorithm.
- No additional styling system; reuse existing minimal styling.
- No performance micro-optimizations yet (e.g., requestAnimationFrame).

## Risks / Considerations
- Must ensure rendering is lightweight each move; keep overlay component pure based on `overlay.id`.
- Avoid prop drilling; use context value unchanged except addition.

## Validation Steps
- Drag a block from library: overlay shows icon+label.
- Drag within canvas: overlay shows block label (same lookup still works with id).
- Cancel drag outside droppable: overlay disappears.

## Rollback Plan
- Backup already created: `backups/dnd-index.tsx.drag-overlay-ux.bak`.
- If issues arise, restore file and remove new PageBuilder `renderOverlay` usage.
