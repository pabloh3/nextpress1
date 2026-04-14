# Templates Enhancement Plan

## Overview

Enhance the NextPress template system with WordPress-inspired features: template variables, conditional display logic, categories/tags, import/export, and advanced filtering.

## Current State

The template system is **fully implemented** with:
- CRUD API (`server/routes/templates.routes.ts`)
- Management UI (`client/src/pages/Templates.tsx`)
- Create/edit modal (`client/src/components/Templates/TemplateModal.tsx`)
- DB schema with `templates` table (`shared/schema.ts:101-114`)
- Types: header, footer, page, post, popup
- Page builder integration via `templateId` foreign key on posts/pages
- Preview support

**Schema fields**: `id`, `name`, `type`, `description`, `authorId`, `blocks` (jsonb), `settings` (jsonb), `other` (jsonb), `createdAt`, `updatedAt`

---

## Enhancement 1: Template Variables (Shortcodes)

**Goal**: Allow templates to contain dynamic placeholders that resolve at render time.

### Concept

Templates can include variable tokens like `{{site.title}}`, `{{post.date}}`, `{{author.name}}` that get replaced with real data when the template is rendered.

### Variable Sources

| Namespace | Examples | Source |
|-----------|----------|--------|
| `site.*` | `site.title`, `site.url`, `site.description` | Site settings / config |
| `post.*` | `post.title`, `post.date`, `post.author`, `post.featured_image` | Current post data |
| `page.*` | `page.title`, `page.slug`, `page.url` | Current page data |
| `author.*` | `author.name`, `author.avatar`, `author.bio` | Author profile |
| `date.*` | `date.now`, `date.year`, `date.month` | Current date/time |
| `custom.*` | `custom.cta_text`, `custom.footer_note` | User-defined in template settings |

### Implementation Plan

#### 1.1 Variable Registry (`server/templates/variable-registry.ts`)

- Define variable namespace types and resolver functions
- Each namespace has a `resolve(context) => Record<string, string>` function
- Registry maps `{{namespace.field}}` to the correct resolver

#### 1.2 Variable Parser (`server/templates/variable-parser.ts`)

- Parse template blocks content for `{{namespace.field}}` patterns
- Support nested access: `{{post.meta.custom_field}}`
- Support fallback syntax: `{{post.title | "Untitled"}}`
- Return list of variables found in a template

#### 1.3 Render-time Resolution (`server/templates/template-renderer.ts`)

- Takes template blocks + render context (post, page, user, site config)
- Resolves all variables in block content before rendering
- Integrates with the existing renderer pipeline

#### 1.4 UI: Variable Insertion in TemplateModal

- Add a variable picker dropdown in the template editor
- User can browse available variables by namespace
- Clicking inserts `{{namespace.field}}` at cursor position
- Show variable descriptions/tooltips

#### 1.5 Schema Changes

- No schema changes needed — variables live inside `blocks` jsonb content strings
- `settings` jsonb can store `custom.*` variable defaults

### Files to Create/Modify

| File | Action |
|------|--------|
| `server/templates/variable-registry.ts` | **New** — namespace definitions and resolvers |
| `server/templates/variable-parser.ts` | **New** — parse and extract variables from content |
| `server/templates/template-renderer.ts` | **New** — resolve variables at render time |
| `client/src/components/Templates/TemplateModal.tsx` | **Modify** — add variable picker UI |
| `client/src/components/Templates/VariablePicker.tsx` | **New** — variable browser/insertion component |

---

## Enhancement 2: Conditional Display Logic

**Goal**: Allow templates (or blocks within templates) to show/hide based on conditions, similar to WordPress conditional tags.

### Concept

Templates can have display rules like "show this header only on single posts" or "show this popup only on the homepage". Blocks within templates can also have individual conditions.

### Condition Types

| Condition | Example | Description |
|-----------|---------|-------------|
| `is_home` | Show on homepage | Matches front page |
| `is_single` | Show on single posts | Matches individual post pages |
| `is_page` | Show on pages | Matches page type |
| `is_archive` | Show on archives | Matches archive/listing pages |
| `is_404` | Show on 404 page | Matches not found page |
| `is_logged_in` | Show for logged-in users | User authentication check |
| `is_logged_out` | Show for logged-out users | Guest visitors |
| `post_in_category` | Show if post has category X | Category membership |
| `post_has_tag` | Show if post has tag X | Tag membership |
| `page_slug` | Show on specific page slug | Exact slug match |
| `url_contains` | Show if URL contains path | Partial URL match |
| `user_role` | Show for specific roles | Role-based visibility |
| `device_type` | Show on mobile/desktop | Device detection |
| `date_range` | Show during date range | Time-based visibility |

### Condition Structure

```typescript
interface DisplayCondition {
  type: string;           // e.g., 'is_home', 'is_single', 'post_in_category'
  operator: 'is' | 'is_not';
  value?: string;         // e.g., category slug, page slug, role name
  logic?: 'and' | 'or';  // how this condition combines with others
}
```

### Implementation Plan

#### 2.1 Condition Evaluator (`server/templates/condition-evaluator.ts`)

- Takes a list of `DisplayCondition` + render context
- Evaluates each condition against the current request context
- Supports AND/OR logic chaining
- Returns boolean: should this template/block be rendered?

#### 2.2 Context Builder (`server/templates/render-context.ts`)

- Builds the evaluation context from the current request:
  - Current route/page type
  - Current user (if authenticated)
  - Current post/page data
  - URL, device info, date/time
- Passed to both variable resolver and condition evaluator

#### 2.3 Template-level Conditions

- Stored in `templates.settings.displayConditions` (jsonb array)
- Controls whether the entire template is applied
- Example: header template with `[{ type: 'is_single', operator: 'is' }]` only shows on single posts

