# Test Union Content Migration Phase 3 Intent

Purpose: Continue migrating remaining test files to use the BlockContent union shape, replacing legacy plain object or string content for containers and blocks.

Scope:
- Update `PageBuilder.integration.test.tsx` container blocks to use `{ kind: 'structured', data: { ... } }` instead of `{ tagName: 'div' }`.
- Update `parentId.test.ts` helper `makeBlock` and inline test block definitions to use union content:
  - Containers: `{ kind: 'structured', data: {} }`
  - Blocks: `{ kind: 'text', value: '' }`
- Leave `BlockEditing.test.tsx` SpacerBlock content as-is for now since SpacerBlock implementation appears to expect a non-union `{ height: number }`. Will review after other migrations.
- No behavior changes to assertions; only structural content shape migration.

Rationale:
- Align tests with evolving schema `BlockContent` union for consistency and reduce reliance on runtime normalization shim in `setup.ts`.
- Incremental approach avoids breaking components still expecting legacy content shapes (e.g., SpacerBlock) until their implementation is updated.

Risks:
- If runtime code for containers still expects `content.tagName` directly without union, tests may fail; verify container components already migrated or that registry adapters handle union.
- `treeUtils` functions used in `parentId.test.ts` might not depend on content; safe change.

Follow-up:
- After successful migration and passing tests, progressively remove or narrow the normalization patch in `setup.ts`.
- Evaluate SpacerBlock for union migration; create separate intent doc if required.

Rollback:
- Backups stored in `/backups/*.phase3.bak` to restore original test files if needed.
