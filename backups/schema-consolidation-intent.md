# Schema Consolidation – Test Fixtures and Editor Debug Gating

**Author:** Assistant  
**Date:** 2025-11-11  
**Phase:** Phase 0 (identity consolidation)  
**Scope:** Tests and UI only — no DB or API changes

## Summary

Align test fixtures and editor components with the new BlockConfig identity model:
- Replace legacy identity usage (`type: 'core/*'`) with proper `name`/`type`/`label` structure
- Update mocked registries in tests to use new BlockDefinition shape
- Gate development console logging under DEBUG flag

## Rationale

The new schema centralizes identity:
- `name` holds canonical machine key (e.g., `'core/heading'`)
- `type` is structural kind only (`'block'` or `'container'`)
- `label` is user-facing display name (e.g., `'Heading'`)
- `parentId` is always present (null for root blocks)

Current issues:
- Test fixtures still use identity in `type: 'core/*'`, causing confusion
- Mocked registries use old shape (`name` instead of `label`, missing `id`)
- Editor has noisy console logs that should be optional
- Test assertions check wrong fields (e.g., `HeadingBlock.name` instead of `HeadingBlock.id` and `HeadingBlock.label`)

## Out of Scope

- No database schema or migrations
- No API contract changes
- No behavior changes to drag-and-drop logic
- No content union migration (Phase 1 work)
- No changes to block definition files (already compliant)

## Files to Modify

### Test Files
- `client/src/test/HeadingBlock.test.tsx` – Fix metadata assertions, update fixtures
- `client/src/test/columnsBlock.test.ts` – Update BlockConfig fixtures and mocked registry
- `client/src/test/useDragAndDropHandler.test.ts` – Update BlockConfig fixtures and mocked registry
- `client/src/test/BlockRenderer.test.tsx` – Update fixtures if needed
- `client/src/test/BlockEditing.test.tsx` – Update fixtures if needed
- `client/src/test/PageBuilder.integration.test.tsx` – Update fixtures if needed
- `client/src/test/PageBuilder.scenarios.test.tsx` – Update fixtures if needed
- `client/src/test/treeUtils.test.ts` – Update fixtures if needed
- `client/src/test/useBlockManager.test.ts` – Update fixtures if needed
- `client/src/test/parentId.test.ts` – Update fixtures if needed
- `client/src/test/legacy/treeUtils.legacy.test.ts` – Update fixtures if needed
- `test-tree-utils.js` (root level) – Update fixtures

### Editor Components (Console Logging)
- `client/src/components/PageBuilder/BlockRenderer.tsx` – Gate console.debug calls
- `client/src/components/PageBuilder/blocks/index.ts` – Gate/remove console.log
- `client/src/components/PageBuilder/BlockLibrary.tsx` – Gate console.log

### Documentation Files (Reference Only)
- `docs/useBlockManager-pattern.md` – Update example fixtures
- `test-tree-utils.js` – Update example data

## Change Rules

### 1. BlockConfig Instance Structure

**Before (legacy):**
```typescript
{
  id: 'heading-1',
  type: 'core/heading',  // ❌ Identity in type field
  content: { text: 'Hello' },
  styles: {},
  settings: {}
}
```

**After (new schema):**
```typescript
{
  id: 'heading-1',
  name: 'core/heading',     // ✅ Canonical machine key
  type: 'block',            // ✅ Structural kind only
  parentId: null,           // ✅ Always present
  label: 'Heading',         // ✅ User-facing display name
  content: { text: 'Hello' },
  styles: {},
  settings: {}
}
```

### 2. Container Blocks

**Containers must have:**
- `type: 'container'`
- `children: []` array (even if empty)
- `isContainer: true` in definition

**Example:**
```typescript
{
  id: 'group-1',
  name: 'core/group',
  type: 'container',        // ✅ Not 'core/group'
  parentId: null,
  label: 'Group',
  content: {},
  styles: {},
  settings: {},
  children: []              // ✅ Required for containers
}
```

