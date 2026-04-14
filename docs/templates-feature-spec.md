# Templates Feature — Specification & QA Report

**Date**: 2026-04-14
**Status**: Phase 1, 2 & 3 Complete (Variables, Conditions, Page Builder Integration)
**Author**: Solutions Architect

---

## 1. Feature Overview

The Templates feature enables creation, management, and rendering of reusable page/post layouts. This spec covers three phases:

- **Template Variables** — dynamic `{{namespace.field}}` placeholders resolved at render time
- **Conditional Display Logic** — show/hide templates and blocks based on context rules
- **Page Builder Integration** — edit templates in the builder, insert templates into pages/posts

---

## 2. What Is Implemented

### 2.1 Template Variables (Backend)

| Component | File | LOC | Description |
|-----------|------|-----|-------------|
| Types | `server/templates/types.ts` | 94 | `RenderContext`, `VariableNamespace`, `VariableDefinition`, `DisplayCondition`, `ConditionTypeDefinition` |
| Registry | `server/templates/variable-registry.ts` | 153 | 5 namespaces with 24 total variables, each with resolver function |
| Parser | `server/templates/variable-parser.ts` | 89 | Regex-based `{{ns.field}}` parser with fallback support `{{ns.field \| "default"}}` |
| Renderer | `server/templates/template-renderer.ts` | 147 | Resolves variables in block content, filters blocks by conditions, handles nested children |
| Barrel | `server/templates/index.ts` | 43 | Public API exports |

**Variable Namespaces Implemented**:

| Namespace | Variables | Count |
|-----------|-----------|-------|
| `site` | title, url, description, language | 4 |
| `post` | title, slug, date, modified_date, excerpt, author, url, featured_image | 8 |
| `page` | title, slug, url | 3 |
| `author` | name, avatar, bio, url | 4 |
| `date` | now, year, month, day, time | 5 |
| **Total** | | **24** |

**Parser Capabilities**:
- Extracts `{{namespace.field}}` patterns from strings
- Supports fallback syntax: `{{post.title | "Untitled"}}`
- `extractVariables()` — returns parsed variable references with positions
- `resolveVariables()` — replaces variables with resolved values
- `hasVariables()` — boolean check for variable presence
- `getReferencedVariables()` — returns unique variable keys in content

### 2.2 Conditional Display Logic (Backend)

| Component | File | LOC | Description |
|-----------|------|-----|-------------|
| Evaluator | `server/templates/condition-evaluator.ts` | 229 | 13 condition types with AND/OR logic chaining |
| Context Builder | `server/templates/render-context.ts` | 104 | Builds `RenderContext` from Express request (user, device, URL) |

**Condition Types Implemented**:

| Type | Has Value | Description |
|------|-----------|-------------|
| `is_home` | No | Matches homepage (`/` or empty path) |
| `is_single` | No | Matches individual post pages |
| `is_page` | No | Matches page type content |
| `is_archive` | No | Matches archive/listing pages |
| `is_404` | No | Matches not-found pages |
| `is_logged_in` | No | Authenticated users |
| `is_logged_out` | No | Guest visitors |
| `post_in_category` | Yes (text) | Post belongs to specific category |
| `post_has_tag` | Yes (text) | Post has specific tag |
| `page_slug` | Yes (text) | Matches specific page/post slug |
| `url_contains` | Yes (text) | URL contains path segment |
| `user_role` | Yes (text) | User has specific role |
| `device_type` | Yes (select) | Mobile, Desktop, or Tablet |

**Evaluation Logic**:
- Single condition: `evaluateCondition(condition, context) → boolean`
- Multiple conditions: `evaluateConditions(conditions, context) → boolean`
- AND/OR chaining via `condition.logic` field
- Unknown condition types default to `true` (show content)
- Empty condition arrays default to `true`