#### 2.4 Block-level Conditions

- Stored in block's `settings.displayConditions` (jsonb array)
- Controls whether individual blocks within a template render
- Example: a CTA block that only shows on blog posts, not pages

#### 2.5 UI: Condition Builder in TemplateModal

- Add a "Display Rules" section in template settings
- Visual condition builder: dropdown for type, toggle for is/is_not, value input
- Support adding multiple conditions with AND/OR logic
- Preview indicator showing where this template will appear

#### 2.6 Schema Changes

- No schema changes needed — conditions stored in existing `settings` jsonb
- Template settings: `settings.displayConditions`
- Block settings: `block.settings.displayConditions`

### Files to Create/Modify

| File | Action |
|------|--------|
| `server/templates/condition-evaluator.ts` | **New** — evaluate display conditions |
| `server/templates/render-context.ts` | **New** — build render context from request |
| `server/templates/template-renderer.ts` | **Modify** — integrate condition checking |
| `client/src/components/Templates/ConditionBuilder.tsx` | **New** — visual condition builder |
| `client/src/components/Templates/TemplateModal.tsx` | **Modify** — add display rules section |
| `client/src/components/PageBuilder/blocks/BlockSettings.tsx` | **Modify** — add per-block conditions |

---

## Enhancement 3: Template Categories & Tags

**Goal**: Organize templates beyond just type classification.

### Implementation Plan

#### 3.1 Schema Changes (requires approval)

- Add `category` column to `templates` table (varchar, nullable)
- Add `tags` column to `templates` table (jsonb, default `[]`)
- Or: use `other` jsonb field to store `category` and `tags` without schema migration

#### 3.2 API Changes

- Add `category` and `tags` filters to `GET /api/templates`
- Add `category` and `tags` to create/update endpoints

#### 3.3 UI Changes

- Add category dropdown and tag input in TemplateModal
- Add category/tag filter chips on Templates page
- Group templates by category in the list view

### Files to Modify

| File | Action |
|------|--------|
| `shared/schema.ts` | **Modify** — add category/tags columns (or use `other`) |
| `server/routes/templates.routes.ts` | **Modify** — add filter params |
| `client/src/pages/Templates.tsx` | **Modify** — add filter UI |
| `client/src/components/Templates/TemplateModal.tsx` | **Modify** — add category/tags inputs |

---

## Enhancement 4: Import/Export

**Goal**: Allow templates to be exported as JSON and imported into other instances.

### Implementation Plan

#### 4.1 Export Endpoint

- `GET /api/templates/:id/export` — returns template as downloadable JSON
- `GET /api/templates/export` — bulk export (selected or all templates)

#### 4.2 Import Endpoint

- `POST /api/templates/import` — accepts JSON file, creates template(s)
- Validates structure, handles name conflicts (rename or overwrite option)

#### 4.3 UI

- Export button on template list and detail views
- Import button with file upload on Templates page
- Preview imported template before confirming

### Files to Create/Modify

| File | Action |
|------|--------|
| `server/routes/templates.routes.ts` | **Modify** — add export/import endpoints |
| `client/src/components/Templates/ImportExport.tsx` | **New** — import/export UI components |
| `client/src/pages/Templates.tsx` | **Modify** — add import/export buttons |

---

## Enhancement 5: Advanced Filtering

**Goal**: Rich filtering and search for the templates list.

### Implementation Plan

#### 5.1 API Enhancements

- Add `search` param (searches name + description)
- Add `category` filter
- Add `tags` filter (match any/all)
- Add `sort_by` param (name, created_at, updated_at, type)
- Add `sort_order` param (asc, desc)

#### 5.2 UI Enhancements

- Search input with debounced query
- Filter bar: type chips, category dropdown, tag selector
- Sort dropdown
- Saved filter presets (optional)

### Files to Modify

| File | Action |
|------|--------|
| `server/routes/templates.routes.ts` | **Modify** — add search/sort/filter params |
| `client/src/pages/Templates.tsx` | **Modify** — add filter bar UI |
| `client/src/components/Templates/TemplateFilters.tsx` | **New** — filter bar component |

---

## Implementation Order

| Phase | Enhancement | Priority | Dependencies |
|-------|-------------|----------|--------------|
| 1 | Template Variables | **High** | None — core feature, enables dynamic content |
| 2 | Conditional Display Logic | **High** | None — core feature, enables context-aware templates |
| 3 | Advanced Filtering | **Medium** | Enhancement 3 (categories/tags) for full value |
| 4 | Categories & Tags | **Medium** | None — but more useful with filtering |
| 5 | Import/Export | **Low** | None — standalone feature |

### Recommended Discussion Order

1. **Template Variables** — how variables work, syntax, UI for insertion
2. **Conditional Display Logic** — condition types, UI for building rules, evaluation flow

---

## UX Decisions (Confirmed)

### Variable Picker
- **Approach**: Dropdown Insert (Option A)
- Button/toolbar above content area in template editor
- Click → dropdown grouped by namespace (Site, Post, Author, etc.)
- Select → inserts `{{namespace.field}}` at cursor position
- **Syntax**: `{{namespace.field}}` with fallback `{{namespace.field | "default"}}`

### Condition Builder — Template-level
- **Location**: New "Display Rules" tab in TemplateModal (Option A)
- Visual builder with condition rows

### Condition Builder — Block-level
- **Location**: New "Conditions" tab in block settings panel (Option A)
- Same visual builder as template-level

### Condition Builder UI
- Each row: condition type dropdown, operator (is/is_not), optional value input, delete button
- Between rows: AND/OR toggle
- "Add Condition" button at bottom
- Supports both template-level and block-level conditions
