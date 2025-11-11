# Phase 1 Implementation Plan: Simple Text Blocks

**Status**: In Progress
**Goal**: Migrate Button, Text, and Heading blocks to use discriminated union content pattern
**Scope**: 3 blocks (Button, Text/Paragraph, Heading)

## Strategy

### Content Model Target
All text-based blocks will use:
```typescript
{
  kind: 'text';
  value: string;
  // Optional block-specific properties
}
```

### Migration Approach

#### 1. ButtonBlock
**Current structure:**
```typescript
{
  text: 'Click Me',
  url: '#',
  linkTarget: '_self',
  rel: '',
  title: '',
  className: '',
}
```

**New structure:**
```typescript
{
  kind: 'text';
  value: 'Click Me';      // Renamed from 'text'
  url?: string;
  linkTarget?: '_self' | '_blank';
  rel?: string;
  title?: string;
  className?: string;
}
```

**Changes needed:**
- `defaultContent`: Change `text` → `value`, add `kind: 'text'`
- Renderer: Change `block.content?.text` → `block.content?.kind === 'text' ? block.content.value : ''`
- Settings: Update `text` field to `value`

#### 2. TextBlock (Paragraph)
**Current structure:**
```typescript
{
  content?: string;
  text?: string;
  align?: 'left' | 'center' | 'right' | 'justify';
  anchor?: string;
  className?: string;
  dropCap?: boolean;
}
```

**New structure:**
```typescript
{
  kind: 'text';
  value: string;          // Replaces 'content' and 'text'
  textAlign?: 'left' | 'center' | 'right' | 'justify';  // Renamed from 'align'
  dropCap?: boolean;
  anchor?: string;
  className?: string;
}
```

**Changes needed:**
- `defaultContent`: Change `content` → `value`, add `kind: 'text'`, rename `align` → `textAlign`
- Renderer: Change `block.content?.content ?? block.content?.text` → `block.content?.kind === 'text' ? block.content.value : ''`
- Settings: Update field names

#### 3. HeadingBlock
**Current structure:**
```typescript
{
  content?: string;
  text?: string;
  level?: number;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  anchor?: string;
  className?: string;
}
```

**New structure:**
```typescript
{
  kind: 'text';
  value: string;          // Replaces 'content' and 'text'
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  anchor?: string;
  className?: string;
}
```

**Changes needed:**
- `defaultContent`: Change `content` → `value`, add `kind: 'text'`
- Renderer: Change `block.content?.content ?? block.content?.text` → `block.content?.kind === 'text' ? block.content.value : ''`
- Settings: Update field names

### Defensive Programming Pattern

All renderers will use this pattern:
```typescript
// Extract text content safely
const textContent = block.content?.kind === 'text' ? block.content.value : '';

// Use textContent in JSX
return <Tag>{textContent}</Tag>
```

### Backward Compatibility

**NOT NEEDED** - No legacy data exists, as confirmed in verification report.

## Implementation Order

1. ✅ Create backups of all 3 block files
2. Update ButtonBlock (simplest - only one text field)
3. Update TextBlock (moderate - alignment rename)
4. Update HeadingBlock (moderate - similar to Text)
5. Run test suite after each block update
6. Verify in PageBuilder UI

## Testing Strategy

### Unit Tests
- Each block should render correctly with new content structure
- Settings should update content correctly
- Defensive checks should handle undefined/null content

### Integration Tests
- PageBuilder should create blocks with new structure
- Block library should instantiate blocks correctly
- Drag & drop should preserve content structure

### Manual Testing Checklist
- [ ] Add Button block - text displays correctly
- [ ] Edit Button text - updates in real-time
- [ ] Add Text block - content displays correctly
- [ ] Edit Text content - updates in real-time
- [ ] Add Heading block - heading displays correctly
- [ ] Edit Heading text and level - updates correctly
- [ ] Save and reload page - content persists

## Rollback Plan

If issues arise:
1. All original files backed up in `/backups`
2. Can revert individual blocks if needed
3. Tests provide safety net for regressions

## Success Criteria

- [ ] All 3 blocks use `{ kind: 'text', value: string }`
- [ ] All renderers use defensive `content?.kind === 'text'` checks
- [ ] All default content updated with new structure
- [ ] All 240 tests still passing
- [ ] Manual testing checklist completed
- [ ] No TypeScript errors
- [ ] PageBuilder UI works correctly

## Files to Modify

1. `/client/src/components/PageBuilder/blocks/button/ButtonBlock.tsx`
2. `/client/src/components/PageBuilder/blocks/text/TextBlock.tsx`
3. `/client/src/components/PageBuilder/blocks/heading/HeadingBlock.tsx`

## Potential Issues & Solutions

### Issue: Tests may expect old structure
**Solution**: Update test fixtures to use new content structure

### Issue: Type errors in Settings components
**Solution**: Update Settings to use `value` instead of `text`/`content`

### Issue: Existing saved pages may have old structure
**Solution**: Not a concern - no legacy data exists (verified)

## Post-Implementation

1. Update `new-task.md` to mark Phase 1 complete
2. Document changes in verification report
3. Prepare for Phase 2 (Media blocks)
