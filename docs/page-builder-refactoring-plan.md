# Page Builder useEffect Refactoring Plan

## Overview

Refactoring the PageBuilder and its block components to eliminate direct `useEffect` calls per the no-use-effect skill rules.

---

## Phase 1: Critical - Fix `useBlockState.ts`

**File**: `client/src/components/PageBuilder/blocks/useBlockState.ts`

### Problem Analysis

This is a core hook used by ALL blocks. 5 useEffect violations:

| Lines | Rule | Pattern |
|-------|------|---------|
| 59-61 | Rule 6 | Effect-Ref Spiral - ref to fix onChange loop |
| 67-69 | Rule 6 | Effect-Ref Spiral - track latest value |
| 72-80 | Rule 5 | Reset state via dependency choreography |
| 83-100 | Rule 7 | Reactive entanglement - emit changes upstream |
| 103-114 | Rule 4 | Mount-only registration (acceptable but should use `useMountEffect`) |

### Current Code Structure

```typescript
// Lines 72-80: Rule 5 violation - resets state when value.id changes
useEffect(() => {
  if (prevValueIdRef.current === null || prevValueIdRef.current !== value.id) {
    prevValueIdRef.current = value.id;
    setContent(resolveContent());
    setStyles(value.styles);
    setSettings(value.settings);
  }
}, [value.id]);

// Lines 83-100: Rule 7 violation - reactive entanglement
useEffect(() => {
  if (isInitialMount.current) {
    isInitialMount.current = false;
    return;
  }
  const base = latestValueRef.current;
  const nextBlock = { ...base, id: clientId, content, styles, settings };
  latestValueRef.current = nextBlock;
  onChangeRef.current(nextBlock);
}, [clientId, content, styles, settings]);
```

### Proposed Fix: Flat State + Procedural Updates

**Approach**: The hook should only manage clientId. All other state is derived from `value` prop.

```typescript
export function useBlockState<TContent>({
  value,
  getDefaultContent,
  onChange,
}: UseBlockStateOptions<TContent>): UseBlockStateResult<TContent> {
  const [clientId] = useState(() => value.id || nanoid());

  // Derived state - no useState needed
  const content = (value.content as TContent) ?? getDefaultContent();
  const styles = value.styles;
  const settings = value.settings;

  // Procedural update - call onChange directly from setters
  const setContent = useCallback((update: TContent | ((prev: TContent) => TContent)) => {
    const next = typeof update === 'function' 
      ? (update as Function)(content) 
      : update;
    onChange({ ...value, content: next });
  }, [value, onChange, content]);

  const setStyles = useCallback((update: React.CSSProperties | undefined | ((prev: React.CSSProperties | undefined) => React.CSSProperties | undefined)) => {
    const next = typeof update === 'function'
      ? (update as Function)(styles)
      : update;
    onChange({ ...value, styles: next });
  }, [value, onChange, styles]);

  const setSettings = useCallback((update: Record<string, any> | undefined | ((prev: Record<string, any> | undefined) => Record<string, any> | undefined)) => {
    const next = typeof update === 'function'
      ? (update as Function)(settings)
      : update;
    onChange({ ...value, settings: next });
  }, [value, onChange, settings]);

  // Mount-only: register accessor (use useMountEffect)
  useMountEffect(() => {
    registerBlockState(clientId, {
      getContent: () => content,
      getStyles: () => styles,
      getSettings: () => settings,
      setContent,
      setStyles,
      setSettings,
      getFullState: () => value,
    });
    return () => unregisterBlockState(clientId);
  });

  return { clientId, content, setContent, styles, setStyles, settings, setSettings };
}
```

### Key Changes

1. **No local state** - derive `content`, `styles`, `settings` directly from `value` prop
2. **No effect for initialization** - use `value` directly, React handles updates
3. **Procedural updates** - `setContent/setStyles/setSettings` call `onChange` directly
4. **Register accessor on mount only** - use `useMountEffect`

---

## Phase 2: Major - Settings Components (11 blocks)

