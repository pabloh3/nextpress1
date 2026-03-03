# Tailwind Design Token System - Specification

## Overview

A design-token-first styling system for the PageBuilder. The editor UI presents curated design tokens derived from the project's Tailwind config via `resolveConfig` (colors, spacing, typography scales etc.) as the primary selection method - like a Figma design system. A "Custom" option is always available per property as an escape hatch.

At save/render time, token selections are **resolved to actual CSS values** (hex colors, rem/px values) using the same `resolveConfig` data. The stored blocks and rendered output contain **plain CSS only** - no Tailwind classes, no Tailwind runtime dependency on published pages.

```
Editor: User picks "Blue 500" from token swatch
  -> TokenEntry stores { value: "blue", variant: "500" }
  -> resolveConfig gives: theme.colors.blue.500 = "#3b82f6"
  -> Rendered output: style="background-color: #3b82f6"
```

---

## 1. Core Data Structures

### TokenEntry

```ts
interface TokenEntry {
  property: string;         // CSS property: "backgroundColor", "paddingTop", "fontSize"
  value: string;            // base token: "blue", "5", "lg" (empty string when custom)
  variant: string | null;   // shade/variant: "500", null
  alias: string;            // Tailwind prefix hint for UI: "bg", "pt", "text"
  modifier?: string;        // optional state/responsive: "hover", "md", "focus"
  other?: string;           // catch-all for values that don't fit the structured fields
  style?: string;           // custom raw value: "23", "#ff5500", "1.5" (set when user picks custom)
  unitCategory?: string;    // category for unit resolution: "spacing", "font", "dimension", "border"
}
```

### Block Storage (on `block.other`)

```ts
other?: {
  tokenMap?: Record<string, TokenEntry>;  // keyed by property name (or modifier:property for modifier entries)
  units?: Record<string, string>;         // current unit selection per category: { spacing: "px", font: "rem" }
  css?: string;                           // existing: user custom CSS
  js?: string;                            // existing
  html?: string;                          // existing
  attributes?: Record<string, any>;       // existing
  metadata?: Record<string, any>;         // existing
}
```

---

## 2. Token vs Custom Mode Per Entry

| Mode | `value` | `variant` | `style` | Result |
|---|---|---|---|---|
| **Token** | `"blue"` | `"500"` | `undefined` | Resolved via `fullConfig.theme.colors.blue[500]` -> `"#3b82f6"` -> inline style |
| **Custom** | `""` | `null` | `"#ff5500"` | Uses `style` directly -> inline style |
| **Token + modifier** | `"blue"` | `"700"` | `undefined` | Resolved to CSS value, wrapped in CSS rule (e.g., `.block-id:hover { ... }`) |
| **Other (non-standard)** | `""` | `null` | `undefined` | Uses `other` field directly as a raw CSS value |

Both can't be active simultaneously on the same entry - it's one or the other (token or custom).

### tokenMap Key Convention

- Base entries: keyed by CSS property name -> `"backgroundColor"`, `"paddingTop"`, `"color"`
- Modifier entries: keyed by `modifier:property` -> `"hover:backgroundColor"`, `"md:paddingTop"`
- This ensures uniqueness (a block can have both a base `backgroundColor` and a `hover:backgroundColor`)

### Token Value Resolution

Resolves a token entry to an actual CSS value using the Tailwind resolved config:

```ts
import resolveConfig from 'tailwindcss/resolveConfig'
import tailwindConfig from '../../../tailwind.config'

const fullConfig = resolveConfig(tailwindConfig)

/**
 * Resolves a token entry's value/variant to an actual CSS value
 * using the Tailwind resolved config theme data.
 */
function resolveTokenValue(entry: TokenEntry): string | null {
  if (!entry.value) return null;

  const { property, value, variant } = entry;

  // Color properties -> look up in theme.colors
  if (property === "backgroundColor" || property === "color" || property === "borderColor") {
    const colorGroup = fullConfig.theme.colors[value];
    if (typeof colorGroup === "string") return colorGroup;          // "white" -> "#ffffff"
    if (colorGroup && variant) return colorGroup[variant] ?? null;  // blue[500] -> "#3b82f6"
    return null;
  }

  // Spacing properties -> look up in theme.spacing
  if (entry.unitCategory === "spacing") {
    return fullConfig.theme.spacing[value] ?? null;  // "5" -> "1.25rem"
  }

  // Font size -> look up in theme.fontSize
  if (property === "fontSize") {
    const fs = fullConfig.theme.fontSize[value];
    if (typeof fs === "string") return fs;
    if (Array.isArray(fs)) return fs[0];  // fontSize entries can be [size, { lineHeight }]
    return null;
  }

  // Font weight -> look up in theme.fontWeight
  if (property === "fontWeight") {
    return fullConfig.theme.fontWeight[value] ?? null;
  }

  // Border radius -> look up in theme.borderRadius
  if (property === "borderRadius") {
    return fullConfig.theme.borderRadius[value] ?? null;
  }

  return null;
}
```

