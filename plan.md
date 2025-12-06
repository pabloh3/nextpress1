# Page Builder Editor Enhancement Plan (Updated Nov 2025)

## Overview
This plan now reflects the new flow and requirements for page creation and editor access. The PageBuilder Editor will no longer support direct page creation or classic editor mode. Page creation is centralized in the Pages view, and navigation to the PageBuilder is only possible after a page is created.

---

## Requirements Summary (Updated)

### 1. Settings Tab Improvements
- **Page Settings by Default**: When no block is selected, the settings tab should show page settings by default.
- **Toggle Between Settings**: Button group to toggle between "Page Settings" and "Block Settings."
- **Page Title Editing**: Page title remains editable in the editor.

### 1a. Remove Contradictory Features
- Remove any mention of direct page creation in the PageBuilder Editor (no "New Page" button or popup/modal in editor).
- Remove any mention of classic editor mode (no tabs for switching between classic/builder, no classic editor UI).
- Remove any mention of direct PageBuilder link in sidebar (no sidebar navigation to PageBuilder Editor).
- Remove any plan to create or maintain CreatePageDialog in the PageBuilderEditor context (dialog only in Pages view).

### 2. Page Creation Flow (Major Update)
- **Page Creation Modal Scope**: Only handles page creation, not posts. No post fields or logic.
- **Modal Fields**: Only include page properties from schema: title, slug, featuredImage, allowComments, password, parentId, menuOrder, templateId. Status is always 'draft' and blocks are empty on creation.
- **Backend Sync**: On submit, page is created in backend and user is redirected to PageBuilder for that page.

### 3. Editor Access Flow (Updated)
- **Open Editor**: After creation, user is redirected to PageBuilder for the new page.
- **Block Editing**: PageBuilder loads blocks from page. Edits are saved to local storage until "Save" is clicked. On save, changes are synced to backend.

### 4. Undo/Redo Functionality
- **Editor Supports Undo/Redo**: Implement undo/redo for block editing using version history in block config.
- **Shortcuts**: Bind Ctrl+Z (undo), Ctrl+Shift+Z (redo).

---

## Implementation Plan (Updated)

### Phase 1: Update Requirements and Modal
- Update plan and requirements to reflect page-only modal and correct fields.
- Remove post-related fields/logic from modal.

### Phase 2: Page Creation Modal
- Ensure modal only includes page properties from schema.
- Set default status to 'draft', blocks to [].
- On submit, create page in backend and redirect to PageBuilder.

### Phase 3: PageBuilder Editor
- Ensure it loads blocks from page.
- Implement undo/redo (Ctrl+Z, Ctrl+Shift+Z) using version history.
- Persist edit state to local storage.
- Sync to backend only on explicit save.

### Phase 4: Navigation/Flow
- After page creation, redirect to PageBuilder for that page.

### Phase 5: Testing and Validation
- Update tests to match new flow and requirements.

---

## Files to be Created/Modified (Updated)
- **Remove**: `client/src/components/PageBuilder/CreatePageDialog.tsx` from PageBuilderEditor.
- **Modify**: `client/src/pages/PageBuilderEditor.tsx` (remove page creation logic, classic editor, sidebar link).
- **Modify**: `client/src/pages/Pages.tsx` (ensure modal can be triggered via param, only page fields).
- **Modify**: Sidebar component (remove direct PageBuilder link).
- **Modify**: Editor bar dropdown (update "Create Page" to redirect).

---

## Success Criteria (Updated)
- [ ] Page creation modal only handles page creation, not posts.
- [ ] New pages are created as draft and stored in backend before editing.
- [ ] Page properties in modal match schema (no post fields).
- [ ] After creation, user is redirected to PageBuilder for that page.
- [ ] Editor supports undo/redo with keyboard shortcuts.
- [ ] Edits are saved to local storage until "Save" is clicked.
- [ ] On save, changes are synced to backend.

---

## References
- **Schema:** See `/shared/schema.ts` for the authoritative definition of page properties and structure.
- **Types:** See `/shared/schema-types.ts` for TypeScript types, including `Page`, `NewPage`, `BlockConfig`, and `PageVersionEntry`.
- These files define which fields are valid for page creation and how block editing/undo/redo should be implemented.
- Version tracking happens at the page level (via `PageVersionEntry`), not at individual block level.

## Notes
- All changes should follow existing code patterns and conventions.
- Backup files before making significant changes (as per coding rules).
