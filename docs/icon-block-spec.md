# Icon Block Support — Specification

## Overview

Add icon support to the Nextpress Page Builder at two levels:
1. **Icon Block** — a standalone `core/icon` block for placing icons anywhere
2. **Button Icon** — icon slot within the existing `core/button` block (icon-only or icon+text)

Both share a unified **Icon Picker** component and a common **Icon Data Model**.

---

## Icon Sources

Support multiple icon libraries through a layered strategy:

### Tier 1 — react-icons (single dependency, many sets)

`react-icons` v5.4.0 is **already installed**. It bundles 30+ icon sets under prefix-based imports. Sets we expose in the picker:

| Prefix | Library               | Icons  | Notes                     |
|--------|-----------------------|--------|---------------------------|
| `lu`   | Lucide                | ~1,541 | Same SVGs as lucide-react |
| `tb`   | Tabler Icons          | ~5,963 | Stroke style              |
| `fa6`  | Font Awesome 6        | ~2,058 | Solid, regular, brands    |
| `hi2`  | Heroicons v2          | ~972   | By Tailwind Labs          |
| `ri`   | Remix Icon            | ~3,058 | Filled/outlined           |
| `pi`   | Phosphor Icons        | ~9,072 | Multiple weights          |
| `bs`   | Bootstrap Icons       | ~2,754 | Stroke style              |
| `io5`  | Ionicons 5            | ~1,332 | iOS/MD styles             |
| `rx`   | Radix Icons           | ~332   | Minimal, by WorkOS        |

**Why react-icons:** One dependency, tree-shakeable, unified API (`size`, `color`, `className`, `style`). No `strokeWidth` prop — use CSS `stroke-width` when needed.

### Tier 2 — lucide-react (already installed, richer API)

`lucide-react` v0.453.0 is already installed and used throughout the UI chrome. It supports `size`, `color`, `strokeWidth`, `absoluteStrokeWidth` natively. We keep it as the **default icon set** for the builder since it's already a dependency and has the richest prop API.

### Tier 3 — SVGL (brand/logo SVGs)

SVGL provides brand and logo SVGs (GitHub, Vercel, React, etc.) via shadcn/ui registry. These are **inline React components** downloaded to the project.

**Integration approach:**
- Add `@svgl` registry to `components.json`
- Curate a set of commonly used brand SVGs into `client/src/icons/svgl/`
- Expose them in the picker under a "Brands" category
- Store as `iconSet: "svgl"` with `iconName: "github"` etc.
- At render time, dynamically import from the local svgl directory

### Tier 4 — Hugeicons (optional, separate package)

`@hugeicons/react` + `@hugeicons/core-free-icons` — 5,100+ free icons. Wrapper-based API (`HugeiconsIcon icon={...} size={22}`). Not in react-icons. Can be added later as an optional dependency.

**Decision:** Not installing now. Can be added as a future tier without changing the architecture.

---

## Icon Data Model

A unified icon reference stored in block content:

```typescript
interface IconReference {
  /** Icon set identifier */
  iconSet: 'lucide' | 'react-icons' | 'svgl';

  /**
   * For lucide: icon name in kebab-case → "arrow-right", "search"
   * For react-icons: prefixed name → "lu:ArrowRight", "tb:IconSearch", "fa6:FaHouse"
   * For svgl: slug → "github", "react", "vercel"
   */
  iconName: string;

  /** Visual properties */
  size?: number;          // px, default 24
  color?: string;         // CSS color, default "currentColor"
  strokeWidth?: number;   // lucide/react-icons stroke weight, default 2
}
```

### Why not a generic "all icons from all sets" flat list?

react-icons alone has 40,000+ icons. Loading all names into a picker is impractical. Instead:
- Each icon set ships a **name index** (array of icon names) used for search/filter
- Icons are **dynamically imported** only when selected or rendered
- The picker shows a paginated/searchable grid, loading icon previews on demand

---

## Page-Level Icon Set Preference

### Storage

Add to `PageOther` in `shared/schema-types.ts`:

```typescript
export interface PageOther {
  seo?: PageSeoSettings;
  design?: PageDesignSettings;
  icons?: PageIconSettings;   // NEW
  [key: string]: unknown;
}

export interface PageIconSettings {
  /** Default icon set for new icon/button blocks on this page */
  defaultSet: 'lucide' | 'react-icons' | 'svgl' | 'all';

  /**
   * When defaultSet is 'react-icons', optionally restrict to specific prefixes.
   * Empty array or undefined = all react-icons sets.
   */
  allowedSets?: string[];  // e.g., ['lu', 'tb', 'fa6']

  /** Default icon size for new icons on this page */
  defaultSize?: number;  // px, default 24
}
```

### UI Location

New "Icons" section in Page Settings → Design tab (pages only):

```
┌─ Design Tab ──────────────────────────────────┐
│                                                │
│  Font Family:   [Inter           ▼]           │
│  Container Width: [1200px        ▼]           │
│  Padding:       [2rem 1rem            ]       │
│  ...                                           │
│                                                │
│  ── Icons ──────────────────────────────────  │
│  Default Icon Set: [Lucide          ▼]        │
│  Default Icon Size: [24         ] px          │
│  Allowed Sets:   [✓ Lucide] [✓ Tabler] ...   │
│                                                │
└────────────────────────────────────────────────┘
```

### How blocks read the preference

Blocks do NOT have direct access to page settings currently. Two options:

**Option A — Context Provider (recommended):**
- Create `PageContext` that wraps `BlockRenderer`
- Passes `pageOther` (including `icons`) to all child blocks
- Blocks consume via `usePageContext()` hook
- Clean, React-idiomatic, no prop drilling

**Option B — Block default injection:**
- When creating a new block, `getDefaultBlock()` reads page settings and pre-populates the block's icon reference
- Simpler but means blocks can't react to page setting changes after creation

**Decision: Option A** — Context Provider. Consistent with how page-level settings should propagate.

---

## Icon Block (`core/icon`)

### Block Definition

```typescript
const IconBlock: BlockDefinition = {
  id: 'core/icon',
  label: 'Icon',
  icon: Smile,          // lucide icon for block library
  description: 'Add an icon from various icon sets',
  category: 'basic',
  defaultContent: {
    kind: 'structured',
    data: {
      icon: {
        iconSet: 'lucide',
        iconName: 'star',
        size: 24,
        color: 'currentColor',
        strokeWidth: 2,
      },
      link: '',
      linkTarget: '_self',
      label: '',        // accessible label
    },
  },
  defaultStyles: {
    textAlign: 'center',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  component: IconBlockComponent,
  settings: IconSettings,
  hasSettings: true,
};
```

### Content Shape (stored in DB)

```json
{
  "kind": "structured",
  "data": {
    "icon": {
      "iconSet": "lucide",
      "iconName": "arrow-right",
      "size": 32,
      "color": "#007cba",
      "strokeWidth": 2
    },
    "link": "https://example.com",
    "linkTarget": "_blank",
    "label": "Go to example"
  }
}
```

### Settings Panel

```
┌─ Icon Settings ───────────────────────────────┐
│                                                │
│  [Content]                                     │
│  ┌─────────────────────────────────────────┐  │
│  │  🔍 Search icons...                     │  │
│  ├─────────────────────────────────────────┤  │
│  │ Icon Set: [Lucide         ▼]            │  │
│  │                                         │  │
│  │  ⭐  ❤️  🔍  ➡️  🏠  ⚙️  📧  🔒    │  │
│  │  [icon grid - paginated, 48px previews] │  │
│  │  ← 1 2 3 4 5 ... 32 →                  │  │
│  └─────────────────────────────────────────┘  │
│                                                │
│  [Appearance]                                  │
│  Size:    [24      ] px                        │
│  Color:   [■ #007cba]                          │
│  Stroke:  [2       ] (lucide only)             │
│                                                │
│  [Link] (optional)                             │
│  URL:     [                    ]               │
│  Target:  [Same Window ▼]                     │
│  Label:   [                    ] (a11y)        │
│                                                │
└────────────────────────────────────────────────┘
```