### Custom Value Composition

```ts
/**
 * Composes a custom (non-token) entry's value with its unit category.
 */
function composeCustomValue(entry: TokenEntry, units: Record<string, string>): string | null {
  if (!entry.style) return null;

  // If entry has a unitCategory, append the active unit for that category
  if (entry.unitCategory && units[entry.unitCategory]) {
    return `${entry.style}${units[entry.unitCategory]}`;  // "23" + "px" = "23px"
  }

  // No unit needed (colors, etc.) - use style directly
  return entry.style;  // "#ff5500"
}
```

### Full tokenMap Resolution

```ts
/**
 * Resolves a full tokenMap into a plain CSS inline style object.
 * Base entries (no modifier) become inline styles.
 * Modifier entries are returned separately for CSS rule generation.
 */
function resolveTokenMap(
  tokenMap: Record<string, TokenEntry>,
  units: Record<string, string>
): {
  style: React.CSSProperties;
  modifierEntries: Array<{ entry: TokenEntry; resolvedValue: string }>;
} {
  const inlineStyle: Record<string, string> = {};
  const modifierEntries: Array<{ entry: TokenEntry; resolvedValue: string }> = [];

  for (const entry of Object.values(tokenMap)) {
    // Resolve the CSS value (from token or custom)
    const resolvedValue = entry.value
      ? resolveTokenValue(entry)
      : composeCustomValue(entry, units);

    if (!resolvedValue) continue;

    if (entry.modifier) {
      // Modifier entries get collected for CSS rule generation
      modifierEntries.push({ entry, resolvedValue });
    } else {
      // Base entries go directly to inline style
      inlineStyle[entry.property] = resolvedValue;
    }
  }

  return {
    style: inlineStyle as React.CSSProperties,
    modifierEntries,
  };
}
```

---

## 3. Unit System

Units are managed **per category**, not per property. All properties in the same category share a single unit selection.

### Unit Categories (static definition in `tailwind-tokens.ts`)

```ts
const unitCategories: Record<string, string[]> = {
  spacing:   ["px", "rem", "em", "%"],
  font:      ["px", "rem", "em"],
  dimension: ["px", "rem", "%", "vw", "vh"],
  border:    ["px", "rem", "%"],
};
```

### Stored on `block.other.units`

One active selection per category (not the full array):

```ts
units: {
  spacing: "px",       // user's current selection from ["px", "rem", "em", "%"]
  font: "rem",         // user's current selection from ["px", "rem", "em"]
  dimension: "%",      // user's current selection from ["px", "rem", "%", "vw", "vh"]
  border: "px",        // user's current selection from ["px", "rem", "%"]
}
```

### Property-to-UnitCategory Mapping

```ts
const propertyUnitCategoryMap: Record<string, string> = {
  paddingTop: "spacing",
  paddingRight: "spacing",
  paddingBottom: "spacing",
  paddingLeft: "spacing",
  marginTop: "spacing",
  marginRight: "spacing",
  marginBottom: "spacing",
  marginLeft: "spacing",
  gap: "spacing",
  fontSize: "font",
  lineHeight: "font",
  width: "dimension",
  height: "dimension",
  borderRadius: "border",
  // colors: not in this map (no unit needed)
};
```

The sidebar shows one unit selector per category section - not per individual property.

---

## 4. Token Data Source (`client/src/lib/tailwind-tokens.ts`)

Token data is **not hardcoded**. It is derived from the project's Tailwind config via `resolveConfig`, which merges the custom config with Tailwind's defaults, giving a complete map of all design tokens.

### Setup

