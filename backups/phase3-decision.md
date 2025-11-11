# Phase 3 Complex Blocks Migration Decision

**Date**: 2025-11-11
**Decision Maker**: Assistant (autonomous)

## Analysis

Found 3 complex blocks to evaluate:
1. **ColumnsBlock** - Layout container
2. **GroupBlock** - Layout container  
3. **TableBlock** - Data structure

## Decision

### Container Blocks (Columns, Group)
**Keep current structure** - Do NOT migrate to discriminated union.

**Rationale**:
- These blocks use `content` for layout configuration (gap, alignment, direction, etc.)
- Their actual "content" is their `children` blocks
- Configuration options ≠ structured data content
- Current structure is semantically correct

**Example (ColumnsBlock)**:
```typescript
content: {
  gap: "20px",
  verticalAlignment: "top",
  horizontalAlignment: "left",
  direction: "row"
}
```

This is configuration, not data. Should stay as-is.

### Data Blocks (Table)
**Migrate to discriminated union** - `{ kind: 'structured', data: {...} }`

**Rationale**:
- TableBlock contains actual structured data (rows, cells, headers)
- The `body`, `head`, `foot` arrays represent the table's data content
- This is true structured content, not just configuration
- Fits the discriminated union pattern perfectly

**Migration**:
```typescript
// Before:
content: {
  body: TableRow[],
  head: TableRow[],
  foot: TableRow[],
  hasFixedLayout: boolean,
  caption: string,
  className: string
}

// After:
content: {
  kind: 'structured',
  data: {
    body: TableRow[],
    head: TableRow[],
    foot: TableRow[],
    hasFixedLayout: boolean,
    caption: string,
    className: string
  }
}
```

## Implementation

- ✅ Backups created for all 3 blocks
- ⏳ Migrate only TableBlock
- ✅ Skip Columns and Group blocks (correct as-is)
- ⏳ Update documentation

## Files to Modify

1. `client/src/components/PageBuilder/blocks/table/TableBlock.tsx` - Migrate to discriminated union
2. NO CHANGES to ColumnsBlock or GroupBlock