**Pattern**: `useEffect(() => setLocalContent(block.content), [block.content])`

### Problem

Rule 1 violation: syncing local state from prop instead of deriving.

### Files to Fix

1. `client/src/components/PageBuilder/blocks/post-new/PostNewBlock.tsx:162-164`
2. `client/src/components/PageBuilder/blocks/post-info/PostInfoBlock.tsx:333-335`
3. `client/src/components/PageBuilder/blocks/post-progress/PostProgressBlock.tsx`
4. `client/src/components/PageBuilder/blocks/post-navigation/PostNavigationBlock.tsx`
5. `client/src/components/PageBuilder/blocks/post-comments/PostCommentsBlock.tsx`
6. `client/src/components/PageBuilder/blocks/post-author-box/PostAuthorBoxBlock.tsx`
7. `client/src/components/PageBuilder/blocks/post-toc/PostTocBlock.tsx`
8. `client/src/components/PageBuilder/blocks/post-featured-image/PostFeaturedImageBlock.tsx`
9. `client/src/components/PageBuilder/blocks/post-excerpt/PostExcerptBlock.tsx`
10. `client/src/components/PageBuilder/blocks/post-title/PostTitleBlock.tsx`
11. `client/src/components/PageBuilder/blocks/post-list/PostListBlock.tsx`

### Example Fix (PostNewBlock)

**Before**:
```tsx
function PostNewSettings({ block, onUpdate }: PostNewSettingsProps) {
  const accessor = getBlockStateAccessor(block.id);
  const [localContent, setLocalContent] = React.useState<PostNewContent>(
    (block.content as PostNewContent) || DEFAULT_CONTENT,
  );

  React.useEffect(() => {
    setLocalContent((block.content as PostNewContent) || DEFAULT_CONTENT);
  }, [block.content]);

  const updateContent = (updates: Partial<PostNewContent>) => {
    const updated = { ...localContent, ...updates };
    setLocalContent(updated);
    if (accessor) {
      accessor.setContent(updated);
    } else if (onUpdate) {
      onUpdate({ content: updated as unknown as BlockContent });
    }
  };
  // ...
}
```

**After**:
```tsx
function PostNewSettings({ block, onUpdate }: PostNewSettingsProps) {
  const accessor = getBlockStateAccessor(block.id);
  
  // Derive directly from block prop - no local state needed
  const content = (block.content as PostNewContent) || DEFAULT_CONTENT;

  const updateContent = (updates: Partial<PostNewContent>) => {
    const updated = { ...content, ...updates };
    // Update via accessor (controls block state) or via onUpdate
    if (accessor) {
      accessor.setContent(updated);
    } else if (onUpdate) {
      onUpdate({ content: updated as unknown as BlockContent });
    }
  };
  // ...
}
```

### Key Changes

1. Remove `useState` for `localContent`
2. Remove `useEffect` that synced from `block.content`
3. Use `content` directly (derived from prop)
4. Update logic stays the same - calls accessor or onUpdate

---

## Phase 3: Major - Data Fetching (useQuery)

### Problem

Rule 2 violation: bare fetch + setState instead of data-fetching library.

### Files to Fix

| File | Hook | Lines |
|------|------|-------|
| `post-info/PostInfoBlock.tsx` | `usePostMeta` | 138-164 |
| `post-navigation/PostNavigationBlock.tsx` | `useAdjacentPosts` | 71-94 |
| `post-comments/PostCommentsBlock.tsx` | (inline fetch) | 211-266 |
| `post-author-box/PostAuthorBoxBlock.tsx` | `useAuthorData` | 84-106 |
| `post-list/PostListBlock.tsx` | (inline fetch) | 131-187 |

### Example Fix (PostInfoBlock usePostMeta)