### Renderer (client-side)

```tsx
function IconBlockComponent({ value, onChange, isPreview }: BlockComponentProps) {
  const { content, styles } = useBlockState<IconContent>({
    value,
    getDefaultContent: () => DEFAULT_CONTENT,
    onChange,
  });

  const iconData = content?.data?.icon;
  const link = content?.data?.link;
  const linkTarget = content?.data?.linkTarget;
  const label = content?.data?.label;

  const iconElement = (
    <IconRenderer
      iconSet={iconData?.iconSet}
      iconName={iconData?.iconName}
      size={iconData?.size || 24}
      color={iconData?.color || 'currentColor'}
      strokeWidth={iconData?.strokeWidth || 2}
      style={styles}
      aria-label={label}
    />
  );

  if (link && !isPreview) {
    return (
      <a href={link} target={linkTarget} rel={linkTarget === '_blank' ? 'noopener noreferrer' : undefined}>
        {iconElement}
      </a>
    );
  }

  return iconElement;
}
```

### IconRenderer — Shared Component

A reusable component that resolves any icon reference to a rendered SVG:

```tsx
// client/src/components/PageBuilder/blocks/shared/IconRenderer.tsx

interface IconRendererProps {
  iconSet: string;
  iconName: string;
  size?: number;
  color?: string;
  strokeWidth?: number;
  className?: string;
  style?: React.CSSProperties;
  'aria-label'?: string;
}

function IconRenderer({ iconSet, iconName, size, color, strokeWidth, ...rest }: IconRendererProps) {
  switch (iconSet) {
    case 'lucide':
      return <LucideIcon name={iconName} size={size} color={color} strokeWidth={strokeWidth} {...rest} />;
    case 'react-icons':
      return <ReactIcon name={iconName} size={size} color={color} {...rest} />;
    case 'svgl':
      return <SvglIcon name={iconName} size={size} color={color} {...rest} />;
    default:
      return <PlaceholderIcon size={size} />;
  }
}
```

Each adapter handles dynamic import:

- **LucideIcon**: Uses `lucide-react`'s `dynamicIconImports` or a name→component map
- **ReactIcon**: Parses `"tb:IconSearch"` → dynamically imports from `react-icons/tb`, picks `IconSearch`
- **SvglIcon**: Dynamically imports from local `client/src/icons/svgl/` directory

---

## Button Icon Support

### Extended Button Content

Add icon fields to the existing button content (backward compatible):

```typescript
type ButtonContent = BlockContent & {
  url?: string;
  linkTarget?: '_self' | '_blank';
  rel?: string;
  title?: string;
  className?: string;
  // NEW — icon support
  icon?: IconReference;         // icon to display
  iconPosition?: 'left' | 'right';  // relative to text, default 'left'
  iconOnly?: boolean;           // hide text, show icon only
};
```

### Button Render Modes

1. **Text only** (current default) — no `icon` set
2. **Icon + text** — `icon` set, `iconOnly: false`, `iconPosition: 'left'|'right'`
3. **Icon only** — `icon` set, `iconOnly: true`, `title` used for tooltip/a11y

### Button Settings — New "Icon" Section

Add a collapsible "Icon" card to the Button settings panel:

```
┌─ Button Settings ─────────────────────────────┐
│                                                │
│  [Content]                                     │
│  Button Text: [Click Me           ]            │
│  Link URL:    [https://...         ]            │
│                                                │
│  [Icon]                                        │
│  Icon:  [⭐ Star  ✕]  ← pick or clear         │
│  Position: [● Left] [○ Right]                 │
│  Mode:     [● With Text] [○ Icon Only]        │
│                                                │
│  [Link Settings]                               │
│  Target: [Same Window] [New Window]            │
│                                                │
└────────────────────────────────────────────────┘
```

### Button SSR Rendering