```ts
import resolveConfig from 'tailwindcss/resolveConfig'
import tailwindConfig from '../../../tailwind.config'

const fullConfig = resolveConfig(tailwindConfig)

/** All color families with hex values, for swatch UI rendering */
export const tokenColors = fullConfig.theme.colors
// e.g. { slate: { 50: "#f8fafc", 100: "#f1f5f9", ..., 950: "#020617" }, blue: { ... }, ... }
// Plus special: white, black, transparent, current, inherit

/** Full spacing scale with resolved rem values */
export const tokenSpacing = fullConfig.theme.spacing
// e.g. { 0: "0px", 0.5: "0.125rem", 1: "0.25rem", ..., 96: "24rem" }

/** Font size scale */
export const tokenFontSize = fullConfig.theme.fontSize
// e.g. { xs: ["0.75rem", { lineHeight: "1rem" }], sm: ["0.875rem", ...], ... }

/** Responsive breakpoints (for modifier CSS generation) */
export const tokenScreens = fullConfig.theme.screens
// e.g. { sm: "640px", md: "768px", lg: "1024px", xl: "1280px", "2xl": "1536px" }
```

### Benefits of resolveConfig

- **Single source of truth**: If the project customizes `tailwind.config.ts` (adds brand colors, adjusts spacing scale), the editor token pickers automatically reflect those changes.
- **Hex values for free**: Color swatches get actual hex values directly (e.g., `colors.blue[500] = "#3b82f6"`) - no separate lookup table needed.
- **Expandable**: When adding typography, borders, shadows (Phase 2+), just read `fullConfig.theme.fontSize`, `fullConfig.theme.borderRadius`, etc.
- **Editor-only dependency**: `resolveConfig` only runs in the editor bundle, not on published pages.

### Property-to-Alias Mapping (project-specific, not from Tailwind)

Used by the UI to know which Tailwind token category a CSS property maps to:

```ts
export const propertyAliasMap: Record<string, string> = {
  backgroundColor: "bg",
  color: "text",
  paddingTop: "pt",
  paddingRight: "pr",
  paddingBottom: "pb",
  paddingLeft: "pl",
  marginTop: "mt",
  marginRight: "mr",
  marginBottom: "mb",
  marginLeft: "ml",
  fontSize: "text",
  fontWeight: "font",
  lineHeight: "leading",
  width: "w",
  height: "h",
  borderRadius: "rounded",
  borderColor: "border",
  gap: "gap",
};
```

---

## 5. Modifier CSS Generation

Modifier entries (hover, focus, responsive breakpoints) cannot be inline styles. They are resolved to **actual CSS rules** and injected as `<style>` blocks - no Tailwind runtime needed.

### State Modifier Map

```ts
/** Maps modifier names to CSS pseudo-selectors */
const stateModifierMap: Record<string, string> = {
  hover: ":hover",
  focus: ":focus",
  active: ":active",
  "focus-within": ":focus-within",
  "focus-visible": ":focus-visible",
  disabled: ":disabled",
  first: ":first-child",
  last: ":last-child",
};
```

### Modifier Resolution

```ts
/**
 * Converts camelCase CSS property to kebab-case for use in CSS rules.
 * e.g., "backgroundColor" -> "background-color"
 */
function camelToKebab(str: string): string {
  return str.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`);
}

/**
 * Generates a CSS rule for a modifier entry.
 * State modifiers produce pseudo-selector rules.
 * Responsive modifiers produce @media query rules.
 */
function resolveModifierEntry(
  blockId: string,
  entry: TokenEntry,
  resolvedValue: string
): string {
  if (!entry.modifier) return "";

  const cssProp = camelToKebab(entry.property);
  const selector = `.block-${blockId}`;

  // State modifier: hover, focus, active, etc.
  if (stateModifierMap[entry.modifier]) {
    const pseudo = stateModifierMap[entry.modifier];
    return `${selector}${pseudo} { ${cssProp}: ${resolvedValue}; }`;
    // e.g., ".block-abc:hover { background-color: #3b82f6; }"
  }

  // Responsive modifier: sm, md, lg, xl, 2xl
  const breakpoint = tokenScreens[entry.modifier];
  if (breakpoint) {
    return `@media (min-width: ${breakpoint}) { ${selector} { ${cssProp}: ${resolvedValue}; } }`;
    // e.g., "@media (min-width: 768px) { .block-abc { padding-top: 1.25rem; } }"
  }

  return "";
}
```

### Collecting CSS Rules Per Page

```ts
/**
 * Generates all modifier CSS rules for a block.
 * Called during render for each block that has modifier entries.
 */