**Render Context Sources**:
- `site` — passed via options (site settings)
- `post` — passed via options (current post data)
- `page` — passed via options (current page data)
- `author` — passed via options (author profile)
- `user` — extracted from `req.user` (auth middleware)
- `request` — `req.originalUrl`, `req.path`, User-Agent device detection

### 2.3 Template Variables (Frontend)

| Component | File | LOC | Description |
|-----------|------|-----|-------------|
| VariablePicker | `client/src/components/Templates/VariablePicker.tsx` | 200 | Popover with tabbed namespace browser, click-to-insert, copy-to-clipboard |

**VariablePicker Features**:
- Popover trigger button with `{ }` icon
- 5 tabs: Site, Post, Page, Author, Date
- Each variable shows: label, description, example, `{{ns.field}}` badge
- Click inserts variable tag into template description
- Copy button on hover (clipboard API)
- Toast notification on insert
- ScrollArea for long variable lists

**VariablePicker Locations**:
- TemplateModal description field — inserts at end of description
- BlockSettings Content tab — copies to clipboard for pasting into any block text field

### 2.4 Conditional Display Logic (Frontend)

| Component | File | LOC | Description |
|-----------|------|-----|-------------|
| ConditionBuilder | `client/src/components/Templates/ConditionBuilder.tsx` | 320 | Visual condition builder with rows, AND/OR toggle, value inputs |

