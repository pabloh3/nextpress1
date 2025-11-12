# Intent: Migrate PageBuilder.scenarios.test.tsx to BlockContent union

File: client/src/test/PageBuilder.scenarios.test.tsx
Date: 2025-11-12

## Original Legacy Patterns
- Text blocks use `content: { text: string }`.
- Container blocks use `content: {}` (empty object) to indicate no content.
- Assertions access `block.content.text` directly for paragraphs/headings.
- getDefaultBlock mock returns objects with `content: { text: ... }` or `{}`.

## Target Union Shapes (from shared/schema-types.ts)
- Text blocks: `{ kind: 'text', value: string }`
- Container blocks: `{ kind: 'structured', data: {} }` (placeholder data object)
- Empty content explicit option: `{ kind: 'empty' }` (not needed here; prefer structured for containers).

## Migration Steps
1. Update getDefaultBlock mock: map types to appropriate union forms.
2. Replace all `content: { text: '...' }` with `content: { kind: 'text', value: '...' }`.
3. Replace all container `content: {}` with `content: { kind: 'structured', data: {} }`.
4. Adjust assertions: use `content.kind === 'text' ? content.value : ''` or direct `content.value` when known block is text.
5. Avoid narrowing issues: optional chaining + kind discriminator.
6. Remove explicit casts to BlockConfig that conflict; ensure arrays typed as BlockConfig[] after migration shapes.
7. Ensure creation/update code uses union shapes (e.g. update block content).
8. Leave unrelated logic untouched (drag/drop move operations remain the same).

## Potential Impacts
- All references to `.content.text` must change or tests will fail.
- Container content shape affects type compatibility across nested operations.

## Edge Cases
- Some assertions access possibly undefined children; keep optional chaining.
- Maintain block order tests unaffected by content shape change.

Proceeding with migration after this intent doc.
