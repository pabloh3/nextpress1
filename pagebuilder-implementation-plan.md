# Page Builder Editor Enhancement - Detailed Implementation Plan

## Overview
This plan implements the requirements from `plan.md` to refactor the Page Builder Editor flow, centralize page creation in the Pages view, remove contradictory features, and add undo/redo functionality.

---

## Phase 1: Remove Contradictory Features

### Task 1.1: Remove Page Creation from PageBuilderEditor
**Files to Modify:**
- `client/src/pages/PageBuilderEditor.tsx`

**Changes:**
1. Remove `CreatePageDialog` import and usage
2. Remove `createDialogOpen` state
3. Remove "New Page" button from builder mode top bar (lines 354-361)
4. Remove "New Page" button from classic mode (lines 463-467)
5. Remove `CreatePageDialog` component instances (lines 402-406, 487-491)

**Acceptance Criteria:**
- [ ] No "New Page" button visible in PageBuilderEditor
- [ ] No CreatePageDialog component in PageBuilderEditor
- [ ] No page creation logic in PageBuilderEditor

---

### Task 1.2: Remove Classic Editor Mode
**Files to Modify:**
- `client/src/pages/PageBuilderEditor.tsx`

**Changes:**
1. Remove `editorMode` state and all related logic
2. Remove `handleModeSwitch` function
3. Remove "Classic Editor" button from builder mode (lines 362-369)
4. Remove "Page Builder" button from classic mode (lines 468-475)
5. Remove entire classic editor UI block (lines 420-646)
6. Remove `PostEditor` import (line 15)
7. Remove conditional rendering based on `editorMode` - always show builder mode
8. Remove `useEffect` that sets editor mode based on URL params or post data (lines 73-88)

**Acceptance Criteria:**
- [ ] PageBuilderEditor only shows builder mode
- [ ] No classic editor UI or logic remains
- [ ] No mode switching functionality

---

### Task 1.3: Remove PageBuilder Link from Sidebar
**Files to Modify:**
- `client/src/components/AdminSidebar.tsx`

**Changes:**
1. Remove "Page Builder" menu item from `menuItems` array (line 31)
   - Remove: `{ label: "Page Builder", path: "/page-builder", icon: Settings, section: "Appearance" }`

**Acceptance Criteria:**
- [ ] No "Page Builder" link in AdminSidebar
- [ ] Sidebar navigation only shows valid routes

---

### Task 1.4: Update EditorBar PagesMenu to Redirect
**Files to Modify:**
- `client/src/components/PageBuilder/EditorBar/PagesMenu.tsx`

**Changes:**
1. Update `handleCreateNew` function to redirect to Pages view with create param
   - Change from opening dialog to: `setLocation('/pages?create=true')`

**Acceptance Criteria:**
- [ ] "Create New Page" in EditorBar redirects to Pages view
- [ ] No dialog opens from EditorBar

---

## Phase 2: Page Creation Modal in Pages View

### Task 2.1: Create Page-Only Creation Modal
**Files to Create:**
- `client/src/components/Pages/CreatePageModal.tsx` (new file)

**Files to Modify:**
- `client/src/pages/Pages.tsx`

**Implementation Details:**

**CreatePageModal.tsx:**
- Create new modal component specifically for page creation
- Include only page fields from schema:
  - `title` (required)
  - `slug` (optional, auto-generated from title)
  - `featuredImage` (optional)
  - `allowComments` (boolean, default: true)
  - `password` (optional)
  - `parentId` (optional, dropdown of existing pages)
  - `menuOrder` (optional, number input)
  - `templateId` (optional, dropdown of templates)
- Status is always 'draft' (not user-selectable)
- Blocks are always `[]` on creation
- Use `/api/pages` endpoint (not `/api/posts`)
- On success, redirect to `/page-builder/page/${pageId}?mode=builder`

**Pages.tsx Changes:**
1. Add state for modal: `const [createModalOpen, setCreateModalOpen] = useState(false)`
2. Check URL param `?create=true` on mount and open modal if present
3. Replace PostEditor dialog with CreatePageModal
4. Update `handleNewPage` to open CreatePageModal instead of PostEditor
5. Remove PostEditor import and related state