**ConditionBuilder Features**:
- Empty state: "No display rules set" message + Add button
- Each row: condition type dropdown, operator toggle (is/is_not), optional value input, delete button
- AND/OR toggle between rows (click to switch)
- Value input adapts: text input for text types, select dropdown for device_type
- First condition has no logic toggle (it's the base)
- Removing a condition fixes the logic on the remaining first item
- nanoid for unique condition IDs

**ConditionBuilder Locations**:
- TemplateModal Display Rules tab — template-level conditions
- BlockSettings Conditions tab — block-level conditions

### 2.5 TemplateModal (Updated)

| Tab | Content |
|-----|---------|
| **General** | Name, Type (select), Description (textarea + VariablePicker button) |
| **Display Rules** | ConditionBuilder for template-level conditions |

**Changes from original**:
- Added Tabs component (General / Display Rules)
- Added VariablePicker next to Description label
- Added ConditionBuilder in Display Rules tab
- Display conditions stored in `template.settings.displayConditions`
- Mutation sends `settings` field with conditions
- Key-based reset syncs conditions when switching templates

### 2.6 BlockSettings (Updated)

| Change | Details |
|--------|---------|
| Content tab | Added VariablePicker button (copies `{{ns.field}}` to clipboard) |
| New "Conditions" tab | 4th tab added (Content, Style, Advanced, Conditions) |
| Grid layout | Changed from `grid-cols-3` to `grid-cols-4` |
| ConditionBuilder | Reused component, stores in `block.settings.displayConditions` |
| State | `displayConditions` derived from `block.settings`, `updateDisplayConditions` calls `updateSettings` |

### 2.7 PageBuilderEditor — Template Type Support

**`PageBuilderEditor.tsx`** extended to support `type: 'template'`:

| Feature | Implementation |
|---------|----------------|
| Content type | `EditorContentType = 'page' \| 'post' \| 'template'` |
| API base | `/api/templates` for template type |
| Data adapter | `adaptTemplateToEditorData()` — maps `name` → `title`, adds safe defaults |
| Save payload | `{ name, blocks }` sent to `PUT /api/templates/:id` |
| Draft storage | Skipped for templates (saves directly to server) |
| UI label | "Editing Template:" in top bar |
| Back button | Navigates to `/templates` |
| Error state | "Template not found or failed to load" |
| PublishDialog | Hidden for templates (no publish flow) |

### 2.8 Template Insertion in Page/Post Editing

**`TemplateLibrary.tsx`** (new) — Collapsible section in block library sidebar:

| Feature | Implementation |
|---------|----------------|
| Data source | Fetches from `GET /api/templates?per_page=50` (lazy, only when opened) |
| UI | Collapsible with template name, type badge, block count |
| Insertion | Click appends all template blocks to end of canvas |
| ID generation | New IDs generated for all inserted blocks to avoid conflicts |
| Empty state | "No templates available. Create one first." |
| Disabled state | Templates with 0 blocks are disabled |

**Wiring**:
- `BuilderSidebar.tsx` — receives `onInsertTemplate` prop, renders TemplateLibrary below BlockLibrary
- `PageBuilder.tsx` — `handleInsertTemplate` callback re-IDs blocks and calls `commitBlocks`

### 2.9 Templates Page — Edit in Builder

**`Templates.tsx`** — Added Layout icon button that navigates to `/page-builder/template/:id`

### 2.10 App Route Fix

**`App.tsx`** — Template route now passes `type="template"` instead of `type="page"`

### 2.11 Shared Types (Updated)

Added to `shared/schema-types.ts`:
- `VariableDefinition` — `{ key, label, description, example? }`
- `VariableNamespaceUI` — `{ name, label, description, variables[] }`
- `DisplayCondition` — `{ id, type, operator, value?, logic? }`
- `ConditionTypeDefinitionUI` — `{ type, label, description, hasValue, valueType?, valueOptions? }`

### 2.12 Barrel File

`client/src/components/Templates/index.ts` exports:
- `TemplateModal`
- `VariablePicker`
- `ConditionBuilder`

---

## 3. What Is Pending

### 3.1 Integration with Render Pipeline

| Item | Status | Notes |
|------|--------|-------|
| Wire `renderTemplateBlocks()` into server routes | **Pending** | Function exists but not called from any route handler |
| Wire `shouldRenderTemplate()` into template selection | **Pending** | Template-level conditions not checked during page rendering |
| Wire `buildRenderContext()` into route handlers | **Pending** | Context builder exists but not integrated with Express routes |
| End-to-end variable resolution in rendered pages | **Pending** | Variables resolve in the renderer but the renderer isn't connected to live routes |

### 3.2 Block-Level Conditions in Visual Editor

| Item | Status | Notes |
|------|--------|-------|
| Visual indicator for conditional blocks | **Pending** | No visual cue in the canvas that a block has display conditions |
| Condition preview (show which context will show/hide) | **Pending** | No way to preview condition evaluation in the editor |

### 3.3 Enhancements 3-5 (From Plan)

| Enhancement | Status | Notes |
|-------------|--------|-------|
| Categories & Tags | **Not started** | Planned in `docs/templates-enhancement-plan.md` |
| Import/Export | **Not started** | Planned in `docs/templates-enhancement-plan.md` |
| Advanced Filtering | **Not started** | Planned in `docs/templates-enhancement-plan.md` |

---

## 4. QA Verification

### 4.1 TypeScript Compilation

```
Command: npx tsc --noEmit
Result: 16 errors total
Errors from this feature: 0
Pre-existing errors: 16 (Register.tsx, Users.tsx, Themes.tsx, HeadingBlock, menubar, etc.)
```

**Verdict**: PASS — zero new TypeScript errors introduced.

### 4.2 Test Suite

```
Command: pnpm test:run
Result: 424 passed, 0 failed
Failures from this feature: 0
```

**Verdict**: PASS — all tests pass, zero failures.

### 4.3 File Inventory

**New files created (10)**:

| # | File | Verified |
|---|------|----------|
| 1 | `server/templates/types.ts` | Exists, 94 lines |
| 2 | `server/templates/variable-registry.ts` | Exists, 153 lines |
| 3 | `server/templates/variable-parser.ts` | Exists, 89 lines |
| 4 | `server/templates/condition-evaluator.ts` | Exists, 229 lines |
| 5 | `server/templates/render-context.ts` | Exists, 104 lines |
| 6 | `server/templates/template-renderer.ts` | Exists, 147 lines |
| 7 | `server/templates/index.ts` | Exists, 43 lines |
| 8 | `client/src/components/Templates/VariablePicker.tsx` | Exists, 200 lines |
| 9 | `client/src/components/Templates/ConditionBuilder.tsx` | Exists, 320 lines |
| 10 | `client/src/components/PageBuilder/TemplateLibrary.tsx` | Exists, ~120 lines |

**Modified files (7)**:

| # | File | Changes |
|---|------|---------|
| 1 | `shared/schema-types.ts` | Added 4 interfaces (VariableDefinition, VariableNamespaceUI, DisplayCondition, ConditionTypeDefinitionUI) |
| 2 | `client/src/components/Templates/TemplateModal.tsx` | Added tabs, VariablePicker, ConditionBuilder, display conditions state |
| 3 | `client/src/components/Templates/index.ts` | Added exports for VariablePicker, ConditionBuilder |
| 4 | `client/src/components/PageBuilder/BlockSettings.tsx` | Added VariablePicker in Content tab, Conditions tab, ConditionBuilder |
| 5 | `client/src/pages/PageBuilderEditor.tsx` | Added template type support (adapter, save, draft, UI labels) |
| 6 | `client/src/App.tsx` | Fixed template route to pass `type="template"` |
| 7 | `client/src/pages/Templates.tsx` | Added Edit in Builder button with Layout icon |
| 8 | `client/src/components/PageBuilder/BuilderSidebar.tsx` | Added TemplateLibrary, onInsertTemplate prop |
| 9 | `client/src/components/PageBuilder/PageBuilder.tsx` | Added handleInsertTemplate callback |

### 4.4 Code Quality Checks

| Check | Status |
|-------|--------|
| Follows `verbNoun` naming | PASS — `extractVariables`, `resolveVariables`, `evaluateConditions`, `buildRenderContext`, `renderTemplateBlocks`, `shouldRenderTemplate`, `handleInsertTemplate`, `adaptTemplateToEditorData` |
| JSDoc on public APIs | PASS — all exported functions have JSDoc with `@param` and `@returns` |
| No classes/OOP | PASS — all functions and interfaces |
| Functional composition | PASS — small focused functions, single responsibility |
| Early returns | PASS — guard clauses in evaluator, parser, renderer |
| Error handling graceful | PASS — unknown condition types default to `true`, missing variables return original placeholder |
| Max 400 LOC/file | PASS — largest file is 320 lines (ConditionBuilder.tsx) |
| No `useEffect` directly | PASS — frontend uses derived state pattern, no useEffect |
| Uses existing UI components | PASS — shadcn Popover, Tabs, Select, Button, Badge, ScrollArea, Input, Label, Collapsible |
| Uses nanoid for IDs | PASS — condition IDs generated with nanoid |
| Barrel file | PASS — `index.ts` exports all public components |

### 4.5 Architecture Verification

| Principle | Verification |
|-----------|-------------|
| Separation of concerns | Backend (registry, parser, evaluator, renderer) is independent of frontend. Frontend components are pure presentational with callbacks. |
| Shared types | `DisplayCondition` type used by both backend (`server/templates/types.ts`) and frontend (`shared/schema-types.ts`) — consistent shape |
| Reusability | `ConditionBuilder` used in TemplateModal + BlockSettings. `VariablePicker` used in TemplateModal + BlockSettings. `TemplateLibrary` used in BuilderSidebar. |
| No schema migration | Conditions stored in existing `settings` jsonb column — no DB changes required |
| Dependency injection | Backend functions accept context as parameter, no hard imports to request/user |
| ID safety | Template insertion generates new IDs for all blocks to prevent conflicts |

---

## 5. API Surface

### 5.1 Backend Public API (`server/templates/index.ts`)

```typescript
// Types
export type { VariableDefinition, VariableNamespace, RenderContext, DisplayCondition, ConditionTypeDefinition }
export type { TemplateBlock, RenderResult }

// Variables
export function getVariableNamespaces(): VariableNamespace[]
export function getNamespace(name: string): VariableNamespace | undefined
export function resolveAllVariables(context: RenderContext): Record<string, string>
export function extractVariables(content: string): ParsedVariable[]
export function resolveVariables(content: string, variables: Record<string, string>): string
export function hasVariables(content: string): boolean
export function getReferencedVariables(content: string): string[]

// Conditions
export function getConditionTypes(): ConditionTypeDefinition[]
export function getConditionType(type: string): ConditionTypeDefinition | undefined
export function evaluateCondition(condition: DisplayCondition, context: RenderContext): boolean
export function evaluateConditions(conditions: DisplayCondition[], context: RenderContext): boolean

// Rendering
export function buildRenderContext(req: Request, options?: BuildContextOptions): RenderContext
export function renderTemplateBlocks(blocks: TemplateBlock[], context: RenderContext): RenderResult
export function shouldRenderTemplate(settings: object | null, context: RenderContext): boolean
```

### 5.2 Frontend Public API (`client/src/components/Templates/index.ts`)

```typescript
export { TemplateModal } from "./TemplateModal"
export { VariablePicker } from "./VariablePicker"
export { ConditionBuilder } from "./ConditionBuilder"
```

### 5.3 Routes

| Route | Type | Description |
|-------|------|-------------|
| `/templates` | Page | Template management list |
| `/page-builder/template/:id` | Page | Edit template in page builder |

---

## 6. Data Flow

### 6.1 Variable Resolution Flow

```
Template blocks (with {{post.title}} etc.)
  → renderTemplateBlocks(blocks, context)
    → resolveAllVariables(context)     // Build variable map from context
    → For each block:
      → Check displayConditions        // Filter by conditions first
      → resolveContentVariables()      // Replace {{ns.field}} in content strings
      → Recurse into children
  → Return RenderResult { blocks, variablesResolved, conditionsEvaluated, blocksFiltered }
```

### 6.2 Condition Evaluation Flow

```
DisplayCondition[] from template/block settings
  → evaluateConditions(conditions, context)
    → For each condition:
      → getConditionType(condition.type)  // Look up evaluator function
      → def.evaluate(context, operator, value)
      → Combine with previous result using AND/OR logic
  → Return boolean (show/hide)
```

### 6.3 Template Insertion Flow

```
User clicks template in TemplateLibrary
  → onInsertTemplate(templateBlocks)
    → reIdBlocks(blocks)              // Generate new IDs for all blocks
    → commitBlocks(prev => [...prev, ...newBlocks])
    → PageBuilder updates canvas
```

### 6.4 Template Save Flow

```
User clicks Save in page builder (template type)
  → handlePageBuilderSave()
    → apiRequest('PUT', `/api/templates/${id}`, { name, blocks })
    → Invalidate query cache
    → handleSave() shows success toast
```

### 6.5 Storage Format

Template-level conditions stored in `templates.settings`:
```json
{
  "displayConditions": [
    { "id": "abc123", "type": "is_single", "operator": "is", "logic": undefined },
    { "id": "def456", "type": "post_in_category", "operator": "is", "value": "tech", "logic": "and" }
  ]
}
```

Block-level conditions stored in `block.settings.displayConditions` — same shape.

---

## 7. Pending Verification Items

These items cannot be verified until the render pipeline integration is complete:

- [ ] Variables resolve correctly in live rendered pages
- [ ] Template-level conditions prevent template from rendering
- [ ] Block-level conditions hide blocks in rendered output
- [ ] Device detection works across real browsers
- [ ] User role detection works with auth middleware
- [ ] Performance impact of variable resolution on page load
- [ ] Edge cases: nested variables, circular references, malformed syntax
