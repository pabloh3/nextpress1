# useBlockManager Pattern Documentation

The `useBlockManager` hook is a centralized state management pattern used in NextPress for managing hierarchical block structures in the page builder. This pattern provides a consistent API for CRUD operations on nested block trees while maintaining immutability and performance.

## Architecture Overview

### Core Components

1. **`useBlockManager` Hook** - Main state management hook
2. **Tree Utilities (`treeUtils.ts`)** - Deep traversal and manipulation functions  
3. **Block Configurations** - Type-safe block definitions

### Key Design Principles

- **Immutability**: All operations return new objects rather than mutating existing state
- **Deep Tree Support**: Handles arbitrarily nested block structures including columns
- **Type Safety**: Full TypeScript support with `BlockConfig` interface
- **Performance**: Uses `useCallback` for memoization and efficient re-renders
- **Consistency**: Standardized return format for all operations

## API Reference

### Hook Signature

```typescript
export function useBlockManager(initialBlocks: BlockConfig[] = [])
```

### Returned Interface

```typescript
{
  blocks: BlockConfig[];                    // Current block tree state
  setBlocks: (blocks: BlockConfig[]) => void; // Direct state setter
  findBlockById: (blockId: string) => BlockConfig | null;
  updateBlock: (blockId: string, updates: Partial<BlockConfig>) => OperationResult;
  updateBlockContent: (blockId: string, contentUpdates: any) => OperationResult;
  updateBlockStyles: (blockId: string, styleUpdates: Record<string, any>) => OperationResult;
  duplicateBlock: (blockId: string, generateBlockId: () => string) => OperationResult;
  deleteBlock: (blockId: string) => OperationResult;
}
```

### Operation Result Format

All mutation operations return a consistent result object:

```typescript
interface OperationResult {
  status: boolean;        // Success/failure indicator
  data: any | null;      // Operation-specific return data
}
```

## Core Operations

### 1. Finding Blocks

```typescript
const { findBlockById } = useBlockManager(initialBlocks);

// Find any block in the tree by ID
const block = findBlockById('block-123');
```

**Features:**
- Searches through all nesting levels including column containers
- Returns `null` if block not found
- O(n) complexity with early termination

### 2. Updating Blocks

```typescript
const { updateBlock, updateBlockContent, updateBlockStyles } = useBlockManager();

// General block update
const result = updateBlock('block-123', {
  type: 'core/heading',
  content: { text: 'New heading' }
});

// Specialized content update
updateBlockContent('block-123', { text: 'Updated content' });

// Specialized styles update  
updateBlockStyles('block-123', { padding: '20px', color: 'blue' });
```

**Features:**
- Deep immutable updates preserving tree structure
- Partial updates - only specified properties are changed
- Automatic merging with existing block properties
- Type-safe with `Partial<BlockConfig>`

### 3. Duplicating Blocks

```typescript
const { duplicateBlock } = useBlockManager();

const result = duplicateBlock('block-123', () => crypto.randomUUID());

if (result.status) {
  console.log('New block ID:', result.data.newId);
}
```

**Features:**
- Deep cloning of entire block subtree
- Automatic ID regeneration for all nested blocks  
- Preserves all content, styles, and relationships
- Inserts duplicate immediately after original

### 4. Deleting Blocks

```typescript
const { deleteBlock } = useBlockManager();

const result = deleteBlock('block-123');
```

**Features:**
- Removes block and all nested children
- Maintains tree structure integrity
- Safe deletion with no dangling references

## Usage Patterns

### 1. Component Integration Pattern

```typescript
// In a block component
function HeadingBlock({ block }: { block: HeadingBlockConfig }) {
  const { updateBlockContent } = useBlockManager();
  
  const handleTextChange = (newText: string) => {
    updateBlockContent(block.id, { text: newText });
  };
  
  return <input value={block.content.text} onChange={e => handleTextChange(e.target.value)} />;
}
```

### 2. Page Builder Integration Pattern

```typescript
// In main PageBuilder component
function PageBuilder({ initialBlocks }: { initialBlocks: BlockConfig[] }) {
  const {
    blocks,
    updateBlock,
    duplicateBlock,
    deleteBlock,
    findBlockById,
  } = useBlockManager(initialBlocks);

  // Pass operations to child components via context
  return (
    <BlockActionsProvider value={{ updateBlock, duplicateBlock, deleteBlock }}>
      <BuilderCanvas blocks={blocks} />
    </BlockActionsProvider>
  );
}
```