```tsx
// In renderer/react/basic/index.tsx
export function ButtonBlock(props: BlockData) {
  const { content, link, target, icon, iconPosition, iconOnly, ... } = props;

  const iconEl = icon ? <IconRenderer {...icon} size={icon.size || 16} /> : null;
  const textEl = !iconOnly ? (content || '') : null;

  const inner = iconPosition === 'right'
    ? <>{textEl}{iconEl}</>
    : <>{iconEl}{textEl}</>;

  // ... wrap in <a> or <button> as before
}
```

---

## Icon Picker Component

A shared component used by both Icon block settings and Button icon settings.

### Architecture

```
client/src/components/PageBuilder/
  IconPicker/
    IconPicker.tsx          # Main picker dialog/popover
    IconSetSelector.tsx     # Dropdown to pick icon set
    IconGrid.tsx            # Paginated grid of icon previews
    IconSearch.tsx          # Search input with debouncing
    useIconSets.ts          # Hook to load icon name indexes
    index.ts                # Barrel export
```

### Icon Name Indexes

Each icon set needs a searchable list of icon names. These are static arrays generated at build time:

```
client/src/lib/icon-indexes/
  lucide.ts        # export const LUCIDE_ICONS = ['accessibility', 'activity', ...]
  react-icons.ts   # export const REACT_ICONS = { lu: ['ArrowRight', ...], tb: ['IconSearch', ...], fa6: [...] }
  svgl.ts          # export const SVGL_ICONS = ['github', 'react', 'vercel', ...]
```

### Picker UX Flow

1. User clicks "Pick Icon" → popover/dialog opens
2. Icon Set dropdown defaults to page-level preference (or "All")
3. Search filters icons by name within selected set(s)
4. Grid shows 48px icon previews, paginated (50 per page)
5. Click an icon → returns `IconReference`, closes picker
6. "Clear" button removes the icon

### Dynamic Icon Loading Strategy

Showing 40,000+ icons in a grid is expensive. Strategy:

1. **Name index is static** — ship icon name arrays, searchable instantly
2. **Previews load lazily** — only render visible icons in viewport (virtualized grid)
3. **Per-set chunking** — when "All" is selected, load one set at a time
4. **Debounced search** — 200ms debounce on search input
5. **Caching** — loaded icon components cached in memory

---

## SSR Renderer Changes

### New BlockData type (`renderer/react/block-types.ts`)

```typescript
interface IconConfig extends BaseBlockData {
  blockName: "core/icon";
  iconSet: string;
  iconName: string;
  iconSize?: number;
  iconColor?: string;
  iconStrokeWidth?: number;
  link?: string;
  linkTarget?: "_blank" | "_self";
  label?: string;
}
```

### Extended ButtonConfig (`renderer/react/block-types.ts`)

```typescript
interface ButtonConfig extends BaseBlockData {
  blockName: "core/button";
  content: string;
  link?: string;
  target?: "_blank" | "_self";
  variant?: "primary" | "secondary" | "outline";
  // NEW
  iconSet?: string;
  iconName?: string;
  iconSize?: number;
  iconColor?: string;
  iconPosition?: "left" | "right";
  iconOnly?: boolean;
}
```

### SSR Adaptation (`renderer/adapt-block-config.ts`)

Add `core/icon` case to `extractContentProps`:
```typescript
if (blockName === "core/icon") {
  const iconData = (content as any).data?.icon || {};
  return {
    iconSet: iconData.iconSet,
    iconName: iconData.iconName,
    iconSize: iconData.size,
    iconColor: iconData.color,
    iconStrokeWidth: iconData.strokeWidth,
    link: (content as any).data?.link,
    linkTarget: (content as any).data?.linkTarget,
    label: (content as any).data?.label,
  };
}
```

Extend existing `core/button` case to extract icon fields.

### SSR Icon Rendering

**Challenge:** SSR can't use dynamic imports easily. Two approaches:

**Option A — Pre-render as inline SVGs at build time:**
- For lucide: export all icons as inline SVG strings from a generated file
- For react-icons: same approach, generate SVG string maps
- For svgl: already inline SVGs

