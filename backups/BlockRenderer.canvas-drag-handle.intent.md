# Canvas Drag Handle Implementation Intent

## User's Original Intent
- **Sidebar blocks**: Whole block should be draggable (grab anywhere)
- **Canvas blocks**: Should have a visible drag handle icon in toolbar

## Current Problem
- BlockLibrary: Already working correctly - spreads both `draggableProps` and `dragHandleProps` on Card, making whole block draggable
- BuilderCanvas/BlockRenderer: `dragHandleProps` are passed down but **never spread on any visible element**, so drag doesn't work

## Root Cause
In BlockRenderer.tsx:
- The `dragHandleProps` prop is received (line 109)
- But it's never used/spread on any DOM element
- The toolbar has Copy and Trash2 buttons, but no Move/GripVertical button with `{...dragHandleProps}`

## Planned Changes to BlockRenderer.tsx

### 1. Add drag handle button to toolbar (lines 184-216)
- Add a Move icon button between the label and Copy button
- Spread `{...dragHandleProps}` on this button
- Only show when `dragHandleProps` is provided (canvas blocks, not library)
- Style with `cursor-grab` and `cursor-grabbing:active`

### 2. Visual indicator
- Use GripVertical or Move icon from lucide-react
- Add appropriate ARIA label for accessibility

## Expected Behavior After Changes
1. **Sidebar (BlockLibrary)**: Whole card draggable (already working)
2. **Canvas blocks**: Drag handle icon in toolbar becomes grab point
3. **Nested container children**: Also get drag handle via `dragHandleProps` passed from ContainerChildren

## Files Affected
- `client/src/components/PageBuilder/BlockRenderer.tsx` - Add drag handle button to toolbar

## Testing Strategy
1. Start dev server
2. Verify sidebar blocks drag by grabbing anywhere on card
3. Verify canvas blocks drag only by grabbing the Move icon in toolbar
4. Verify nested blocks in containers also have drag handles

## Design Decision
Separate UX for library vs canvas:
- Library: Whole block = intuitive for initial placement
- Canvas: Drag handle = prevents accidental moves while editing
