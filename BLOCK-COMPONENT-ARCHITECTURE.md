# Block Component Architecture

## Overview

This document describes the modern block component architecture used in the NextPress page builder. The architecture follows a **data-first, component-driven** pattern where each block manages its own internal state and exposes it via a registry pattern for settings access.

## Key Principles

1. **Component is the Source of Truth**: Each block component manages its own `content` and `styles` state internally
2. **Registry Pattern**: Components register state accessors, allowing settings to directly access/modify state
3. **Immediate Parent Sync**: Component state changes immediately sync to parent (no debounce)
4. **Debounced Persistence**: Parent debounces localStorage saves (300ms)
5. **Data-First Design**: All constants, options, and derived data computed before JSX
6. **Clean Structure**: Organized sections (Types → Constants → Utilities → Components)

## Architecture Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Block Component                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Internal State (content, styles)                   │  │
│  │  - Single source of truth                            │  │
│  │  - Managed via useState                              │  │
│  └──────────────────────────────────────────────────────┘  │
│                          │                                   │
│                          │ Registers                         │
│                          ▼                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Block State Registry                                 │  │
│  │  - Map<blockId, BlockStateAccessor>                  │  │
│  │  - Provides getContent, setContent, etc.             │  │
│  └──────────────────────────────────────────────────────┘  │
│                          │                                   │
│                          │ Immediate onChange                │
│                          ▼                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Parent (PageBuilder)                                 │  │
│  │  - Updates blocks state immediately                   │  │
│  │  - Debounces localStorage save (300ms)                  │  │
│  └──────────────────────────────────────────────────────┘  │
│                          │                                   │
│                          │ Direct Access                     │
│                          ▼                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Settings Component                                   │  │
│  │  - Looks up block in registry                        │  │
│  │  - Directly updates component state                   │  │
│  │  - No parent state updates needed                     │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Component Structure

### File Organization

Each block component file should follow this structure with clear section separators:

```typescript
// ============================================================================
// TYPES
// ============================================================================
// Type definitions for block-specific content

// ============================================================================
// CONSTANTS & DATA
// ============================================================================
// All constants, default values, options arrays, etc.

// ============================================================================
// UTILITIES
// ============================================================================
// Pure utility functions (className builders, data extractors, etc.)

// ============================================================================
// RENDERER
// ============================================================================
// Pure render function (no state, just props → JSX)

// ============================================================================
// MAIN COMPONENT
// ============================================================================
// Component with internal state management

// ============================================================================
// SETTINGS COMPONENT
// ============================================================================
// Settings UI that uses registry pattern

// ============================================================================
// LEGACY RENDERER (Backward Compatibility)
// ============================================================================
// Legacy renderer for non-component blocks

// ============================================================================
// BLOCK DEFINITION
// ============================================================================
// BlockDefinition export
```

## Component Pattern

### Main Component

The main component follows this pattern:

```typescript
export function MyBlockComponent({
  value,
  onChange,
}: BlockComponentProps) {
  // 1. Initialize state from props
  const [content, setContent] = useState<MyContent>(() => {
    return (value.content as MyContent) || DEFAULT_CONTENT;
  });
  const [styles, setStyles] = useState<React.CSSProperties | undefined>(
    () => value.styles
  );

  // 2. Sync with props only when block ID changes
  const lastSyncedBlockIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (lastSyncedBlockIdRef.current !== value.id) {
      lastSyncedBlockIdRef.current = value.id;
      const newContent = (value.content as MyContent) || DEFAULT_CONTENT;
      setContent(newContent);
      setStyles(value.styles);
    }
  }, [value.id, value.content, value.styles]);

  // 3. Register state accessors for settings
  useEffect(() => {
    const accessor: BlockStateAccessor = {
      getContent: () => content,
      getStyles: () => styles,
      setContent: setContent,
      setStyles: setStyles,
      getFullState: () => ({
        ...value,
        content: content as BlockContent,
        styles,
      }),
    };
    registerBlockState(value.id, accessor);
    return () => unregisterBlockState(value.id);
  }, [value.id, content, styles, value]);

  // 4. Immediate onChange to notify parent
  useEffect(() => {
    onChange({
      ...value,
      content: content as BlockContent,
      styles,
    });
  }, [content, styles, value, onChange]);

  // 5. Render
  return <MyRenderer content={content} styles={styles} />;
}
```

