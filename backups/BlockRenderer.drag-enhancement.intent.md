# BlockRenderer Drag Enhancement Intent

## Original User Intent
Fix perceived broken drag-and-drop in PageBuilder canvas where blocks appear non-draggable after recent refactors.

## Root Cause Analysis
- Custom DnD wrapper only binds drag start to `dragHandleProps` (onMouseDown/onTouchStart)
- BlockRenderer conditionally shows invisible full-block overlay when NOT hovered/selected
- When hovered/selected, overlay removed and only small Move icon receives `dragHandleProps`
- Result: dragging block body while hovered/selected does nothing, feels broken
- Contrast: BlockLibrary applies `dragHandleProps` to entire card, always draggable

## Scope of Changes
**Primary file**: `client/src/components/PageBuilder/BlockRenderer.tsx`

### What we're changing:
1. Keep invisible full-block drag overlay always active (regardless of hover/selection state)
2. Add `cursor-move` to overlay for better UX feedback
3. Retain Move icon in toolbar for discoverability and precision
4. Both overlay and Move icon will initiate drag

### What we're NOT changing:
- DnD wrapper implementation (`client/src/lib/dnd/index.tsx`)
- BuilderCanvas or BlockLibrary drag behavior
- Nested container structure in ContainerChildren
- Any block registry or block-specific renderers
- Drag handler logic in `useDragAndDropHandler.ts`

## Expected Behavior After Change
- Top-level blocks draggable from anywhere on block surface, even when hovered/selected
- Nested blocks (in Columns, Groups, etc.) maintain same full-surface drag
- Move icon still visible and functional for precision and affordance
- No visual regression: selection rings, toolbars, highlights unchanged
- Drag feedback consistent with BlockLibrary cards

## Testing Strategy
1. Existing unit tests should pass (no breaking changes to API)
2. Manual verification checklist:
   - Drag unselected top-level block
   - Drag selected block from body
   - Drag via Move icon
   - Drag nested child in container
   - Drag library block into canvas and reorder
3. Optional: Add test asserting invisible overlay present when hovered+dragHandleProps exists

## Non-Goals
- Not redesigning DnD architecture
- Not changing drag handle visual affordance strategy
- Not modifying container nesting logic
- Not touching drag preview or ghost styling

## Rollback Plan
Restore from backup: `backups/BlockRenderer.tsx.drag-enhancement.bak`

## Files Backed Up
- `client/src/components/PageBuilder/BlockRenderer.tsx` → `backups/BlockRenderer.tsx.drag-enhancement.bak`