**Acceptance Criteria:**
- [ ] Modal only shows page fields (no post fields like excerpt, categories, tags)
- [ ] Status is always 'draft' and not editable
- [ ] Blocks default to empty array
- [ ] Uses `/api/pages` endpoint
- [ ] Redirects to PageBuilder after creation
- [ ] Modal can be triggered via URL param `?create=true`

---

### Task 2.2: Update CreatePageDialog (if still used elsewhere)
**Files to Check:**
- Search codebase for any remaining usage of `CreatePageDialog`

**Action:**
- If found in other places, either:
  - Remove if not needed
  - Update to redirect to Pages view instead of creating inline

**Acceptance Criteria:**
- [ ] No CreatePageDialog used for page creation in PageBuilderEditor
- [ ] All page creation flows through Pages view

---

## Phase 3: Settings Tab Improvements

### Task 3.1: Default to Page Settings When No Block Selected
**Files to Modify:**
- `client/src/components/PageBuilder/BuilderSidebar.tsx`
- `client/src/components/PageBuilder/PageBuilder.tsx`

**Changes:**

**BuilderSidebar.tsx:**
1. Add logic to determine if should show page settings by default
2. When `selectedBlock` is null, default `activeTab` to 'settings'
3. Show page settings content when no block selected

**PageBuilder.tsx:**
1. Update `activeTab` state initialization:
   - If `selectedBlockId` is null, default to 'settings'
   - Otherwise default to 'blocks'
2. Add useEffect to switch to 'settings' tab when block is deselected

**Acceptance Criteria:**
- [ ] When no block is selected, settings tab shows page settings
- [ ] When block is selected, settings tab shows block settings
- [ ] Tab automatically switches based on selection state

---

### Task 3.2: Add Toggle Between Page and Block Settings
**Files to Modify:**
- `client/src/components/PageBuilder/BuilderSidebar.tsx`
- `client/src/components/PageBuilder/BlockSettings.tsx` (or create new PageSettings component)

**Changes:**

**BuilderSidebar.tsx:**
1. Add button group in settings tab header to toggle between:
   - "Page Settings" button
   - "Block Settings" button
2. Add state: `const [settingsView, setSettingsView] = useState<'page' | 'block'>('page')`
3. Show button group only when in settings tab
4. Conditionally render PageSettings or BlockSettings based on `settingsView`

**Create PageSettings Component:**
- Create `client/src/components/PageBuilder/PageSettings.tsx`
- Include fields from page schema:
  - Title (editable)
  - Slug
  - Status
  - Featured Image
  - Allow Comments
  - Password
  - Parent Page
  - Menu Order
  - Template
- Save button that updates page via API

**Acceptance Criteria:**
- [ ] Button group visible in settings tab
- [ ] Can toggle between Page Settings and Block Settings
- [ ] Page Settings shows all page properties
- [ ] Block Settings shows when block is selected
- [ ] Page Settings shows when no block is selected

---

### Task 3.3: Keep Page Title Editable in Editor
**Files to Modify:**
- `client/src/pages/PageBuilderEditor.tsx`

**Changes:**
1. Ensure page title input remains in top bar (already exists at lines 340-347)
2. Ensure title updates are saved to local storage (already implemented)
3. Ensure title is included in save operation

**Acceptance Criteria:**
- [ ] Page title is editable in editor top bar
- [ ] Title changes are persisted to local storage
- [ ] Title is saved to backend on explicit save

---

## Phase 4: Undo/Redo Functionality

### Task 4.1: Create Undo/Redo Hook
**Files to Create:**
- `client/src/hooks/useUndoRedo.ts`

**Implementation:**
- Create custom hook that manages undo/redo history
- Store history as array of BlockConfig[] states
- Track current history index
- Implement `undo()` and `redo()` functions
- Implement `pushState()` to add new state to history
- Limit history to reasonable size (e.g., 50 states)
- Return: `{ blocks, undo, redo, canUndo, canRedo, pushState }`

