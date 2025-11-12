# Intent: Phase 2 Migration of PageBuilder.scenarios.test.tsx

## Previous State
File had partial migration to new BlockContent union. Remaining legacy patterns:
- `content: {}` for containers
- `content: { text: '...' }` for paragraph/heading blocks
- Assertions accessing `block.content.text`
- Update simulation setting legacy content shape
- Missing helper for consistent text extraction

## Goals
1. Replace all container `content: {}` with `{ kind: 'structured', data: {} }`.
2. Replace all legacy text content objects with `{ kind: 'text', value: '..." }`.
3. Add a `getText` helper to standardize retrieval and gracefully fallback for any lingering legacy shapes.
4. Update all assertions using `.content.text` to leverage `getText`.
5. Ensure test fully reflects union content model for headings, paragraphs, groups, columns.

## Scope
Only `client/src/test/PageBuilder.scenarios.test.tsx`. No behavioral logic changes beyond content shape adaptation. No modifications to handlers or hooks.

## Risks & Mitigations
- Risk: Missed legacy pattern causing type mismatches -> Mitigated by helper fallback and comprehensive replacement.
- Risk: Introduced typo in content union fields -> Verified consistent `kind` and value/data fields.

## Post-Change Actions
- Run test suite (or targeted file) to confirm no TypeScript errors.
- Proceed to migrate remaining tests (BlockRenderer, columnsBlock, BlockEditing, integration, treeUtils, parentId) with similar pattern.

## Notes
Legacy fallback in `getText` is temporary; can be removed once all tests are migrated.
