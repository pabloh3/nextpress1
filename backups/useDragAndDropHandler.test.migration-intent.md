# Migration Intent: useDragAndDropHandler.test.ts

Date: 2025-11-12

## Original State
- Uses legacy block content shape: `content: { text: string }` for text blocks and `content: {}` for containers.
- Mocks `blockRegistry` and `getDefaultBlock` returning legacy content objects.
- No reliance on normalization shim aside from test setup doing runtime coercion.

## Goal
Migrate all block content to the new discriminated union `BlockContent` forms:
- Text blocks: `{ kind: 'text', value: string }`
- Containers / non-text structural: `{ kind: 'structured', data: {} }` (empty object when no specific data needed)

## Scope of Changes
1. Update `blockRegistry` mock `defaultContent` values.
2. Update `getDefaultBlock` mock to return union-shaped `content`.
3. Change `createMockBlock` helper to produce correct union shapes based on type.
4. Replace all inline block fixtures using `{ text: ... }` with `{ kind: 'text', value: ... }`.
5. Keep assertions focused on structural drag-drop behavior (content updates not asserted directly except integrity checks).
6. Ensure container children creation uses structured content.

## Rationale
- Aligns tests with production schema (`shared/schema-types.ts`) removing need for legacy normalization and allowing future removal of shim in `client/src/test/setup.ts`.
- Prevents tests from masking discrepancies by implicit conversion.

## Risk & Mitigation
- Potential break if handler logic still expects `.text`. Mitigated by scanning handler code (already uses `block.content` generically) and BlockRenderer using union shape in other tests.

## Post-Migration Follow-Up
- After all affected tests migrated, remove normalization utility from test setup and run full suite.