**Acceptance Criteria:**
- [ ] Hook manages history of block states
- [ ] Can undo to previous state
- [ ] Can redo to next state
- [ ] Tracks if undo/redo is available
- [ ] Limits history size to prevent memory issues

---

### Task 4.2: Integrate Undo/Redo into PageBuilder
**Files to Modify:**
- `client/src/components/PageBuilder/PageBuilder.tsx`
- `client/src/hooks/useBlockManager.ts` (if needed)

**Changes:**

**PageBuilder.tsx:**
1. Import and use `useUndoRedo` hook
2. Replace direct `setBlocks` calls with `pushState` from hook
3. Add keyboard event listeners for:
   - `Ctrl+Z` (or `Cmd+Z` on Mac) → `undo()`
   - `Ctrl+Shift+Z` (or `Cmd+Shift+Z` on Mac) → `redo()`
4. Prevent default browser behavior for these shortcuts
5. Update all block modification operations to use `pushState`:
   - Drag and drop
   - Block updates
   - Block deletion
   - Block duplication
   - Block addition

**Acceptance Criteria:**
- [ ] Ctrl+Z (Cmd+Z) performs undo
- [ ] Ctrl+Shift+Z (Cmd+Shift+Z) performs redo
- [ ] All block operations are tracked in history
- [ ] Undo/redo works correctly for all block operations

---

