# Page Builder Enhancement - Testing Guide

## Pre-Testing Setup

1. **Start the development server** (if not already running):
   ```bash
   pnpm dev
   ```

2. **Ensure you have test data**:
   - At least one existing page
   - At least one template (optional, for template testing)

---

## Phase 1: Removed Features Testing

### Test 1.1: No Page Creation in PageBuilderEditor
- [ ] Navigate to any page in PageBuilder Editor (`/page-builder/page/{id}?mode=builder`)
- [ ] Verify there is NO "New Page" button in the top bar
- [ ] Verify no CreatePageDialog can be opened from the editor

### Test 1.2: No Classic Editor Mode
- [ ] Navigate to any page in PageBuilder Editor
- [ ] Verify ONLY builder mode is shown (no classic editor UI)
- [ ] Verify there is NO "Classic Editor" button
- [ ] Verify there is NO mode switching functionality

### Test 1.3: No PageBuilder Link in Sidebar
- [ ] Look at the AdminSidebar
- [ ] Verify there is NO "Page Builder" link in the Appearance section
- [ ] Verify other sidebar links still work

### Test 1.4: PagesMenu Redirects
- [ ] While in PageBuilder Editor, click the "Pages" menu in the top bar
- [ ] Click "Create New Page"
- [ ] Verify it redirects to `/pages?create=true` (Pages view with modal open)

---

## Phase 2: Page Creation Modal Testing

### Test 2.1: Modal Opens from Pages View
- [ ] Navigate to `/pages`
- [ ] Click "Add New Page" button
- [ ] Verify CreatePageModal opens
- [ ] Verify modal shows only page fields (no post fields like excerpt, categories, tags)

### Test 2.2: Modal Opens from URL Param
- [ ] Navigate to `/pages?create=true`
- [ ] Verify modal opens automatically
- [ ] Navigate to `/pages?create=true&title=Test%20Page`
- [ ] Verify modal opens with "Test Page" pre-filled in title field

### Test 2.3: Form Fields Validation
- [ ] Open CreatePageModal
- [ ] Try to submit without title → Should show validation error
- [ ] Enter a title → Slug should auto-generate
- [ ] Manually edit slug → Should allow custom slug
- [ ] Enter invalid slug (with spaces/special chars) → Should show error
- [ ] Test all optional fields:
  - Featured Image URL
  - Allow Comments checkbox
  - Password field
  - Parent Page dropdown (should show existing pages)
  - Menu Order (number input)
  - Template dropdown (should show templates)

### Test 2.4: Page Creation and Redirect
- [ ] Fill in form with:
  - Title: "Test Page"
  - Slug: "test-page" (or auto-generated)
  - Status: Always "draft" (not editable)
- [ ] Click "Create Page"
- [ ] Verify page is created in backend
- [ ] Verify redirect to `/page-builder/page/{newPageId}?mode=builder`
- [ ] Verify PageBuilder loads with the new page
- [ ] Verify blocks array is empty `[]`

### Test 2.5: API Endpoint Verification
- [ ] Open browser DevTools → Network tab
- [ ] Create a new page
- [ ] Verify POST request goes to `/api/pages` (not `/api/posts`)
- [ ] Verify request payload includes:
  - `title`, `slug`, `status: 'draft'`, `blocks: []`
  - Other optional fields if filled

---

## Phase 3: Settings Tab Improvements Testing

### Test 3.1: Default to Page Settings
- [ ] Open PageBuilder Editor for any page
- [ ] Verify Settings tab is active by default (when no block selected)
- [ ] Verify PageSettings component is shown (not "Select a block" message)

### Test 3.2: Toggle Between Page and Block Settings
- [ ] In Settings tab, verify toggle buttons exist:
  - "Page Settings" button
  - "Block Settings" button