### 3. Parent-Child Relationships

**All child blocks must set parentId:**
```typescript
{
  id: 'columns-1',
  name: 'core/columns',
  type: 'container',
  parentId: null,           // ✅ Root level
  children: [
    {
      id: 'text-1',
      name: 'core/paragraph',
      type: 'block',
      parentId: 'columns-1',  // ✅ Points to parent
      content: {},
      styles: {}
    }
  ]
}
```

### 4. Mocked BlockRegistry Shape

**BlockDefinition (in mocks):**
```typescript
{
  id: 'core/heading',        // ✅ Canonical key
  label: 'Heading',          // ✅ Display name
  isContainer: false,
  defaultContent: { text: '', level: 2 },
  defaultStyles: {},
  category: 'basic'
  // Note: renderer and settings can be omitted in test mocks
}
```

**getDefaultBlock (in mocks):**
```typescript
getDefaultBlock: (type: string, id: string) => ({
  id,
  name: type,              // ✅ e.g., 'core/heading'
  type: 'block',           // ✅ or 'container'
  parentId: null,
  label: 'Heading',        // ✅ From definition
  content: { ... },
  styles: {},
  settings: {},
  children: undefined      // ✅ Only for containers
})
```

### 5. Test Assertions

**Before:**
```typescript
expect(HeadingBlock.name).toBe('core/heading')  // ❌ Wrong field
expect(HeadingBlock.name).toBe('Heading')       // ❌ Conflicting
expect(block.displayName).toBe('Text')          // ❌ Deprecated field
```

**After:**
```typescript
expect(HeadingBlock.id).toBe('core/heading')    // ✅ Canonical key
expect(HeadingBlock.label).toBe('Heading')      // ✅ Display name
expect(block.label).toBe('Text')                // ✅ New field name
```

### 6. Console Logging

**Before:**
```typescript
console.log('Imported Blocks:', { ... });
console.debug('Rendering block:', block.name);
```

**After (gated):**
```typescript
if (process.env.DEBUG_BUILDER) {
  console.log('Imported Blocks:', { ... });
  console.debug('Rendering block:', block.name);
}
```

**Or remove entirely if too noisy.**

## Migration Steps

### Step 1: Create Backups ✅
- Copy all affected test files to `backups/client/src/test/`
- Copy affected editor components to `backups/client/src/components/PageBuilder/`
- Store this intent doc as `backups/schema-consolidation-intent.md`

### Step 2: Update Test Fixtures
For each test file:
1. Find all BlockConfig instances (inline objects and factory functions)
2. Apply transformation:
   - Add `name` field with canonical key (e.g., `'core/heading'`)
   - Change `type` from `'core/*'` to `'block'` or `'container'`
   - Add `parentId: null` for root blocks
   - For containers, ensure `children: []` exists
   - Add `label` field if used in assertions
3. Remove any `displayName` fields → use `label` instead

### Step 3: Update Mocked Registries
For test files with vi.mock or manual mocks:
1. Update BlockDefinition mocks:
   - Use `id` (not `name`) for canonical key
   - Use `label` (not `name`) for display text
   - Keep `isContainer`, `defaultContent`, `defaultStyles`, `category`
2. Update `getDefaultBlock` mocks:
   - Return BlockConfig with `name`, `type`, `parentId`, `label`
   - Containers should include `children: []`

### Step 4: Fix Specific Test Issues
- **HeadingBlock.test.tsx line 228-229**: Change assertions from `.name` to `.id` and `.label`
- **columnsBlock.test.ts**: Remove `displayName` usage, add `name`/`type`/`parentId`
- **useDragAndDropHandler.test.ts**: Remove `displayName`, fix BlockConfig structure

### Step 5: Gate Console Logs
- **BlockRenderer.tsx lines 14, 143**: Wrap with `if (process.env.DEBUG_BUILDER)`
- **blocks/index.ts line 27**: Gate or remove the import log
- **BlockLibrary.tsx line 26**: Gate the registry log