#### Key Points:

1. **State Initialization**: Initialize state from props using lazy initializers
2. **Block ID Sync**: Only sync from props when block ID changes (different block selected)
3. **Registry Registration**: Register state accessors on mount, unregister on unmount
4. **Immediate onChange**: Notify parent immediately (no debounce at component level)
5. **Pure Renderer**: Use a pure renderer function for rendering

### Settings Component

The settings component uses the registry pattern:

```typescript
function MyBlockSettings({ block, onUpdate }: SettingsProps) {
  // 1. Get state accessor from registry
  const accessor = getBlockStateAccessor(block.id);
  const [, setUpdateTrigger] = React.useState(0);

  // 2. Get current state (from registry or fallback)
  const content = accessor
    ? (accessor.getContent() as MyContent)
    : ((block.content as MyContent) || DEFAULT_CONTENT);

  // 3. Update handler
  const updateContent = (updates: Partial<MyContent>) => {
    if (accessor) {
      // Registry pattern: direct state update
      const current = accessor.getContent() as MyContent;
      accessor.setContent({ ...current, ...updates });
      setUpdateTrigger((prev) => prev + 1); // Trigger re-render
    } else if (onUpdate) {
      // Fallback: old pattern
      onUpdate({
        content: {
          ...block.content,
          ...updates,
        } as BlockContent,
      });
    }
  };

  // 4. Compute derived data
  const textValue = content?.kind === "text" ? content.value : "";
  const currentOption = content?.option || "default";

  // 5. Render settings UI
  return (
    <div className="space-y-4">
      {/* Settings UI using constants and derived data */}
    </div>
  );
}
```

#### Key Points:

1. **Registry Lookup**: Look up block in registry first
2. **Direct State Access**: Use accessor to get/update state directly
3. **Re-render Trigger**: Use `setUpdateTrigger` to force settings re-render
4. **Fallback Support**: Support old `onUpdate` pattern for backward compatibility
5. **Derived Data**: Compute all derived values before JSX

## Data-First Pattern

### Constants Section

All data should be defined at the top of the file:

```typescript
// All data defined at top
const DEFAULT_CONTENT: MyContent = {
  kind: "text",
  value: "",
  option: "default",
};

const OPTIONS = [
  { value: "option1" as const, label: "Option 1" },
  { value: "option2" as const, label: "Option 2" },
] as const;

const SETTINGS_SECTIONS = {
  content: { title: "Content", icon: Type, defaultOpen: true },
  settings: { title: "Settings", icon: Settings, defaultOpen: true },
} as const;
```

**Benefits:**
- Easy to find and modify
- Type-safe with `as const`
- Reusable across component and settings
- Clear separation of data from logic

### Utilities Section

Pure utility functions for data transformation:

```typescript
/**
 * Get text content from block content safely
 */
function getTextContent(content: MyContent): string {
  return content?.kind === "text" ? content.value : "";
}

/**
 * Build className string for block element
 */
function buildClassName(content: MyContent): string {
  const classes = ["wp-block-my"];
  if (content.option) {
    classes.push(`has-${content.option}`);
  }
  if (content.className) {
    classes.push(content.className);
  }
  return classes.filter(Boolean).join(" ");
}

/**
 * Get button className for option buttons
 */
function getOptionButtonClassName(isActive: boolean): string {
  const base = "h-9 px-3 text-sm font-semibold rounded-md transition-all";
  const active = "bg-gray-200 text-gray-800 hover:bg-gray-300";
  const inactive =
    "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300";
  return `${base} ${isActive ? active : inactive}`;
}
```

**Benefits:**
- Pure functions (no side effects)
- Testable in isolation
- Reusable across renderer and settings
- Clear, single-purpose functions