### Task 4.3: Add Undo/Redo UI Indicators (Optional Enhancement)
**Files to Modify:**
- `client/src/components/PageBuilder/BuilderTopBar.tsx` (or create if doesn't exist)
- `client/src/pages/PageBuilderEditor.tsx`

**Changes:**
1. Add undo/redo buttons to editor top bar
2. Disable buttons when undo/redo not available
3. Show tooltips with keyboard shortcuts
4. Optionally show history count or indicator

**Acceptance Criteria:**
- [ ] Undo/redo buttons visible in editor
- [ ] Buttons disabled when action not available
- [ ] Keyboard shortcuts work as expected

---

## Phase 5: Editor Access Flow & Local Storage

### Task 5.1: Ensure Blocks Load from Page
**Files to Modify:**
- `client/src/pages/PageBuilderEditor.tsx`

**Changes:**
1. Verify blocks are loaded from page data (already implemented at lines 91-109)
2. Ensure blocks from `page.blocks` are used (not `builderData`)
3. Update query to use `/api/pages/:id` instead of `/api/posts/:id` for pages

**Acceptance Criteria:**
- [ ] Blocks load from `page.blocks` field
- [ ] Uses correct API endpoint for pages
- [ ] Blocks initialize correctly on editor load

---

### Task 5.2: Persist Edits to Local Storage
**Files to Modify:**
- `client/src/pages/PageBuilderEditor.tsx`

**Changes:**
1. Verify auto-save to localStorage is working (already implemented at lines 135-143)
2. Ensure blocks are saved to localStorage on every change
3. Ensure page title is saved to localStorage
4. Ensure settings view state is saved

**Acceptance Criteria:**
- [ ] Block changes are saved to localStorage immediately
- [ ] Page title changes are saved to localStorage
- [ ] Settings view state is persisted
- [ ] State is restored on page reload

---

### Task 5.3: Sync to Backend on Explicit Save
**Files to Modify:**
- `client/src/pages/PageBuilderEditor.tsx`

**Changes:**
1. Verify `handlePageBuilderSave` function (lines 222-256)
2. Ensure it uses `/api/pages/:id` endpoint for pages (not `/api/posts/:id`)
3. Ensure it sends `blocks` field (not `builderData`)
4. Clear localStorage after successful save (already implemented at lines 210-213)
5. Update query invalidation to use correct endpoint

**Acceptance Criteria:**
- [ ] Save button triggers backend sync
- [ ] Uses correct API endpoint (`/api/pages/:id`)
- [ ] Sends `blocks` field correctly
- [ ] localStorage is cleared after successful save
- [ ] Query cache is invalidated correctly

---

## Phase 6: Navigation & Flow Updates

### Task 6.1: Update Page Creation Redirect
**Files to Modify:**
- `client/src/components/Pages/CreatePageModal.tsx` (from Phase 2)

**Changes:**
1. After successful page creation, redirect to:
   - `/page-builder/page/${pageId}?mode=builder`
   - Or update route structure if different

**Acceptance Criteria:**
- [ ] After page creation, user is redirected to PageBuilder
- [ ] PageBuilder loads with correct page ID
- [ ] Blocks are empty array on new page

---

### Task 6.2: Update Pages View Actions
**Files to Modify:**
- `client/src/pages/Pages.tsx`

**Changes:**
1. Update "Edit with Page Builder" button (line 204-211) to use correct route
2. Ensure route format matches: `/page-builder/page/${pageId}?mode=builder`
3. Remove "Edit with Classic Editor" button or update to redirect appropriately

**Acceptance Criteria:**
- [ ] "Edit with Page Builder" button navigates correctly
- [ ] Route format is consistent
- [ ] Page loads correctly in PageBuilder

---

## Phase 7: Testing & Validation

### Task 7.1: Manual Testing Checklist
- [ ] Create new page from Pages view
- [ ] Verify modal shows only page fields
- [ ] Verify redirect to PageBuilder after creation
- [ ] Verify blocks load from page
- [ ] Verify edits save to localStorage
- [ ] Verify undo/redo works with keyboard shortcuts
- [ ] Verify settings tab shows page settings by default
- [ ] Verify toggle between page/block settings works
- [ ] Verify save syncs to backend
- [ ] Verify localStorage cleared after save
- [ ] Verify no page creation in PageBuilderEditor
- [ ] Verify no classic editor mode
- [ ] Verify no PageBuilder link in sidebar

---

### Task 7.2: Update Tests (if applicable)
**Files to Check:**
- Any test files related to PageBuilderEditor
- Any test files related to page creation

**Action:**
- Update tests to reflect new flow
- Remove tests for classic editor mode
- Remove tests for page creation in PageBuilderEditor
- Add tests for new page creation modal
- Add tests for undo/redo functionality

---

## File Summary

### Files to Create:
1. `client/src/components/Pages/CreatePageModal.tsx` - Page-only creation modal
2. `client/src/components/PageBuilder/PageSettings.tsx` - Page settings component
3. `client/src/hooks/useUndoRedo.ts` - Undo/redo hook

### Files to Modify:
1. `client/src/pages/PageBuilderEditor.tsx` - Remove page creation, classic editor, add undo/redo
2. `client/src/pages/Pages.tsx` - Add page creation modal, update flow
3. `client/src/components/AdminSidebar.tsx` - Remove PageBuilder link
4. `client/src/components/PageBuilder/EditorBar/PagesMenu.tsx` - Redirect to Pages view
5. `client/src/components/PageBuilder/BuilderSidebar.tsx` - Add settings toggle, default to page settings
6. `client/src/components/PageBuilder/PageBuilder.tsx` - Integrate undo/redo

### Files to Remove/Deprecate:
1. `client/src/components/PageBuilder/CreatePageDialog.tsx` - Move to trash (if not used elsewhere)

---

## Implementation Order

1. **Phase 1** - Remove contradictory features (cleanup first)
2. **Phase 2** - Create page-only modal (core functionality)
3. **Phase 3** - Settings tab improvements (UX enhancement)
4. **Phase 4** - Undo/redo (feature addition)
5. **Phase 5** - Editor flow verification (ensure existing works)
6. **Phase 6** - Navigation updates (connect everything)
7. **Phase 7** - Testing (validate everything)

---

## Notes

- Always backup files before making changes (>10 lines)
- Follow existing code patterns and conventions
- Use `/api/pages` endpoint for page operations (not `/api/posts`)
- Page schema fields: title, slug, featuredImage, allowComments, password, parentId, menuOrder, templateId
- Status is always 'draft' on creation, blocks are always `[]`
- Use `SavedBlockConfig` type for version history in undo/redo (future enhancement)
- Local storage already implemented, just need to verify it works correctly

