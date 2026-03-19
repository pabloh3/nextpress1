# Remove Unused Legacy Renderer Pattern

## Goal
Remove the unused `renderer` pattern from PageBuilder blocks - it's dead code that was replaced by the `component` pattern.

## Background
- `BlockDefinition` has two rendering patterns: `component` (new, preferred) and `renderer` (legacy)
- `BlockRenderer.tsx` always prefers `component` first
- If `component` exists, `renderer` is never used
- All 35+ blocks now have `component`, making `renderer` completely dead code
- There's also a secondary task to unify the block architecture (see separate plan)

## Scope
- 35 block files (remove `renderer` property + `LegacyXxxRenderer` function)
- 1 type definition file (remove `renderer` from interface)
- 1 test file (update to use component)
- 1 BlockRenderer.tsx (remove fallback)

## Files to Modify

### Type Definition
- `client/src/components/PageBuilder/blocks/types.ts`
  - Remove `renderer?: (props: { block: BlockConfig; isPreview: boolean }) => JSX.Element;` (line 34)

### BlockRenderer.tsx
- `client/src/components/PageBuilder/BlockRenderer.tsx`
  - Remove lines 211-215 (fallback to renderer)

### Block Files (35 total)

**Basic (7)**
- `client/src/components/PageBuilder/blocks/heading/HeadingBlock.tsx`
- `client/src/components/PageBuilder/blocks/text/TextBlock.tsx`
- `client/src/components/PageBuilder/blocks/button/ButtonBlock.tsx`
- `client/src/components/PageBuilder/blocks/buttons/ButtonsBlock.tsx`
- `client/src/components/PageBuilder/blocks/spacer/SpacerBlock.tsx`
- `client/src/components/PageBuilder/blocks/separator/SeparatorBlock.tsx`
- `client/src/components/PageBuilder/blocks/divider/DividerBlock.tsx`

**Media (8)**
- `client/src/components/PageBuilder/blocks/image/ImageBlock.tsx`
- `client/src/components/PageBuilder/blocks/video/VideoBlock.tsx`
- `client/src/components/PageBuilder/blocks/audio/AudioBlock.tsx`
- `client/src/components/PageBuilder/blocks/gallery/GalleryBlock.tsx`
- `client/src/components/PageBuilder/blocks/cover/CoverBlock.tsx`
- `client/src/components/PageBuilder/blocks/file/FileBlock.tsx`
- `client/src/components/PageBuilder/blocks/media-text/MediaTextBlock.tsx`

**Layout (2)**
- `client/src/components/PageBuilder/blocks/columns/ColumnsBlock.tsx`
- `client/src/components/PageBuilder/blocks/group/GroupBlock.tsx`

**Advanced (8)**
- `client/src/components/PageBuilder/blocks/quote/QuoteBlock.tsx`
- `client/src/components/PageBuilder/blocks/list/ListBlock.tsx`
- `client/src/components/PageBuilder/blocks/code/CodeBlock.tsx`
- `client/src/components/PageBuilder/blocks/html/HtmlBlock.tsx`
- `client/src/components/PageBuilder/blocks/pullquote/PullquoteBlock.tsx`
- `client/src/components/PageBuilder/blocks/preformatted/PreformattedBlock.tsx`
- `client/src/components/PageBuilder/blocks/table/TableBlock.tsx`
- `client/src/components/PageBuilder/blocks/markdown/MarkdownBlock.tsx`

**Post (11)**
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

### Test Files
- `client/src/test/HeadingBlock.test.tsx`
  - Update tests to use `component` pattern instead of `renderer`

## Changes Per Block File
For each block file, make 2 changes:
1. Remove the `renderer: LegacyXxxRenderer,` line from the block definition
2. Remove the entire `function LegacyXxxRenderer(...)` function definition

## Example: HeadingBlock.tsx
**Before:**
```typescript
function LegacyHeadingRenderer({
  block,
}: {
  block: BlockConfig;
  isPreview: boolean;
}) {
  return (
    <HeadingRenderer
      content={(block.content as HeadingContent) || DEFAULT_CONTENT}
      styles={block.styles}
    />
  );
}

export const HeadingBlock: BlockDefinition = {
  // ...other properties
  component: HeadingBlockComponent,
  renderer: LegacyHeadingRenderer,  // REMOVE THIS LINE
  settings: LegacyHeadingSettings,
};
```

**After:**
```typescript
export const HeadingBlock: BlockDefinition = {
  // ...other properties
  component: HeadingBlockComponent,
  settings: LegacyHeadingSettings,
};
```

## Verification
After changes:
1. Run `pnpm lint` to check for errors
2. Run `pnpm typecheck` (if available) to verify types
3. Run tests: `pnpm test` (or `vitest`)
4. Verify PageBuilder still works in browser

## Notes
- The `settings` property in BlockDefinition IS still used (sidebar settings panels) - do NOT remove it
- This cleanup removes ~700+ lines of dead code across 35 files
- After this, a follow-up plan will unify the block architecture (preview/canvas/settings co-location)