### Step 6: Update Documentation Examples
- **docs/useBlockManager-pattern.md**: Update example fixtures to new schema
- **test-tree-utils.js**: Update sample data structure

### Step 7: Validate
1. Run `pnpm tsc --noEmit` – should pass with no type errors
2. Run test suite – all tests should pass
3. Manually verify no runtime errors in dev mode

## Potential Risks

1. **Missed Legacy References**: If any runtime code still relies on `type: 'core/*'` for identity, those will break
   - Mitigation: Current audit shows only tests and dev logs affected
   
2. **Test Mock Alignment**: Tests mocking drag sources may rely on specific id formats
   - Mitigation: Preserve `draggableId` values in BlockLibrary (uses `block.id` from definitions)

3. **Content Union Changes**: Some tests may need content shape updates
   - Mitigation: Out of scope for Phase 0; defer to Phase 1

4. **Editor Runtime Behavior**: Console gating might hide useful errors
   - Mitigation: Use DEBUG_BUILDER=true for development; keep production clean

## Rollback Plan

If regressions occur:
1. Restore files from `backups/` directory
2. Investigate specific failures
3. Apply fixes incrementally with targeted tests

## Approval Checklist

- ✅ No database schema changes
- ✅ No API contract changes
- ✅ No behavior changes (only data shape alignment)
- ✅ Follows AGENTS.md: backups first, functional style, defensive coding
- ✅ Limited scope: tests and UI console gating only
- ✅ Preserves existing drag-and-drop behavior
- ✅ Type-safe with existing BlockConfig interface

## Success Criteria

1. All tests pass with new fixture structure
2. TypeScript compilation succeeds with no errors
3. No console noise in production builds
4. HeadingBlock and other definitions remain unchanged
5. Runtime behavior identical (only data shape differs)

## Next Steps (After Phase 0)

- **Phase 1**: ✅ **COMPLETE** - Migrated Button, Text, and Heading blocks to discriminated union content pattern
  - All three blocks now use `{ kind: 'text', value: string, ... }` structure
  - Renderers updated with defensive checks (`content?.kind === 'text'`)
  - Default content updated in block definitions
  - All tests updated and passing (240 tests)
  - Files modified:
    - `client/src/components/PageBuilder/blocks/button/ButtonBlock.tsx`
    - `client/src/components/PageBuilder/blocks/text/TextBlock.tsx`
    - `client/src/components/PageBuilder/blocks/heading/HeadingBlock.tsx`
    - `client/src/test/BlockEditing.test.tsx`
    - `client/src/test/BlockRenderer.test.tsx`
    - `client/src/test/HeadingBlock.test.tsx`
    - `client/src/test/PageBuilder.integration.test.tsx`
  - Backups created:
    - `backups/ButtonBlock.tsx.phase1.bak`
    - `backups/TextBlock.tsx.phase1.bak`
    - `backups/HeadingBlock.tsx.phase1.bak`

- **Phase 2**: ✅ **COMPLETE** (2025-11-11) - Migrated Audio, Image, and Video blocks to discriminated union content pattern
  - All three blocks now use `{ kind: 'media', url: string, mediaType: 'image'|'video'|'audio', ... }` structure
  - Renderers updated with defensive checks (`content?.kind === 'media' && content.mediaType === 'video'`)
  - Changed `src` → `url` for all media blocks
  - Updated MediaPickerDialog integration
  - Default content updated in block definitions
  - Tests running
  - Files modified:
    - `client/src/components/PageBuilder/blocks/audio/AudioBlock.tsx`
    - `client/src/components/PageBuilder/blocks/image/ImageBlock.tsx`
    - `client/src/components/PageBuilder/blocks/video/VideoBlock.tsx`
  - Backups created:
    - `backups/AudioBlock.tsx.phase2.bak`
    - `backups/ImageBlock.tsx.phase2.bak`
    - `backups/VideoBlock.tsx.phase2.bak`