**Before**:
```tsx
function usePostMeta(postId: string | undefined, isPreview: boolean): PostMeta | null {
  const [meta, setMeta] = useState<PostMeta | null>(null);
  useEffect(() => {
    if (!isPreview || !postId) {
      setMeta(null);
      return;
    }
    let cancelled = false;
    fetch(`/api/posts/${postId}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setMeta({ publishedAt: data.publishedAt, categories: data.categories, tags: data.tags, wordCount: data.wordCount });
      })
      .catch(() => { if (!cancelled) setMeta(null); });
    return () => { cancelled = true; };
  }, [postId, isPreview]);
  return meta;
}
```

**After** (using useQuery):
```tsx
function usePostMeta(postId: string | undefined, isPreview: boolean): PostMeta | null {
  const { data } = useQuery({
    queryKey: ['post-meta', postId],
    queryFn: () => fetch(`/api/posts/${postId}`).then(res => res.json()),
    enabled: !!isPreview && !!postId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  if (!data) return null;
  return {
    publishedAt: data.publishedAt,
    categories: data.categories,
    tags: data.tags,
    wordCount: data.wordCount,
  };
}
```

### Key Changes

1. Replace `useState + useEffect` with `useQuery`
2. Handle loading/error states via `useQuery` return values
3. Add proper cache configuration

---

## Phase 4: Major - State Synchronization Effects

### Files to Fix

| File | Lines | Issue |
|------|-------|-------|
| `PageBuilder.tsx` | 93-95 | Sync `currentState` to `blocks` |
| `PageBuilder.tsx` | 106-120 | Detect external `propBlocks` |
| `PageBuilder.tsx` | 192-195 | Parent notification |
| `PageBuilderEditor.tsx` | 133-150 | Reset state on ID change |
| `PageBuilderEditor.tsx` | 152-203 | Load draft data |
| `PageBuilderEditor.tsx` | 206-218 | URL replacement |
| `BuilderSidebar.tsx` | 45-68 | Auto-switch view |

### Fix: PageBuilder.tsx Line 93-95

**Before**:
```tsx
const { currentState, pushState, undo, redo, canUndo, canRedo, resetState } =
  useUndoRedo<BlockConfig[]>(initialBlocks);
const [blocks, setBlocks] = useState<BlockConfig[]>(currentState);

useEffect(() => {
  setBlocks(currentState);
}, [currentState]);
```

**After**:
```tsx
// Derive blocks from currentState directly - no separate state
const { currentState, pushState, undo, redo, canUndo, canRedo, resetState } =
  useUndoRedo<BlockConfig[]>(initialBlocks);
const blocks = currentState; // Direct derivation
```

### Fix: PageBuilder.tsx Line 192-195

**Before**:
```tsx
useEffect(() => {
  lastEmittedRef.current = blocks;
  onBlocksChangeRef.current?.(blocks);
}, [blocks]);
```

**After** (procedural approach):
```tsx
const handleBlocksChange = useCallback((updated: BlockConfig) => {
  commitBlocks((prev) => {
    const { found, next } = updateBlockDeep(prev, updated.id, updated);
    return found ? next : prev;
  });
  // Notify parent in the same handler
  lastEmittedRef.current = blocks;
  onBlocksChange?.(blocks);
}, [commitBlocks, blocks, onBlocksChange]);
```

### Fix: BuilderSidebar.tsx Line 45-68

**Before**:
```tsx
useEffect(() => {
  const hasBlock = !!selectedBlock;
  const wasBlock = prevHasBlockRef.current;
  // ... complex logic to auto-switch view
}, [selectedBlock, userManuallyChangedView]);
```

**After** (derive state):
```tsx
// Derive settingsView from selectedBlock - no effect needed
const settingsView = userManuallyChangedView 
  ? settingsView // keep current
  : (selectedBlock ? 'block' : 'page');
```

Or use `useMemo`:
```tsx
const settingsView = useMemo(() => {
  if (userManuallyChangedView) return settingsView; // preserve
  return selectedBlock ? 'block' : 'page';
}, [selectedBlock, userManuallyChangedView, settingsView]);
```

### Fix: PageBuilderEditor.tsx Lines 206-218 (URL Replacement)

**Before**:
```tsx
useEffect(() => {
  if (!isPost && data && postId && !isSlug && data.slug) {
    const currentPath = window.location.pathname;
    const slugPath = `/page-builder/page/${data.slug}`;
    if (isUUIDPath && currentPath !== slugPath) {
      window.history.replaceState({}, '', slugPath);
    }
  }
}, [data, postId, isSlug, isPost]);
```

**After** (useMountEffect):
```tsx
useMountEffect(() => {
  if (!isPost && data && postId && !isSlug && data.slug) {
    const currentPath = window.location.pathname;
    const slugPath = `/page-builder/page/${data.slug}`;
    const isUUIDPath = /^\/page-builder\/page\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(currentPath);
    if (isUUIDPath && currentPath !== slugPath) {
      window.history.replaceState({}, '', slugPath);
    }
  }
});
```

---

## Phase 5: Minor - Convert to useMountEffect

### Files

| File | Lines | Purpose |
|------|-------|---------|
| `PageBuilder.tsx` | 217-235 | Keyboard shortcuts |
| `PageBuilderEditor.tsx` | 269-275 | Cleanup timeout |
| `PageBuilderEditor.tsx` | 282-327 | Custom events |
| `PostTocBlock.tsx` | 143-148 | DOM scanning |
| `useBlockState.ts` | 103-114 | Register accessor |

### Example Fix

**Before**:
```tsx
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => { /* ... */ };
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [undo, redo, handleSave]);
```

**After**:
```tsx
useMountEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    const isMod = e.ctrlKey || e.metaKey;
    const key = e.key.toLowerCase();
    if (isMod && key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
    else if (isMod && ((e.shiftKey && key === 'z') || key === 'y')) { e.preventDefault(); redo(); }
    else if (isMod && key === 's') { e.preventDefault(); handleSave(); }
  };
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
});
```

Note: `useMountEffect` re-runs on every render if deps change (due to `useEffect` underneath). This is acceptable for event listeners that need fresh references.

---

## Implementation Order

1. **Phase 1**: Fix `useBlockState.ts` (affects all blocks - highest impact)
2. **Phase 2**: Fix Settings components (11 blocks - standardize pattern)
3. **Phase 3**: Convert data fetching to `useQuery`
4. **Phase 4**: Fix state synchronization effects
5. **Phase 5**: Convert remaining effects to `useMountEffect`

---

## Testing Checklist

After each phase:
- [ ] Block content updates propagate correctly
- [ ] Undo/redo works properly
- [ ] Settings panel updates block preview
- [ ] Data fetches (comments, author, etc.) load correctly
- [ ] Keyboard shortcuts work
- [ ] No console errors
- [ ] No infinite loops or excessive re-renders

---

## Phase 6: Major - useState from Prop + 3+ setState in Effects

### Problem

1. `useState` initialized from prop without sync - should derive inline
2. Multiple `setState` calls in single `useEffect` - should use `useReducer`
3. `useState(reduce())` initializer runs on every render

### Files to Fix

| Issue | Files |
|-------|-------|
| useState from prop | `PageBuilderEditor.tsx:103-114` |
| 3+ setState in effect | `PageBuilderEditor.tsx:133-150`, `152-203` |
| useState(reduce()) | (lazy init pattern needed) |

### Fix: PageBuilderEditor.tsx - Reset Effect

**Before**:
```tsx
useEffect(() => {
  if (resolvedPageId || postId) {
    if (draftSaveRef.current) {
      clearTimeout(draftSaveRef.current);
    }
    setIsInitialized(false);
    setBlocks([]);
    setPageTitle('');
    setPageSlug('');
    setPageStatus('draft');
    latestPageStateRef.current = {
      blocks: [],
      title: '',
      slug: '',
      status: 'draft',
    };
  }
}, [resolvedPageId, postId]);
```

**After** (useReducer):
```tsx
const [pageState, dispatchPageState] = useReducer(pageStateReducer, {
  blocks: [],
  title: '',
  slug: '',
  status: 'draft',
  isInitialized: false,
});

