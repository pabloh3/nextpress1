# Intent: Remove Unused Legacy Renderer Pattern

## Purpose
Remove the unused `renderer` pattern from PageBuilder blocks - it's dead code that was replaced by the `component` pattern.

## Scope of Changes

### Files Modified

#### Type Definition
- `client/src/components/PageBuilder/blocks/types.ts`
  - Removed `renderer?: (props: { block: BlockConfig; isPreview: boolean }) => JSX.Element;` from `BlockDefinition` interface
  - Updated `settings` return type to use `React.JSX.Element` instead of `JSX.Element`

#### BlockRenderer Component
- `client/src/components/PageBuilder/BlockRenderer.tsx`
  - Removed lines 211-215 (legacy renderer fallback logic)

#### Block Files (35 total)
All 35 block files had the following changes:
1. Removed `renderer: LegacyXxxRenderer,` line from block definition export
2. Removed entire `function LegacyXxxRenderer(...)` function definition

**Basic (7 files):**
- `client/src/components/PageBuilder/blocks/heading/HeadingBlock.tsx`
- `client/src/components/PageBuilder/blocks/text/TextBlock.tsx`
- `client/src/components/PageBuilder/blocks/button/ButtonBlock.tsx`
- `client/src/components/PageBuilder/blocks/buttons/ButtonsBlock.tsx`
- `client/src/components/PageBuilder/blocks/spacer/SpacerBlock.tsx`
- `client/src/components/PageBuilder/blocks/separator/SeparatorBlock.tsx`
- `client/src/components/PageBuilder/blocks/divider/DividerBlock.tsx`

**Media (8 files):**
- `client/src/components/PageBuilder/blocks/image/ImageBlock.tsx`
- `client/src/components/PageBuilder/blocks/video/VideoBlock.tsx`
- `client/src/components/PageBuilder/blocks/audio/AudioBlock.tsx`
- `client/src/components/PageBuilder/blocks/gallery/GalleryBlock.tsx`
- `client/src/components/PageBuilder/blocks/cover/CoverBlock.tsx`
- `client/src/components/PageBuilder/blocks/file/FileBlock.tsx`
- `client/src/components/PageBuilder/blocks/media-text/MediaTextBlock.tsx`

**Layout (2 files):**
- `client/src/components/PageBuilder/blocks/columns/ColumnsBlock.tsx`
- `client/src/components/PageBuilder/blocks/group/GroupBlock.tsx`

**Advanced (8 files):**
- `client/src/components/PageBuilder/blocks/quote/QuoteBlock.tsx`
- `client/src/components/PageBuilder/blocks/list/ListBlock.tsx`
- `client/src/components/PageBuilder/blocks/code/CodeBlock.tsx`
- `client/src/components/PageBuilder/blocks/html/HtmlBlock.tsx`
- `client/src/components/PageBuilder/blocks/pullquote/PullquoteBlock.tsx`
- `client/src/components/PageBuilder/blocks/preformatted/PreformattedBlock.tsx`
- `client/src/components/PageBuilder/blocks/table/TableBlock.tsx`
- `client/src/components/PageBuilder/blocks/markdown/MarkdownBlock.tsx`

**Post (11 files):**
- `client/src/components/PageBuilder/blocks/post-title/PostTitleBlock.tsx`
- `client/src/components/PageBuilder/blocks/post-excerpt/PostExcerptBlock.tsx`
- `client/src/components/PageBuilder/blocks/post-featured-image/PostFeaturedImageBlock.tsx`
- `client/src/components/PageBuilder/blocks/post-list/PostListBlock.tsx`
- `client/src/components/PageBuilder/blocks/post-toc/PostTocBlock.tsx`
- `client/src/components/PageBuilder/blocks/post-author-box/PostAuthorBoxBlock.tsx`
- `client/src/components/PageBuilder/blocks/post-comments/PostCommentsBlock.tsx`
- `client/src/components/PageBuilder/blocks/post-navigation/PostNavigationBlock.tsx`
- `client/src/components/PageBuilder/blocks/post-info/PostInfoBlock.tsx`
- `client/src/components/PageBuilder/blocks/post-progress/PostProgressBlock.tsx`
- `client/src/components/PageBuilder/blocks/post-new/PostNewBlock.tsx`

#### Test File
- `client/src/test/HeadingBlock.test.tsx`
  - Updated tests to use `component` pattern instead of `renderer`
  - Changed from testing `HeadingBlock.renderer!` directly to testing `HeadingBlock.component`
  - Updated mock setup for `useBlockState` hook

### Backup
- All modified files backed up to `/home/kizz/CODE/nextpress/backup/PageBuilder/` directory
- Test files backed up to `/home/kizz/CODE/nextpress/backup/test/` directory

## Verification

### Tests Passing
- ✅ `client/src/test/HeadingBlock.test.tsx` - All 16 tests pass
- ✅ `client/src/test/columnsBlock.test.ts` - All 12 tests pass
- ✅ `client/src/test/PageBuilder.scenarios.test.tsx` - All 8 tests pass
- ✅ `client/src/test/DesignMenu.test.tsx` - All 16 tests pass
- ✅ `client/src/test/BlogMenu.test.tsx` - All 13 tests pass
- ✅ `client/src/test/SiteMenu.test.tsx` - All 6 tests pass

### Known Issues
- TypeScript errors in `renderer/` directory (pre-existing, unrelated to PageBuilder changes)
- Database-related test failures in `server/test/specialized-models.test.ts` (pre-existing, unrelated to PageBuilder changes)

## Impact
- Removed ~700+ lines of dead code across 35+ files
- Simplified block architecture by removing unused legacy pattern
- No functional changes - all blocks continue to work using the `component` pattern
- Tests updated to reflect new pattern

## Notes
- The `settings` property in `BlockDefinition` IS still used (sidebar settings panels) - was NOT removed
- All blocks now exclusively use the `component` pattern
- Follow-up plan will unify the block architecture (preview/canvas/settings co-location)