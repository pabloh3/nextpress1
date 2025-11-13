# Intent: ColumnsBlock typing + legacy normalization

Purpose: Address TypeScript mismatch where `{ kind: 'structured', data: ColumnsData }` expects `data: Record<string, unknown>` but ColumnsData is narrower. Add legacy normalization so tests using `content: { text: '...' }` or legacy columns content shapes don't break while migrating.

Scope:
- Modify `client/src/components/PageBuilder/blocks/columns/ColumnsBlock.tsx` (<= ~25 LOC changes) to:
  - Make `ColumnsData` extend `Record<string, unknown>` or assert cast when returning.
  - Enhance `readColumnsData` to detect legacy plain object content with keys: `gap`, `direction`, `verticalAlignment`, `horizontalAlignment` directly on content (non-discriminated) and map them.
  - Keep current structured writing logic.
- Do NOT alter other blocks yet.
- Add temporary adapter in `client/src/test/setup.ts` to wrap legacy content objects for text blocks into `{ kind: 'text', value }` when they appear.

Risks / Impact:
- Low: Type-only + safe guards. Rendering unaffected.
- Test stability improved without rewriting all fixtures at once.

Fallback:
- If adapter approach causes confusion, revert by restoring backup file and migrate tests manually.

Original intent (from prior session): Migrate ColumnsBlock to union-based structured content and provide backward compatibility path.