- [ ] Click "Page Settings" → Verify page settings form is shown
- [ ] Click "Block Settings" → Verify it's disabled (no block selected)
- [ ] Click a block in the canvas
- [ ] Verify "Block Settings" becomes enabled
- [ ] Click "Block Settings" → Verify BlockSettings component is shown
- [ ] Click "Page Settings" → Verify PageSettings component is shown

### Test 3.3: Auto-Switch Settings View
- [ ] With no block selected → Verify settings view is "page"
- [ ] Click a block → Verify settings view auto-switches to "block"
- [ ] Deselect block (click canvas) → Verify settings view auto-switches to "page"

### Test 3.4: PageSettings Component
- [ ] Open PageSettings in Settings tab
- [ ] Verify all fields are displayed:
  - Title (editable)
  - Slug (editable)
  - Status (dropdown: draft, publish, private, trash)
  - Featured Image URL
  - Allow Comments (checkbox)
  - Password
  - Parent Page (dropdown)
  - Menu Order (number)
  - Template (dropdown)
- [ ] Edit some fields
- [ ] Click "Save Settings"
- [ ] Verify PUT request goes to `/api/pages/{id}`
- [ ] Verify changes are saved to backend
- [ ] Verify success toast appears

### Test 3.5: Page Title Editable in Editor
- [ ] Verify page title input exists in editor top bar
- [ ] Edit title in top bar
- [ ] Verify title is saved to localStorage (check DevTools → Application → Local Storage)
- [ ] Refresh page → Verify title is restored from localStorage
- [ ] Click Save → Verify title is synced to backend

---

## Phase 4: Undo/Redo Functionality Testing

### Test 4.1: Keyboard Shortcuts
- [ ] Open PageBuilder Editor
- [ ] Make a change (add a block, edit content, etc.)
- [ ] Press `Ctrl+Z` (or `Cmd+Z` on Mac) → Verify undo works
- [ ] Press `Ctrl+Shift+Z` (or `Cmd+Shift+Z` on Mac) → Verify redo works
- [ ] Verify browser's default undo/redo is prevented

### Test 4.2: Undo/Redo with Block Operations
- [ ] Add a block → Verify it appears
- [ ] Press Ctrl+Z → Verify block is removed (undone)
- [ ] Press Ctrl+Shift+Z → Verify block reappears (redone)
- [ ] Edit block content → Press Ctrl+Z → Verify content reverts
- [ ] Delete a block → Press Ctrl+Z → Verify block is restored
- [ ] Move a block (drag & drop) → Press Ctrl+Z → Verify block moves back

### Test 4.3: History Limit
- [ ] Make 60+ changes quickly
- [ ] Verify undo still works (should be limited to 50 states)
- [ ] Verify no memory issues or performance degradation

### Test 4.4: Undo After New Change
- [ ] Make change A
- [ ] Make change B
- [ ] Press Ctrl+Z (undo to A)
- [ ] Make change C
- [ ] Press Ctrl+Z → Should undo to A (not B, because C replaced B in history)

---

## Phase 5: API Migration Testing

### Test 5.1: Page Loading
- [ ] Open PageBuilder Editor for a page
- [ ] Verify GET request goes to `/api/pages/{id}` (not `/api/posts/{id}`)
- [ ] Verify blocks load from `page.blocks` field (not `builderData`)

### Test 5.2: Page Saving
- [ ] Make changes to blocks
- [ ] Click Save button
- [ ] Verify PUT request goes to `/api/pages/{id}`
- [ ] Verify request payload includes `blocks` field (not `builderData`)
- [ ] Verify success toast appears
- [ ] Verify localStorage is cleared after save

### Test 5.3: Query Invalidation
- [ ] Save a page
- [ ] Navigate to Pages list view
- [ ] Verify page list refreshes automatically
- [ ] Verify updated page data is shown

### Test 5.4: Posts Still Work
- [ ] Open PageBuilder Editor for a POST (not page)
- [ ] Verify it still uses `/api/posts/{id}`
- [ ] Verify it still uses `builderData` field
- [ ] Verify posts functionality is not broken

