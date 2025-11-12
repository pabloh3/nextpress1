Title: ColumnsBlock structured content alignment

Intent
- Align ColumnsBlock content with shared BlockContent union by using kind: 'structured' and nesting settings under content.data.
- Maintain backward compatibility at runtime by reading legacy shape (plain object) if encountered.
- Update defaultContent to structured and adjust settings editor update to write structured content consistently.

Scope
- Modify client/src/components/PageBuilder/blocks/columns/ColumnsBlock.tsx only.
- No API or DB changes. No other blocks affected directly.

Rationale
- Current ColumnsBlock overrides BlockConfig.content with a plain object, conflicting with shared/schema-types BlockContent union and causing TS/type mismatches across tests/build.
- Using structured content keeps containers consistent and avoids future breakage.

Risks
- Potential rendering regressions if other code expects legacy content shape. We mitigate by reading both shapes.

Out of scope
- Refactoring other blocks to structured, drag handler changes already done.

Validation
- Type-checking should improve.
- Manual: Create a Columns block, adjust settings, drag blocks into columns.