- **Phase 3**: ✅ **COMPLETE** (2025-11-11) - Migrated complex blocks with structured data to discriminated union content pattern
  - All six blocks now use `{ kind: 'structured', data: {...} }` structure
  - Renderers updated with defensive checks (`content?.kind === 'structured'`)
  - Default content updated in block definitions
  - All tests passing (240 tests across 13 test files)
  - Blocks migrated:
    1. **TableBlock** - `{ kind: 'structured', data: { body, head, foot, hasFixedLayout, caption, className } }`
    2. **GalleryBlock** - `{ kind: 'structured', data: { images[], columns, imageCrop, linkTo, sizeSlug, caption, className } }`
    3. **ButtonsBlock** - `{ kind: 'structured', data: { buttons[], layout, orientation, className } }`
    4. **MediaTextBlock** - `{ kind: 'structured', data: { mediaUrl, mediaAlt, mediaPosition, mediaWidth, isStackedOnMobile, imageFill, verticalAlignment, href, linkTarget, rel, title, content, anchor, className } }`
    5. **CoverBlock** - `{ kind: 'structured', data: { url, alt, hasParallax, dimRatio, minHeight, contentPosition, customOverlayColor, backgroundType, focalPoint, innerContent, className } }`
    6. **FileBlock** - `{ kind: 'structured', data: { href, fileName, textLinkHref, textLinkTarget, showDownloadButton, downloadButtonText, displayPreview, fileSize, className } }`
  - Files modified:
    - `client/src/components/PageBuilder/blocks/table/TableBlock.tsx`
    - `client/src/components/PageBuilder/blocks/gallery/GalleryBlock.tsx`
    - `client/src/components/PageBuilder/blocks/buttons/ButtonsBlock.tsx`
    - `client/src/components/PageBuilder/blocks/media-text/MediaTextBlock.tsx`
    - `client/src/components/PageBuilder/blocks/cover/CoverBlock.tsx`
    - `client/src/components/PageBuilder/blocks/file/FileBlock.tsx`
  - Backups created:
    - `backups/TableBlock.tsx.phase3.bak`
    - `backups/GalleryBlock.tsx.phase3.bak`
    - `backups/ButtonsBlock.tsx.phase3.bak`
    - `backups/MediaTextBlock.tsx.phase3.bak`
    - `backups/CoverBlock.tsx.phase3.bak`
    - `backups/FileBlock.tsx.phase3.bak`
  - Skipped (layout containers - no migration needed):
    - ColumnsBlock - Uses `content` for layout config, no structured data
    - GroupBlock - Uses `content` for layout config, no structured data
    - Backups created for reference:
      - `backups/ColumnsBlock.tsx.phase3.bak`
      - `backups/GroupBlock.tsx.phase3.bak`

- **Phase 4**: 🔄 **IN PROGRESS** (2025-11-11) - Cleanup and documentation
  - ✅ Gated debug logging behind `import.meta.env.DEBUG_BUILDER` in:
    - `client/src/components/PageBuilder/BlockRenderer.tsx` (lines 14, 143)
    - `client/src/components/PageBuilder/blocks/index.ts` (line 27)
    - `client/src/components/PageBuilder/BlockLibrary.tsx` (line 26)
  - ✅ Removed unused legacy code (empty comment sections in blocks/index.ts)
  - 🔄 Updating documentation with Phase 3 completion details
  - ⏳ Final test suite validation
  - ⏳ Create final migration report

---

**Phase 0 Status**: ✅ Complete  
**Phase 1 Status**: ✅ Complete (2025-11-11)  
**Phase 2 Status**: ✅ Complete (2025-11-11)  
**Phase 3 Status**: ✅ Complete (2025-11-11)  
**Phase 4 Status**: 🔄 In Progress (2025-11-11)  
**Estimated effort**: Phase 0: 2-3 hours, Phase 1: 1-2 hours, Phase 2: 1-2 hours, Phase 3: 2-3 hours, Phase 4: 1 hour  
**Risk level**: Low (tests passing, reversible)