---

## Phase 6: Navigation & Routes Testing

### Test 6.1: Route Format
- [ ] Create a new page from Pages view
- [ ] Verify redirect URL is: `/page-builder/page/{id}?mode=builder`
- [ ] Verify PageBuilder loads correctly
- [ ] Verify page data loads correctly

### Test 6.2: Pages View Actions
- [ ] Go to Pages list view
- [ ] Click "Edit with Page Builder" button (paintbrush icon)
- [ ] Verify navigation to `/page-builder/page/{id}?mode=builder`
- [ ] Verify "Edit with Classic Editor" button is removed (or updated)

---

## Phase 7: Cleanup Verification

### Test 7.1: CreatePageDialog Removed
- [ ] Verify `CreatePageDialog.tsx` is in `/trash/` directory
- [ ] Verify no imports of CreatePageDialog exist in PageBuilderEditor
- [ ] Verify no errors in console related to missing CreatePageDialog

---

## Integration Testing

### Test I.1: Complete Page Creation Flow
1. Navigate to `/pages`
2. Click "Add New Page"
3. Fill form and create page
4. Verify redirect to PageBuilder
5. Add some blocks
6. Edit page settings
7. Save page
8. Verify everything persists correctly

### Test I.2: Undo/Redo in Real Workflow
1. Create page with multiple blocks
2. Edit various blocks
3. Use undo/redo multiple times
4. Save page
5. Reload page
6. Verify saved state matches what you saw before save

### Test I.3: Local Storage Persistence
1. Make edits in PageBuilder
2. Close browser tab (don't save)
3. Reopen same page in PageBuilder
4. Verify edits are restored from localStorage
5. Save page
6. Verify localStorage is cleared
7. Reload → Verify page loads from backend (not localStorage)

---

## Edge Cases & Error Handling

### Test E.1: Network Errors
- [ ] Disconnect network
- [ ] Try to create page → Should show error toast
- [ ] Try to save page → Should show error toast
- [ ] Reconnect → Should work normally

### Test E.2: Invalid Data
- [ ] Try to create page with invalid slug format
- [ ] Verify validation error appears
- [ ] Try to save page with invalid data
- [ ] Verify error handling

### Test E.3: Concurrent Edits
- [ ] Open same page in two browser tabs
- [ ] Make edits in both
- [ ] Save in one tab
- [ ] Verify other tab shows updated data (or handles conflict)

---

## Performance Testing

### Test P.1: Large Block Count
- [ ] Create page with 50+ blocks
- [ ] Verify undo/redo still works smoothly
- [ ] Verify no performance degradation
- [ ] Verify localStorage size is reasonable

### Test P.2: Rapid Changes
- [ ] Make rapid changes (add/delete/edit blocks quickly)
- [ ] Verify undo/redo history is managed correctly
- [ ] Verify no memory leaks

---

## Browser Compatibility

### Test B.1: Keyboard Shortcuts
- [ ] Test on Chrome/Edge: Ctrl+Z, Ctrl+Shift+Z
- [ ] Test on Mac Safari/Chrome: Cmd+Z, Cmd+Shift+Z
- [ ] Verify shortcuts work in all browsers

---

## Quick Test Checklist (5 minutes)

If you're short on time, test these critical paths:

1. ✅ Create new page from Pages view → Opens modal → Creates page → Redirects to PageBuilder
2. ✅ No "New Page" button in PageBuilder Editor
3. ✅ Settings tab shows page settings by default
4. ✅ Undo/Redo works (Ctrl+Z, Ctrl+Shift+Z)
5. ✅ Save page → Uses `/api/pages` endpoint with `blocks` field
6. ✅ Page title editable in editor top bar

---

## Notes

- All tests should be done in a development environment
- Use browser DevTools to verify network requests and localStorage
- Check browser console for any errors or warnings
- If any test fails, note the exact steps to reproduce