function generateBlockModifierCSS(
  blockId: string,
  modifierEntries: Array<{ entry: TokenEntry; resolvedValue: string }>
): string {
  return modifierEntries
    .map(({ entry, resolvedValue }) => resolveModifierEntry(blockId, entry, resolvedValue))
    .filter(Boolean)
    .join("\n");
}
```

All modifier CSS rules are collected across all blocks on the page and injected as a single `<style>` block in the document head (same pattern the SSR already uses for `customCss` / `other.css`).

---

## 6. UI Components (Phase 1)

### TokenColorPicker

- Renders a grid of color swatches from `fullConfig.theme.colors`, organized by color family (rows) and shade (columns)
- Each swatch shows the actual hex color (available directly from resolveConfig)
- Current token selection is highlighted
- "Custom" toggle at the bottom switches to a hex color input
- Props: `property`, `currentEntry: TokenEntry | undefined`, `onChange: (entry: TokenEntry) => void`

### TokenSpacingPicker

- Renders a row/grid of spacing scale values from `fullConfig.theme.spacing` as selectable chips
- Each chip shows the token key and resolved rem/px value
- Current token selection is highlighted
- "Custom" toggle switches to a numeric input
- Unit selector is one per category, shown at the section level (not per side)
- Props: `property`, `currentEntry: TokenEntry | undefined`, `unitCategory`, `currentUnit`, `onUnitChange`, `onChange`

---

## 7. Render Pipeline

```
tokenMap entry
  |
  |-- base entry (no modifier)
  |     |-- token mode: resolve value via fullConfig.theme -> inline style
  |     |-- custom mode: compose style + unit -> inline style
  |
  |-- modifier entry (hover, md, etc.)
  |     |-- resolve value (token or custom, same as base)
  |     |-- generate CSS rule with pseudo-selector or @media query
  |     |-- collect into <style> block for the page
  |
  |-- other entry
        |-- use other field directly as CSS value -> inline style