function pageStateReducer(state: PageState, action: PageStateAction): PageState {
  switch (action.type) {
    case 'RESET':
      return { ...initialPageState, isInitialized: false };
    case 'LOAD':
      return { ...state, ...action.payload, isInitialized: true };
    default:
      return state;
  }
}

// In the handler or effect that resets:
dispatchPageState({ type: 'RESET' });

// To load data:
dispatchPageState({ type: 'LOAD', payload: { blocks, title, slug, status } });
```

### Fix: useState Lazy Initialization

**Before**:
```tsx
const [state, setState] = useState(someExpensiveCalculation());
```

**After**:
```tsx
const [state, setState] = useState(() => someExpensiveCalculation());
```

---

## Phase 7: Major - dangerouslySetInnerHTML

### Problem

`dangerouslySetInnerHTML` is dangerous - can lead to XSS vulnerabilities.

### Files to Find

Need to grep for occurrences:
```bash
grep -r "dangerouslySetInnerHTML" client/src/components/PageBuilder/
```

### Approach

1. **Markdown blocks**: Use a safe markdown parser (e.g., `marked` with sanitization)
2. **HTML blocks**: Sanitize with DOMPurify before rendering
3. **Rich text**: Use a safe rich text library

**Example Fix**:
```tsx
import DOMPurify from 'dompurify';