### Derived Data in Settings

Compute all derived values before JSX:

```typescript
// Compute all derived values before JSX
const textValue = content?.kind === "text" ? content.value : "";
const currentOption = content?.option || "default";
const isActive = currentOption === "option1";

// Then use in JSX
return (
  <div>
    <Input value={textValue} />
    <button className={isActive ? "active" : ""}>Option</button>
  </div>
);
```

**Benefits:**
- Clear data flow
- Easier to debug
- Better performance (computed once)
- Cleaner JSX

## State Management Rules

### Component State

- ✅ Component manages `content` and `styles` internally
- ✅ Component is the single source of truth
- ✅ Only sync from props on mount or block ID change
- ✅ Register state accessors on mount, unregister on unmount
- ✅ Notify parent immediately via `onChange` (no debounce)

### Parent State

- ✅ Parent tracks block structure (IDs, hierarchy, order)
- ✅ Parent receives immediate updates via `onChange`
- ✅ Parent debounces localStorage saves (300ms)
- ✅ Parent does NOT manage block content/styles

### Settings Access

- ✅ Settings look up block in registry
- ✅ Settings directly update component state
- ✅ Settings trigger re-render via `setUpdateTrigger`
- ✅ Fallback to old `onUpdate` pattern if no registry accessor

## Block State Registry

The registry pattern allows settings to directly access component state:

### Registry Interface

```typescript
export interface BlockStateAccessor {
  /** Get the current content state */
  getContent: () => any;
  /** Get the current styles state */
  getStyles: () => React.CSSProperties | undefined;
  /** Update the content state */
  setContent: (content: any) => void;
  /** Update the styles state */
  setStyles: (styles: React.CSSProperties | undefined) => void;
  /** Get the full block state (for saving) */
  getFullState: () => BlockConfig;
}
```

### Registry Functions

```typescript
// Register block state accessor
registerBlockState(blockId: string, accessor: BlockStateAccessor): void

// Unregister block state accessor
unregisterBlockState(blockId: string): void

// Get block state accessor
getBlockStateAccessor(blockId: string): BlockStateAccessor | undefined
```

### Usage

**In Component:**
```typescript
useEffect(() => {
  const accessor: BlockStateAccessor = {
    getContent: () => content,
    getStyles: () => styles,
    setContent: setContent,
    setStyles: setStyles,
    getFullState: () => ({ ...value, content, styles }),
  };
  registerBlockState(value.id, accessor);
  return () => unregisterBlockState(value.id);
}, [value.id, content, styles, value]);
```

**In Settings:**
```typescript
const accessor = getBlockStateAccessor(block.id);
if (accessor) {
  const content = accessor.getContent();
  accessor.setContent({ ...content, ...updates });
}
```

## Block Definition

Each block must export a `BlockDefinition`:

```typescript
export const MyBlock: BlockDefinition = {
  id: "core/myblock",
  label: "My Block",
  icon: MyIcon,
  description: "Description",
  category: "basic",
  defaultContent: {
    kind: "text",
    value: "Default value",
  },
  defaultStyles: {
    fontSize: "1rem",
  },
  // New component pattern (preferred)
  component: MyBlockComponent,
  // Legacy pattern (for backward compatibility)
  renderer: LegacyMyBlockRenderer,
  settings: MyBlockSettings,
  hasSettings: true,
};
```

### BlockDefinition Fields

- `id`: Canonical machine key (e.g., `"core/heading"`)
- `label`: User-facing display name (e.g., `"Heading"`)
- `icon`: React component or icon
- `description`: Block description
- `category`: Block category (`"basic" | "media" | "layout" | "advanced"`)
- `defaultContent`: Default content structure
- `defaultStyles`: Default styles object
- `component`: New component pattern (preferred)
- `renderer`: Legacy renderer pattern (for backward compatibility)
- `settings`: Settings component
- `hasSettings`: Whether block has settings UI
- `isContainer`: Whether block can contain children
- `handlesOwnChildren`: Whether renderer manages its own children

## Best Practices