**Option B — Render as `<img>` or placeholder at SSR, hydrate on client:**
- SSR renders a sized placeholder div with the icon color
- Client hydrates with the actual icon component
- Simpler but causes layout shift

**Decision: Option A for lucide (primary set), Option B fallback for others.**
- Lucide ships raw SVG data via `lucide-react/dynamicIconImports` — we can build an SSR-compatible SVG renderer
- For react-icons sets, render placeholder at SSR, hydrate client-side
- For svgl, render inline SVG directly (already SVG components)

---

## File Change Summary

### New Files

| File | Purpose |
|------|---------|
| `client/src/components/PageBuilder/blocks/icon/IconBlock.tsx` | Icon block component, settings, definition |
| `client/src/components/PageBuilder/IconPicker/IconPicker.tsx` | Shared icon picker component |
| `client/src/components/PageBuilder/IconPicker/IconGrid.tsx` | Paginated icon grid |
| `client/src/components/PageBuilder/IconPicker/IconSetSelector.tsx` | Icon set dropdown |
| `client/src/components/PageBuilder/IconPicker/IconSearch.tsx` | Search input |
| `client/src/components/PageBuilder/IconPicker/useIconSets.ts` | Hook for icon indexes |
| `client/src/components/PageBuilder/IconPicker/index.ts` | Barrel export |
| `client/src/components/PageBuilder/blocks/shared/IconRenderer.tsx` | Shared icon renderer (client) |
| `client/src/lib/icon-indexes/lucide.ts` | Lucide icon name index |
| `client/src/lib/icon-indexes/react-icons.ts` | react-icons name index |
| `client/src/lib/icon-indexes/svgl.ts` | SVGL icon name index |
| `client/src/lib/icon-indexes/index.ts` | Barrel + types |
| `renderer/react/IconBlock.tsx` | SSR icon component |
| `renderer/react/ssr-icon-renderer.tsx` | SSR icon resolution |

### Modified Files

| File | Change |
|------|--------|
| `shared/schema-types.ts` | Add `PageIconSettings`, extend `PageOther` |
| `client/src/components/PageBuilder/blocks/index.ts` | Import + register `IconBlock` |
| `client/src/components/PageBuilder/blocks/button/ButtonBlock.tsx` | Add icon fields to content, settings UI, renderer |
| `client/src/components/PageBuilder/PageSettings.tsx` | Add "Icons" section to Design tab |
| `client/src/components/PageBuilder/BlockRenderer.tsx` | Wrap with `PageContext` provider |
| `renderer/react/block-types.ts` | Add `IconConfig`, extend `ButtonConfig` |
| `renderer/react/block-components.tsx` | Register `"core/icon"` SSR component |
| `renderer/react/advanced/index.tsx` | Add `IconBlock` SSR export |
| `renderer/adapt-block-config.ts` | Add `"core/icon"` extraction, extend `"core/button"` |
| `components.json` | Add `@svgl` registry |

---

## Implementation Order

1. **Icon indexes** — generate name arrays for lucide, react-icons, svgl
2. **IconRenderer** — shared client-side renderer component
3. **Icon block** — `core/icon` with settings panel and picker
4. **Register** — wire into block registry
5. **SSR types** — add `IconConfig`, extend `ButtonConfig`
6. **SSR renderer** — icon extraction + component
7. **Page settings** — `PageIconSettings` type + UI in Design tab
8. **PageContext** — provider so blocks can read page icon preference
9. **Button icon** — extend button block with icon support
10. **IconPicker** — full picker UI with search, pagination, set switching
11. **SVGL registry** — add to `components.json`, curate brand SVGs

---

## Open Questions

1. **Icon count limits:** Should we limit react-icons sets shown in picker (e.g., Phosphor has 9,072 icons)? Or paginate aggressively?
2. **Icon-only button sizing:** Icon-only buttons need sensible default size. Use icon size + padding, or fixed square?
3. **Animation:** Should icons support entry/hover/loop animations like other blocks? (Existing animation system supports this)
4. **Custom SVG upload:** Future feature? Users could upload their own SVGs as icons via the media library.