function SafeHtml({ html }: { html: string }) {
  const sanitized = DOMPurify.sanitize(html);
  return <div dangerouslySetInnerHTML={{ __html: sanitized }} />;
}
```

Or better, use a safe markdown library:
```tsx
import { marked } from 'marked';
import DOMPurify from 'dompurify';

function SafeMarkdown({ content }: { content: string }) {
  const html = marked.parse(content);
  const sanitized = DOMPurify.sanitize(html);
  return <div dangerouslySetInnerHTML={{ __html: sanitized }} />;
}
```

---

## Phase 8: Medium - Component Size + useState Groups

### Problem

1. Large components (>300 lines) should be split
2. 7+ useState calls should use `useReducer`

### Files to Fix

| File | Issue | Action |
|------|-------|--------|
| `ImageSettings.tsx` | 367 lines | Split into `<ImageSizeSettings />`, `<ImageAltSettings />`, `<ImageLinkSettings />` |
| `CreatePostDialog` | 7+ useState | Use `useReducer` |

### Example Fix: CreatePostDialog useReducer

**Before**:
```tsx
const [title, setTitle] = useState('');
const [slug, setSlug] = useState('');
const [content, setContent] = useState('');
const [status, setStatus] = useState('draft');
const [category, setCategory] = useState('');
const [tags, setTags] = useState<string[]>([]);
const [featuredImage, setFeaturedImage] = useState<string | null>(null);
```

**After**:
```tsx
interface PostFormState {
  title: string;
  slug: string;
  content: string;
  status: 'draft' | 'published' | 'private';
  category: string;
  tags: string[];
  featuredImage: string | null;
}

type PostFormAction =
  | { type: 'SET_TITLE'; payload: string }
  | { type: 'SET_SLUG'; payload: string }
  | { type: 'SET_CONTENT'; payload: string }
  | { type: 'SET_STATUS'; payload: PostFormState['status'] }
  | { type: 'SET_CATEGORY'; payload: string }
  | { type: 'SET_TAGS'; payload: string[] }
  | { type: 'SET_FEATURED_IMAGE'; payload: string | null }
  | { type: 'RESET' };

function postFormReducer(state: PostFormState, action: PostFormAction): PostFormState {
  switch (action.type) {
    case 'SET_TITLE': return { ...state, title: action.payload };
    case 'SET_SLUG': return { ...state, slug: action.payload };
    case 'SET_CONTENT': return { ...state, content: action.payload };
    case 'SET_STATUS': return { ...state, status: action.payload };
    case 'SET_CATEGORY': return { ...state, category: action.payload };
    case 'SET_TAGS': return { ...state, tags: action.payload };
    case 'SET_FEATURED_IMAGE': return { ...state, featuredImage: action.payload };
    case 'RESET': return initialFormState;
    default: return state;
  }
}