### 1. Data First
- Define all constants, options, and defaults at the top
- Use `as const` for type-safe literal types
- Group related constants together

### 2. Pure Utilities
- Keep utility functions pure (no side effects)
- Single responsibility per function
- Document function purpose with JSDoc

### 3. Derived Data
- Compute derived values before JSX
- Use descriptive variable names
- Avoid inline calculations in JSX

### 4. Single Responsibility
- Each function/component does one thing
- Separate concerns (renderer, component, settings)
- Clear section boundaries

### 5. Type Safety
- Use TypeScript types for all data
- Use `as const` for literal types
- Define block-specific content types

### 6. Clean JSX
- Use constants and derived data in JSX
- Avoid inline logic
- Keep JSX readable and maintainable

### 7. Registry Pattern
- Always register/unregister state accessors
- Handle cleanup in useEffect return
- Support fallback for old pattern

### 8. Immediate Sync
- Component → Parent sync is immediate (no debounce)
- Parent debounces localStorage saves
- Settings update component state directly

### 9. Fallback Support
- Settings should work with both registry and old pattern
- Support legacy blocks during migration
- Graceful degradation

### 10. Code Organization
- Clear section separators
- Logical grouping of code
- Consistent structure across blocks

## Example Reference

See `client/src/components/PageBuilder/blocks/heading/HeadingBlock.tsx` for a complete reference implementation following all these patterns.

## Common Patterns

### Text Content Extraction

```typescript
function getTextContent(content: BlockContent): string {
  return content?.kind === "text" ? content.value : "";
}
```

### ClassName Building

```typescript
function buildClassName(content: MyContent, baseClass: string): string {
  const classes = [baseClass];
  if (content.option) classes.push(`has-${content.option}`);
  if (content.className) classes.push(content.className);
  return classes.filter(Boolean).join(" ");
}
```

### Option Button Styling

```typescript
function getOptionButtonClassName(isActive: boolean): string {
  const base = "h-9 px-3 text-sm font-semibold rounded-md transition-all";
  const active = "bg-gray-200 text-gray-800 hover:bg-gray-300";
  const inactive =
    "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300";
  return `${base} ${isActive ? active : inactive}`;
}
```

### Settings Update Handler

```typescript
const updateContent = (updates: Partial<MyContent>) => {
  if (accessor) {
    const current = accessor.getContent() as MyContent;
    accessor.setContent({ ...current, ...updates });
    setUpdateTrigger((prev) => prev + 1);
  } else if (onUpdate) {
    onUpdate({
      content: {
        ...block.content,
        ...updates,
      } as BlockContent,
    });
  }
};
```

## Troubleshooting

### Infinite Re-render Loops

**Problem**: Component re-renders infinitely

**Solution**: 
- Check `useEffect` dependencies
- Ensure `onChange` is not recreated on every render
- Verify block ID sync logic

### Stale State in Settings

**Problem**: Settings show old state

**Solution**:
- Ensure `setUpdateTrigger` is called after state update
- Verify registry accessor is registered
- Check that `getContent()` is called fresh on each render

### State Not Syncing to Parent

**Problem**: Changes don't propagate to parent

**Solution**:
- Verify `onChange` is called in useEffect
- Check that `content` and `styles` are in dependencies
- Ensure parent receives updates

### Settings Not Updating Component

**Problem**: Settings changes don't reflect in component

**Solution**:
- Verify registry accessor exists
- Check that `setContent`/`setStyles` are called
- Ensure `setUpdateTrigger` triggers re-render

## Summary

This architecture provides:

1. **Clear Separation**: Component manages state, parent manages structure
2. **Direct Access**: Settings access component state directly via registry
3. **Immediate Updates**: UI updates instantly, persistence is debounced
4. **Data-First**: All data defined upfront, computed before JSX
5. **Clean Structure**: Organized sections, pure functions, clear flow
6. **Type Safety**: Full TypeScript support with proper types
7. **Backward Compatible**: Supports legacy blocks during migration

Follow this architecture for all new blocks and when migrating existing blocks.