```

### At render time (BlockRenderer / SSR adapter):

1. Check if `block.other?.tokenMap` exists and has entries
2. If yes: call `resolveTokenMap(tokenMap, units)` to get `{ style, modifierEntries }`
3. Merge `style` with any remaining `block.styles` properties not covered by tokenMap entries (fallback for legacy/untouched properties)
4. For `modifierEntries`: call `generateBlockModifierCSS(blockId, modifierEntries)` and collect the CSS rules
5. Apply merged `style={}` to the element, add `class="block-{id}"` for modifier CSS targeting
6. Inject all collected modifier CSS as a `<style>` block in the page
7. If no tokenMap: fall back entirely to `block.styles` (existing behavior, backward compat)

### Rendering Paths

| Path | style source | Modifier CSS | Tailwind dependency |
|---|---|---|---|
| **Editor canvas** | Resolved from tokenMap via `resolveConfig` | Injected `<style>` in editor document head | Editor-only (build time, for resolveConfig) |
| **Client public view** | Same BlockRenderer with `isPreview=true` | Same | Same (editor bundle only) |
| **SSR** | Resolved in `adapt-block-config.ts` via `resolveConfig` | Collected and injected in `<head>` of SSR template | Build-time only, **zero runtime dependency** |

**Published pages have zero Tailwind dependency.** Output is plain inline CSS + generated `<style>` rules.

---

## 8. Files to Create

| File | Purpose | ~LOC |
|---|---|---|
| `client/src/lib/tailwind-tokens.ts` | resolveConfig setup, token accessors, resolution utilities, modifier CSS generation | ~80 |
| `client/src/components/PageBuilder/TokenColorPicker.tsx` | Color swatch grid with custom fallback | ~120 |
| `client/src/components/PageBuilder/TokenSpacingPicker.tsx` | Spacing scale selector with custom fallback | ~80 |

## 9. Files to Modify

| File | Change |
|---|---|
| `shared/schema-types.ts` | Add `TokenEntry` interface. Add `tokenMap`, `units` to `other` on `BlockConfig` |
| `client/src/components/PageBuilder/BlockSettings.tsx` | Replace color inputs with `TokenColorPicker`, spacing inputs with `TokenSpacingPicker`. Update style update logic to write to `tokenMap` |
| `client/src/components/PageBuilder/BlockRenderer.tsx` | Walk `tokenMap` at render to resolve inline `style` + collect modifier CSS. Apply `class="block-{id}"` for modifier targeting. Inject modifier `<style>` |
| `client/src/components/PageBuilder/blocks/index.ts` | Update `getDefaultBlock` to set initial token defaults and default `units` |
| `renderer/adapt-block-config.ts` | Walk `tokenMap` to resolve `style` and generate modifier CSS when adapting to `BlockData` |
| `renderer/templates/page.ts` | Ensure modifier CSS rules are injected in `headScripts` (uses existing injection point, no new dependencies) |
| Individual block renderers (client + SSR) | Ensure `style` and `className` (for `block-{id}`) props are applied on root elements |

---

## 10. Backward Compatibility

- Existing pages have no `tokenMap`. They continue working as-is via `block.styles` (inline styles).
- The sidebar detects: if no `tokenMap` entry exists for a property but `block.styles[property]` has a value, it shows "Custom" as active with that value pre-filled.
- No migration script needed. Old pages work unchanged. New edits can introduce tokens incrementally.

### Relationship Between `block.styles` and `tokenMap`

`block.styles` is the legacy field. `tokenMap` is the new source of truth. They coexist during transition:

- **Renderer priority**: If `tokenMap` exists and has entries, it is used. `block.styles` is used as fallback for any properties not covered by `tokenMap`.
- **Sidebar behavior**: When opening a legacy block (has `block.styles`, no `tokenMap`), the sidebar reads from `block.styles` and shows "Custom" mode with those values. As soon as the user makes any style change, a `tokenMap` entry is created for that property.
- **No wholesale migration**: We do NOT convert all `block.styles` properties to `tokenMap` on open. Only the property the user actively edits gets a `tokenMap` entry. The rest stay on `block.styles` and continue rendering via fallback.
- **Save behavior**: On save, both `block.styles` (legacy) and `other.tokenMap` are persisted. The renderer handles both.

---

## 11. Phase 1 Scope

### In scope

- `TokenEntry` type and `tokenMap`/`units` storage on block data
- `tailwind-tokens.ts` with resolveConfig setup, token accessors, resolution utilities
- `TokenColorPicker` (text color, background color)
- `TokenSpacingPicker` (padding 4 sides, margin 4 sides)
- `BlockSettings.tsx` integration for colors and spacing sections
- `BlockRenderer.tsx` tokenMap -> resolved inline style
- SSR adapter tokenMap resolution
- Default block token values
- Modifier CSS generation functions (infrastructure ready, used for hover/responsive when entries exist)

### Out of scope (future phases)

- Typography tokens (font-size, font-weight, line-height)
- Layout tokens (display, flex, grid)
- Border/shadow tokens
- Responsive modifier UI in the sidebar (`md:`, `lg:` pickers)
- Hover/focus modifier UI in the sidebar
- `other.css` custom CSS textarea integration with token system

---

## 12. Examples

### Token-based block (new default)

```ts
{
  id: "block_abc",
  name: "core/heading",
  type: "block",
  content: { kind: "text", value: "Hello", level: 2 },
  other: {
    tokenMap: {
      backgroundColor: {
        property: "backgroundColor",
        value: "white",
        variant: null,
        alias: "bg",
      },
      color: {
        property: "color",
        value: "gray",
        variant: "900",
        alias: "text",
      },
      paddingTop: {
        property: "paddingTop",
        value: "5",
        variant: null,
        alias: "pt",
        unitCategory: "spacing"
      },
      paddingBottom: {
        property: "paddingBottom",
        value: "5",
        variant: null,
        alias: "pb",
        unitCategory: "spacing"
      },
      paddingLeft: {
        property: "paddingLeft",
        value: "5",
        variant: null,
        alias: "pl",
        unitCategory: "spacing"
      },
      paddingRight: {
        property: "paddingRight",
        value: "5",
        variant: null,
        alias: "pr",
        unitCategory: "spacing"
      }
    },
    units: {
      spacing: "px"
    }
  }
}
// Resolved inline style: {
//   backgroundColor: "#ffffff",    (from theme.colors.white)
//   color: "#111827",              (from theme.colors.gray[900])
//   paddingTop: "1.25rem",         (from theme.spacing[5])
//   paddingBottom: "1.25rem",
//   paddingLeft: "1.25rem",
//   paddingRight: "1.25rem"
// }
// Modifier CSS: (none)
```

### Mixed block (token + custom)

```ts
{
  id: "block_xyz",
  name: "core/paragraph",
  other: {
    tokenMap: {
      color: {
        property: "color",
        value: "blue",
        variant: "600",
        alias: "text",
      },
      backgroundColor: {
        property: "backgroundColor",
        value: "",
        variant: null,
        alias: "bg",
        style: "#f0e6d3",    // custom color - used directly
      },
      paddingTop: {
        property: "paddingTop",
        value: "",
        variant: null,
        alias: "pt",
        style: "23",          // custom value
        unitCategory: "spacing"
      },
      paddingBottom: {
        property: "paddingBottom",
        value: "4",
        variant: null,
        alias: "pb",
        unitCategory: "spacing"
      }
    },
    units: {
      spacing: "px"
    }
  }
}
// Resolved inline style: {
//   color: "#2563eb",              (from theme.colors.blue[600])
//   backgroundColor: "#f0e6d3",   (custom, used directly)
//   paddingTop: "23px",            (custom "23" + units.spacing "px")
//   paddingBottom: "1rem"          (from theme.spacing[4])
// }
// Modifier CSS: (none)
```

### Block with modifier entries

```ts
{
  id: "block_btn",
  name: "core/button",
  other: {
    tokenMap: {
      backgroundColor: {
        property: "backgroundColor",
        value: "blue",
        variant: "500",
        alias: "bg",
      },
      "hover:backgroundColor": {
        property: "backgroundColor",
        value: "blue",
        variant: "700",
        alias: "bg",
        modifier: "hover",
      },
      "md:paddingTop": {
        property: "paddingTop",
        value: "8",
        variant: null,
        alias: "pt",
        modifier: "md",
        unitCategory: "spacing"
      }
    },
    units: {
      spacing: "px"
    }
  }
}
// Resolved inline style: {
//   backgroundColor: "#3b82f6",    (from theme.colors.blue[500])
// }
// Modifier CSS (injected as <style>):
//   .block-block_btn:hover { background-color: #1d4ed8; }
//   @media (min-width: 768px) { .block-block_btn { padding-top: 2rem; } }
```

### Legacy block (no tokenMap, backward compatible)

```ts
{
  id: "block_old",
  name: "core/heading",
  styles: {
    padding: "20px",
    margin: "0px",
    color: "#333333",
    backgroundColor: "#ffffff"
  }
  // no other.tokenMap - sidebar shows "Custom" with existing values
}
// Resolved inline style: { padding: "20px", margin: "0px", color: "#333333", backgroundColor: "#ffffff" }
// (falls back to block.styles directly)
```

---

## 13. Edge Cases and Special Values

### Special Color Tokens

Some Tailwind colors are single values (not shade objects). `resolveConfig` handles these naturally:

| Token | `theme.colors` value | resolved |
|---|---|---|
| `transparent` | `"transparent"` | `"transparent"` |
| `white` | `"#fff"` | `"#fff"` |
| `black` | `"#000"` | `"#000"` |
| `current` | `"currentColor"` | `"currentColor"` |
| `inherit` | `"inherit"` | `"inherit"` |

These are stored with `variant: null`. `resolveTokenValue` detects that `colorGroup` is a string (not an object) and returns it directly.

### Shorthand vs Longhand Spacing

The current system stores shorthand `padding: "20px"` on some blocks and longhand `paddingTop: "20px"` on others. The tokenMap always uses **longhand** (individual sides). When reading legacy `block.styles.padding` shorthand for sidebar display, parse it into individual sides.

### Empty/Undefined tokenMap Entries

- If a tokenMap entry has both `value: ""` and `style: undefined` -> it produces nothing (no resolved value). This is equivalent to "cleared/removed".
- The UI should remove such entries from tokenMap rather than leaving empty shells.

### Project Custom Colors

The project's `tailwind.config.ts` extends colors with CSS variable-based values (shadcn/ui pattern, e.g., `primary: "var(--primary)"`). These appear in `resolveConfig` output alongside Tailwind defaults. The token picker UI can display both - default Tailwind colors (with hex previews) and project custom colors (with variable-based values). Custom/variable colors may not render a hex preview swatch since their resolved value depends on runtime CSS variables.