const initialFormState: PostFormState = {
  title: '',
  slug: '',
  content: '',
  status: 'draft',
  category: '',
  tags: [],
  featuredImage: null,
};

const [form, dispatchForm] = useReducer(postFormReducer, initialFormState);
```

---

## Phase 9: Medium - Accessibility (a11y)

### Problems

1. `autoFocus` causes usability issues
2. Clickable non-interactive elements without keyboard listeners
3. Static HTML elements with event handlers missing `role`
4. `<a>` with `onClick` should be `<button>`
5. `preventDefault()` on `<a>` - use proper routing
6. Missing `title` on `<iframe>`

### Files to Find

```bash
grep -rn "autoFocus" client/src/components/PageBuilder/
grep -rn 'onClick.*href' client/src/components/PageBuilder/
grep -rn "preventDefault" client/src/components/PageBuilder/
grep -rn "<iframe" client/src/components/PageBuilder/
```

### Fix: autoFocus

**Before**:
```tsx
<input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} />
```

**After**: Remove `autoFocus` and let users focus naturally, or use:
```tsx
useEffect(() => {
  inputRef.current?.focus();
}, []); // Only on mount, not on every render
```

Or better, use `useMountEffect`:
```tsx
useMountEffect(() => {
  inputRef.current?.focus();
});
```

### Fix: Clickable Div/Span → Button

**Before**:
```tsx
<div onClick={handleClick} className="cursor-pointer">
  Click me
</div>
```

**After**:
```tsx
<button type="button" onClick={handleClick} className="cursor-pointer">
  Click me
</button>
```

### Fix: Anchor with preventDefault

**Before**:
```tsx
<a href="#" onClick={(e) => { e.preventDefault(); handleClick(); }}>
  Click
</a>
```

**After**:
```tsx
<button type="button" onClick={handleClick}>
  Click
</button>
```

### Fix: iframe title

**Before**:
```tsx
<iframe src={url} />
```

**After**:
```tsx
<iframe src={url} title="Video player" />
```

---

## Phase 10: Medium - Performance

### Problems

1. `touchmove` listener without `{ passive: true }` blocks scrolling
2. Array index as key causes bugs on reorder/filter

### Fix: Passive Event Listener

**Before**:
```tsx
element.addEventListener('touchmove', handler);
```

**After**:
```tsx
element.addEventListener('touchmove', handler, { passive: true });
```

### Fix: Index Key → Stable Key

**Before**:
```tsx
{items.map((item, idx) => (
  <div key={idx}>{item.name}</div>
))}
```

**After**:
```tsx
{items.map((item) => (
  <div key={item.id}>{item.name}</div>
))}
```

---

## Phase 11: Medium - Avoid Passing Children as Prop

### Problem

Passing children via prop instead of JSX children.

### Fix

**Before**:
```tsx
<Component children={<div>Content</div>} />
<Component child={<div>Content</div>} />
```

**After**:
```tsx
<Component>
  <div>Content</div>
</Component>
```

---

## Phase 12: Minor - Stale Closure (setState without Functional Update)

### Problem

`setPage(page - 1)` can cause stale closures.

### Fix

**Before**:
```tsx
setPage(page - 1);
```

**After**:
```tsx
setPage(prev => prev - 1);
```

---

## Complete Implementation Order

| Phase | Priority | Items |
|-------|----------|-------|
| 1 | Critical | Fix `useBlockState.ts` |
| 2 | Major | Settings components (11 blocks) |
| 3 | Major | Data fetching → `useQuery` |
| 4 | Major | State sync effects |
| 5 | Minor | `useMountEffect` conversions |
| 6 | Major | useState from prop + useReducer |
| 7 | Major | `dangerouslySetInnerHTML` sanitization |
| 8 | Medium | Split large components + useReducer |
| 9 | Medium | Accessibility fixes |
| 10 | Medium | Performance (passive listeners, stable keys) |
| 11 | Medium | Children as prop |
| 12 | Minor | Functional setState updates |