### 3. Batch Operations Pattern

```typescript
const { setBlocks } = useBlockManager();

// For complex multi-block operations
const performBatchUpdate = (updates: Array<{id: string, changes: Partial<BlockConfig>}>) => {
  setBlocks(prevBlocks => {
    let result = prevBlocks;
    updates.forEach(({id, changes}) => {
      const { next } = updateBlockDeep(result, id, changes);
      result = next;
    });
    return result;
  });
};
```

## Advanced Features

### Column Block Support

The system has specialized support for column blocks (`core/columns`) with their unique structure:

```typescript
interface ColumnBlock {
  type: 'core/columns';
  content: {
    columns: Array<{
      id: string;
      children: BlockConfig[];  // Nested blocks within column
    }>;
  };
}
```

**Column-specific behaviors:**
- Search operations traverse column children
- Updates work within column containers  
- Drag & drop supports column-to-column moves
- Duplication preserves column structure

### Performance Optimizations

1. **Memoized Operations**: All returned functions use `useCallback`
2. **Structural Sharing**: Immutable updates reuse unchanged parts
3. **Early Termination**: Search operations stop at first match
4. **Shallow Comparison**: React can efficiently detect changes

### Type Safety Features

```typescript
// All operations are fully typed
const result: OperationResult = updateBlock(blockId, updates);

// Content updates accept any shape (block-specific)
updateBlockContent(blockId, { text: 'string', items: ['array'] });

// Style updates are constrained to CSS-like properties
updateBlockStyles(blockId, { padding: '10px', backgroundColor: '#fff' });
```

## Tree Utility Functions

The hook leverages these core tree operations:

- `findBlock()` - Locate block by ID in tree
- `updateBlockDeep()` - Immutably update block in tree  
- `deleteBlockDeep()` - Remove block from tree
- `duplicateBlockDeep()` - Clone block with new IDs
- `moveExistingBlock()` - Reposition blocks (via drag & drop hook)
- `insertNewBlock()` - Add new blocks at specific positions

## Testing Considerations

### Mocking in Tests

```typescript
// Mock useBlockManager for component tests
vi.mock('@/hooks/useBlockManager', () => ({
  useBlockManager: () => ({
    updateBlockContent: vi.fn(),
    updateBlockStyles: vi.fn(),
    deleteBlock: vi.fn(),
    // ... other methods
  })
}));
```

### Integration Testing

```typescript
// Test actual hook behavior
import { renderHook, act } from '@testing-library/react';
import { useBlockManager } from '@/hooks/useBlockManager';

test('should update block content', () => {
  const { result } = renderHook(() => useBlockManager([mockBlock]));
  
  act(() => {
    const operationResult = result.current.updateBlockContent('block-1', { text: 'new text' });
    expect(operationResult.status).toBe(true);
  });
  
  expect(result.current.blocks[0].content.text).toBe('new text');
});
```

## Error Handling

The hook implements graceful error handling:

- **Not Found**: Operations return `{ status: false, data: null }`
- **Invalid Updates**: Partial updates ignore invalid properties
- **Tree Corruption**: Operations maintain tree integrity
- **ID Conflicts**: Duplication generates unique IDs

## Migration Guide

When adding new block types:

1. **Define Block Interface**:
   ```typescript
   interface CustomBlockConfig extends BlockConfig {
     type: 'custom/my-block';
     content: {
       customProperty: string;
     };
   }
   ```

2. **Use Standard Pattern**:
   ```typescript
   function CustomBlock({ block }: { block: CustomBlockConfig }) {
     const { updateBlockContent } = useBlockManager();
     // ... implementation
   }
   ```

3. **Register with Block Registry**:
   ```typescript
   export const blockRegistry = {
     'custom/my-block': {
       component: CustomBlock,
       defaultContent: { customProperty: '' },
       // ...
     }
   };
   ```

## Best Practices

1. **Always use the hook**: Don't manipulate block state directly
2. **Leverage specialized methods**: Use `updateBlockContent` over `updateBlock` when appropriate  
3. **Check operation results**: Verify `status` before assuming success
4. **Preserve immutability**: Don't mutate returned block objects
5. **Use TypeScript**: Leverage full type safety for better DX
6. **Test block operations**: Write integration tests for complex block behaviors

The `useBlockManager` pattern provides a robust foundation for managing complex nested content structures while maintaining excellent developer experience and performance characteristics.