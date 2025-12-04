# Block State Architecture Analysis

## Current Settings Flow

### 1. BuilderSidebar (line 120-126)
- Renders `<BlockSettings block={selectedBlock} onUpdate={(updates) => updateBlock(selectedBlock.id, updates)} />`
- `selectedBlock` comes from parent state (blocks array)
- `updateBlock` comes from PageBuilder

### 2. BlockSettings (line 130-151)
- Looks up block definition: `blockRegistry[block.name]`
- If block has `settings` function, renders: `<SettingsComp block={block} onUpdate={onUpdate} />`
- Passes `block` (from parent state) and `onUpdate` callback

### 3. LegacyHeadingSettings (line 214-364)
- Receives `block` (BlockConfig from parent state) and `onUpdate` callback
- Reads from `block.content`, `block.styles` (parent state)
- When user changes something, calls `onUpdate({ content: {...} })` or `onUpdate({ styles: {...} })`

### 4. PageBuilder.updateBlock (line 85-89)
- Calls `updateBlockInternal(blockId, updates)`
- Updates the blocks array in parent state
- State flows back down as props to components

### 5. HeadingBlockComponent (line 66-182)
- Receives `value` prop (block from parent state)
- Tries to sync with props → **This creates the conflict**

## The Problem

**Current flow:**
```
Settings → onUpdate → updateBlock → Parent State → Props → Component syncs → Conflict/Loops
```

Settings update parent state, which flows down as props, causing the component to try to sync, creating loops and race conditions.

## What We Need

**Desired flow (Markdown Editor Pattern):**
```
Settings → Direct access to Component's internal state → Component updates itself
         → Component notifies parent (debounced) for localStorage only
```

### Key Principles:
1. **Component is the ONLY source of truth** for its state (content, styles)
2. **Settings access component's state directly** - not through parent state
3. **Parent only tracks block structure** (IDs, hierarchy, order) - not content/styles
4. **Parent can READ state** for saving (getState/getValue pattern) but cannot modify it
5. **Component notifies parent** (debounced) only for localStorage persistence

## Proposed Architecture

### Block Export Structure
Each block file exports:
```typescript
export default {
  block: HeadingBlockComponent,  // The main component (manages state)
  renderer: HeadingRenderer,      // Pure render function
  settings: HeadingSettings,       // Settings component (accesses block's state)
}
```

### State Access Pattern
Settings need direct access to block's internal state. Options:
1. **Registry pattern** - Block registers itself, settings look it up by ID
2. **Context pattern** - Block provides context, settings consume it
3. **Same module closure** - If settings are in same file, they can share state

### Data Flow
1. User edits in settings → Settings updates component's internal state directly
2. Component state changes → Component notifies parent (debounced) for localStorage save
3. Parent reads state → Saves to localStorage (read-only, no modification)
4. On load → Component initializes from saved state (one-time, then becomes source of truth)

## Next Steps

1. Refactor HeadingBlock to use registry pattern for state access
2. Make settings component access block's state directly via registry
3. Remove prop syncing from component (only sync on mount/block ID change)
4. Update BlockSettings to use new pattern
5. Test that settings update component state directly without parent state conflicts

