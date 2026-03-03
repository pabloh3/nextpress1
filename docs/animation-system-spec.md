# Animation System - Specification

## Overview

A predefined animation preset system for the PageBuilder. Users select from curated animation presets in the editor sidebar, see a live preview on the canvas, and on save/render the animation is applied via generated CSS rules and minimal JS (for scroll-triggered entry animations only).

Three animation categories, **one animation per category per block**:

| Category | Trigger | Tech | Example |
|---|---|---|---|
| **Entry** | Scroll into viewport | AOS + Animate.css keyframes | fadeInUp on scroll |
| **Hover** | Mouse hover | CSS `:hover` rule + Animate.css keyframes | pulse on hover |
| **Loop** | Immediate, continuous | CSS rule + Animate.css keyframes `infinite` | heartBeat loop |

All three categories use **Animate.css keyframes** as the animation source. Only entry animations require AOS (JS library for scroll detection). Hover and loop are pure CSS — zero JS on published pages.

**Relationship to token system**: This spec is a companion to `docs/tailwind-token-system-spec.md`. Both systems write to `block.other` and share the same render pipeline (generated CSS rules injected via `headScripts`, attributes flowing through `adapt-block-config.ts`). Animation CSS rules are collected alongside token modifier CSS rules into the same `<style>` block.

---

## 1. Data Structure

Stored on `block.other.animation`:

```ts
interface EntryAnimation {
  name: string;        // Animate.css name: "fadeInUp", "bounceIn", "zoomIn"
  duration?: number;   // ms (default: 1000)
  delay?: number;      // ms (default: 0)
  once?: boolean;      // Play once only? (default: true)
}

interface HoverAnimation {
  name: string;        // Animate.css name: "pulse", "rubberBand", "tada"
}

interface LoopAnimation {
  name: string;        // Animate.css name: "bounce", "heartBeat", "swing"
}

interface BlockAnimation {
  entry?: EntryAnimation;
  hover?: HoverAnimation;
  loop?: LoopAnimation;
}
```

### On `block.other`

```ts
other?: {
  // ... existing fields
  css?: string;
  classNames?: string;
  js?: string;
  html?: string;
  attributes?: Record<string, any>;
  metadata?: Record<string, any>;
  // Token system (Part 1)
  tokenMap?: Record<string, TokenEntry>;
  units?: Record<string, string>;
  // Animation system (Part 2)
  animation?: BlockAnimation;
}
```

### Design Decisions

- One animation per category max. No stacking.
- `entry` has AOS-specific options (duration, delay, once) because scroll-triggered animations benefit from per-block timing control.
- `hover` and `loop` are name-only. Duration/easing use Animate.css defaults (1s). Can be extended later if needed.
- Setting any category to `undefined` / removing it means "no animation for that category".
- All three categories can coexist on the same block (e.g., entry fade-in + hover pulse + loop heartBeat).

---

## 2. Animation Preset Registry

A curated subset of Animate.css animations organized by category. Not the full library — only animations that make sense in a page builder context.

### File: `client/src/lib/animation-presets.ts`

```ts
interface AnimationPreset {
  name: string;       // Animate.css class name (without animate__ prefix)
  label: string;      // Human-readable label for sidebar UI
}

/** Entry presets — scroll-triggered entrance animations */
const entryPresets: AnimationPreset[] = [
  // Fades
  { name: "fadeIn", label: "Fade In" },
  { name: "fadeInUp", label: "Fade In Up" },
  { name: "fadeInDown", label: "Fade In Down" },
  { name: "fadeInLeft", label: "Fade In Left" },
  { name: "fadeInRight", label: "Fade In Right" },
  // Bounces
  { name: "bounceIn", label: "Bounce In" },
  { name: "bounceInUp", label: "Bounce In Up" },
  { name: "bounceInDown", label: "Bounce In Down" },
  { name: "bounceInLeft", label: "Bounce In Left" },
  { name: "bounceInRight", label: "Bounce In Right" },
  // Zooms
  { name: "zoomIn", label: "Zoom In" },
  { name: "zoomInUp", label: "Zoom In Up" },
  { name: "zoomInDown", label: "Zoom In Down" },
  // Slides
  { name: "slideInUp", label: "Slide In Up" },
  { name: "slideInDown", label: "Slide In Down" },
  { name: "slideInLeft", label: "Slide In Left" },
  { name: "slideInRight", label: "Slide In Right" },
  // Flips
  { name: "flipInX", label: "Flip In X" },
  { name: "flipInY", label: "Flip In Y" },
  // Rotates
  { name: "rotateIn", label: "Rotate In" },
  // Specials
  { name: "jackInTheBox", label: "Jack In The Box" },
  { name: "rollIn", label: "Roll In" },
  // Light speed
  { name: "lightSpeedInRight", label: "Light Speed Right" },
  { name: "lightSpeedInLeft", label: "Light Speed Left" },
  // Back entrances
  { name: "backInUp", label: "Back In Up" },
  { name: "backInDown", label: "Back In Down" },
  { name: "backInLeft", label: "Back In Left" },
  { name: "backInRight", label: "Back In Right" },
];

/** Hover presets — attention seekers that play on mouse hover */
const hoverPresets: AnimationPreset[] = [
  { name: "pulse", label: "Pulse" },
  { name: "rubberBand", label: "Rubber Band" },
  { name: "tada", label: "Tada" },
  { name: "wobble", label: "Wobble" },
  { name: "jello", label: "Jello" },
  { name: "headShake", label: "Head Shake" },
  { name: "swing", label: "Swing" },
  { name: "bounce", label: "Bounce" },
  { name: "flash", label: "Flash" },
  { name: "shakeX", label: "Shake X" },
  { name: "shakeY", label: "Shake Y" },
  { name: "heartBeat", label: "Heart Beat" },
  { name: "flip", label: "Flip" },
];

/** Loop presets — continuous/repeating attention animations */
const loopPresets: AnimationPreset[] = [
  { name: "pulse", label: "Pulse" },
  { name: "bounce", label: "Bounce" },
  { name: "flash", label: "Flash" },
  { name: "heartBeat", label: "Heart Beat" },
  { name: "swing", label: "Swing" },
  { name: "tada", label: "Tada" },
  { name: "wobble", label: "Wobble" },
  { name: "jello", label: "Jello" },
  { name: "rubberBand", label: "Rubber Band" },
  { name: "shakeX", label: "Shake X" },
  { name: "shakeY", label: "Shake Y" },
];
```

Hover and loop lists overlap (both draw from Animate.css "attention seekers") but are separate arrays so they can diverge independently.

---

## 3. How Each Category Works

### 3a. Entry Animations (AOS + Animate.css)

AOS detects when a block scrolls into the viewport and applies the animation class. We configure AOS to integrate with Animate.css using `useClassNames: true` and `animatedClassName: 'animate__animated'`.

**Block attributes (rendered HTML)**:

```html
<div
  data-aos="animate__fadeInUp"
  data-aos-duration="1000"
  data-aos-delay="200"
  data-aos-once="true"
  class="block-abc123"
>
  ...content...
</div>
```

**How `data-aos-*` attributes are generated**: The `animation.entry` config on `block.other` is translated to `block.other.attributes` during the adapt/render step:

```ts
// In adapt-block-config.ts (or helper called from it)
if (block.other?.animation?.entry) {
  const { name, duration = 1000, delay = 0, once = true } = block.other.animation.entry;
  attributes["data-aos"] = `animate__${name}`;
  attributes["data-aos-duration"] = String(duration);
  if (delay > 0) {
    attributes["data-aos-delay"] = String(delay);
  }
  attributes["data-aos-once"] = String(once);
}
```

These attributes flow through the existing `block.other.attributes` -> `adapt-block-config.ts` -> `BlockData.attributes` -> rendered HTML pipeline. No new plumbing needed.

**Editor preview**: Temporarily add `animate__animated animate__fadeInUp` classes to the block element in the editor canvas. Remove classes after `animationend` event fires. Triggered via a "Preview" button or on preset selection.

**AOS visibility**: AOS hides elements before they animate in. For editor, we do NOT use AOS — just direct class application. AOS only runs on published pages.

### 3b. Hover Animations (Pure CSS)

Generated as a CSS rule using the Animate.css `@keyframes` name directly. No utility classes on the element, no JS.

**Generated CSS rule**:

```css
.block-abc123:hover {
  animation: pulse 1s both;
}
```

This references the `@keyframes pulse` declaration that exists in the Animate.css stylesheet. The browser resolves it at runtime.

**Generation logic**:

```ts
/**
 * Generates CSS rule for a hover animation.
 * Uses the Animate.css keyframe name directly in a :hover rule.
 */
function generateHoverAnimationCSS(blockId: string, hover: HoverAnimation): string {
  return `.block-${blockId}:hover { animation: ${hover.name} 1s both; }`;
}
```

**Editor preview**: On hover over the block in the editor canvas, temporarily add `animate__animated animate__${name}` classes. Listen for `animationend` to remove them.

### 3c. Loop/Attention Animations (Pure CSS)

Generated as a CSS rule with `infinite` iteration. Same approach as hover — uses keyframe name directly.

**Generated CSS rule**:

```css
.block-abc123 {
  animation: heartBeat 1s infinite both;
}
```

**Generation logic**:

```ts
/**
 * Generates CSS rule for a loop/continuous animation.
 * Uses the Animate.css keyframe name with infinite iteration.
 */
function generateLoopAnimationCSS(blockId: string, loop: LoopAnimation): string {
  return `.block-${blockId} { animation: ${loop.name} 1s infinite both; }`;
}
```

**Editor preview**: Add `animate__animated animate__infinite animate__${name}` classes to the block. Remove on deselection or when animation is cleared.

**Loop + Entry coexistence**: If a block has both a loop and entry animation, the loop CSS rule is scoped to `.aos-animate` so it only activates after AOS triggers the entry:

```css
/* Block with both entry + loop */
.block-abc123.aos-animate {
  animation: heartBeat 1s infinite both;
}

/* Block with loop only (no entry) */
.block-abc123 {
  animation: heartBeat 1s infinite both;
}
```

---

## 4. Dependencies & Delivery

Self-hosted vendor files. Conditional injection — only loaded when the page actually uses animations.

### Vendor Files

| File | Source | Size (~minified) |
|---|---|---|
| `public/vendor/animate.min.css` | `animate.css` npm package v4.1.1 | ~80KB |
| `public/vendor/aos.css` | `aos` npm package v2.3.4 | ~3KB |
| `public/vendor/aos.js` | `aos` npm package v2.3.4 | ~14KB |

### Conditional Injection in `render.routes.ts`

```ts
const hasAnimations = blocks.some(b => b.other?.animation);
const hasEntryAnimations = blocks.some(b => b.other?.animation?.entry);

let animationHead = "";
let animationBody = "";

// Animate.css keyframes — needed by all animation categories
if (hasAnimations) {
  animationHead += `<link rel="stylesheet" href="/vendor/animate.min.css">`;
}

// AOS — only needed for entry (scroll-triggered) animations
if (hasEntryAnimations) {
  animationHead += `<link rel="stylesheet" href="/vendor/aos.css">`;
  animationBody += `<script src="/vendor/aos.js"></script>`;
  animationBody += `<script>AOS.init({useClassNames:true,initClassName:false,animatedClassName:"animate__animated",once:true,duration:1000,offset:120,easing:"ease"});</script>`;
}

// Combine with existing headScripts/bodyScripts
const headScripts = [
  allCustomCss ? `<style>${allCustomCss}</style>` : "",
  animationHead,
].filter(Boolean).join("\n");

const bodyScripts = animationBody;
```

### Injection Points in `PageTemplate`

- `headScripts` (end of `<head>`, line 159): Receives `<link>` tags for animate.css and aos.css
- `bodyScripts` (end of `<body>`, line 174): Receives `<script>` tags for aos.js and AOS.init()

Both injection points already exist and are wired. `bodyScripts` is currently empty string — we populate it when entry animations are present.

---

## 5. AOS Global Init Config

```ts
AOS.init({
  useClassNames: true,                     // Adds data-aos value as CSS class on the element
  initClassName: false,                    // Don't add aos-init class (avoid FOUC flash)
  animatedClassName: 'animate__animated',  // Animate.css base class (required for keyframe duration/fill)
  once: true,                              // Default: play once (overridable per block via data-aos-once)
  duration: 1000,                          // Default duration ms (overridable per block)
  offset: 120,                             // Trigger 120px from viewport bottom
  easing: 'ease',                          // Default easing curve
});
```

Per-block `data-aos-once`, `data-aos-duration`, `data-aos-delay` attributes override these globals.

---

## 6. Collecting Animation CSS Rules

All animation CSS rules (hover + loop) are collected across all blocks and injected as a single `<style>` block — alongside token system modifier CSS.

```ts
/**
 * Generates all animation CSS rules for a single block.
 * Returns empty string if no hover/loop animations configured.
 */
function generateBlockAnimationCSS(blockId: string, animation: BlockAnimation): string {
  const rules: string[] = [];
  const hasEntry = !!animation.entry;

  if (animation.hover) {
    rules.push(`.block-${blockId}:hover { animation: ${animation.hover.name} 1s both; }`);
  }

  if (animation.loop) {
    // If block also has entry animation, scope loop to post-entry (after AOS triggers)
    const selector = hasEntry
      ? `.block-${blockId}.aos-animate`
      : `.block-${blockId}`;
    rules.push(`${selector} { animation: ${animation.loop.name} 1s infinite both; }`);
  }

  return rules.join("\n");
}

/**
 * Collects animation CSS from all blocks on the page.
 * Called in render.routes.ts alongside custom CSS collection.
 */
function collectPageAnimationCSS(blocks: BlockConfig[]): string {
  return blocks
    .filter(b => b.other?.animation?.hover || b.other?.animation?.loop)
    .map(b => generateBlockAnimationCSS(b.id, b.other!.animation!))
    .filter(Boolean)
    .join("\n");
}
```

The collected CSS is added to `headScripts` as an additional `<style>` block:

```ts
const animationCss = collectPageAnimationCSS(blocks);
if (animationCss) {
  animationHead += `<style>${animationCss}</style>`;
}
```

---

## 7. Editor UI — Animation Section in BlockSettings

New section in `BlockSettings.tsx` sidebar: **"Animations"** — positioned after existing style sections (Colors, Spacing, Layout, etc.).

### Entry Animation Sub-section

- Dropdown or scrollable grid of entry presets
- Each preset shows its label ("Fade In Up", "Bounce In", etc.)
- Selecting a preset plays the animation once on the canvas block as preview
- Below the preset selector:
  - **Duration** — slider: 200ms to 3000ms, step 50ms, default 1000ms
  - **Delay** — number input: 0 to 3000ms, step 50ms, default 0
  - **Play once** — toggle/checkbox, default: on
- "None" option at the top to clear selection

### Hover Animation Sub-section

- Dropdown or grid of hover presets
- Hovering over a preset name triggers a preview on the canvas block
- "None" option to clear
- No duration/delay controls (uses Animate.css defaults)

### Loop Animation Sub-section

- Dropdown or grid of loop presets
- Selecting a preset immediately shows the continuous animation on the canvas block
- "None" option to clear
- No duration/delay controls

### Preview Behavior

| Category | Preview trigger | Preview behavior |
|---|---|---|
| Entry | On preset selection or "Preview" button | Play once on canvas block, remove classes after `animationend` |
| Hover | Hover over preset option in sidebar | Play on canvas block, remove on `animationend` |
| Loop | On preset selection | Start continuous animation, stop on deselection |

---

## 8. Render Pipeline

```
block.other.animation
  |
  |-- entry?
  |     |-- adapt-block-config.ts: translate to data-aos-* on block attributes
  |     |-- Attributes flow to rendered HTML via existing pipeline
  |     |-- AOS library detects scroll, adds animate__animated + animate__{name}
  |     |-- Animate.css @keyframes provides the animation
  |
  |-- hover?
  |     |-- Generate CSS: .block-{id}:hover { animation: {name} 1s both; }
  |     |-- Collect and inject in page <style> block via headScripts
  |     |-- Animate.css @keyframes provides the animation
  |
  |-- loop?
  |     |-- Generate CSS: .block-{id} { animation: {name} 1s infinite both; }
  |     |-- (Scoped to .aos-animate if entry also exists)
  |     |-- Collect and inject in page <style> block via headScripts
  |     |-- Animate.css @keyframes provides the animation

Dependency injection (conditional):
  |-- Any animation exists?  -> <link> animate.min.css in headScripts
  |-- Entry animation exists? -> <link> aos.css + <script> aos.js + AOS.init() in bodyScripts
```

---

## 9. Files to Create

| File | Purpose | ~LOC |
|---|---|---|
| `client/src/lib/animation-presets.ts` | Preset registry (entry/hover/loop arrays), types, CSS generation helpers | ~120 |
| `client/src/components/PageBuilder/AnimationPicker.tsx` | Sidebar animation selection UI — all 3 categories, preview integration | ~150 |
| `public/vendor/animate.min.css` | Self-hosted Animate.css v4.1.1 (minified) | vendor |
| `public/vendor/aos.css` | Self-hosted AOS v2.3.4 CSS | vendor |
| `public/vendor/aos.js` | Self-hosted AOS v2.3.4 JS | vendor |

## 10. Files to Modify

| File | Change |
|---|---|
| `shared/schema-types.ts` | Add `animation?: BlockAnimation` to `BlockConfig.other` type definition |
| `client/src/components/PageBuilder/BlockSettings.tsx` | Add "Animations" section using `AnimationPicker` component |
| `renderer/adapt-block-config.ts` | Translate `animation.entry` to `data-aos-*` attributes during block adaptation |
| `server/routes/render.routes.ts` | Conditionally inject animate.css/AOS assets in headScripts/bodyScripts; collect and inject hover/loop CSS rules |

Files that need **no changes**:
- `renderer/templates/page.ts` — headScripts and bodyScripts injection points already exist
- `renderer/to-html.tsx` — attributes already flow through to HTML output
- Individual block renderers — animation operates at the wrapper level via attributes and CSS

---

## 11. Backward Compatibility

- Existing blocks have no `animation` field. They render exactly as before — no animation assets loaded, no CSS injected.
- Animation is purely additive. Setting it does not affect `styles`, `tokenMap`, or any other block property.
- Removing all animations from all blocks on a page means zero animation assets are loaded (conditional injection).

---

## 12. Accessibility

Animate.css v4 includes built-in `prefers-reduced-motion` support:

```css
@media (prefers-reduced-motion: reduce) {
  .animate__animated {
    animation-duration: 1ms !important;
    transition-duration: 1ms !important;
    animation-iteration-count: 1 !important;
  }
}
```

This automatically disables animations for users who've set "reduce motion" in their OS preferences. Since our hover/loop CSS rules reference Animate.css keyframes, they also benefit from the user's system settings (animations effectively become invisible with 1ms duration).

AOS also respects `prefers-reduced-motion`. No additional accessibility work needed.

---

## 13. Examples

### Block with entry animation only

```ts
{
  id: "block_hero",
  name: "core/heading",
  other: {
    animation: {
      entry: {
        name: "fadeInUp",
        duration: 800,
        delay: 200,
        once: true,
      }
    }
  }
}
```

**Rendered HTML**:
```html
<div class="block-block_hero" data-aos="animate__fadeInUp" data-aos-duration="800" data-aos-delay="200" data-aos-once="true">
  <h1>Welcome</h1>
</div>
```

**Assets loaded**: animate.min.css, aos.css, aos.js + AOS.init()

### Block with hover animation only

```ts
{
  id: "block_card",
  name: "core/container",
  other: {
    animation: {
      hover: { name: "pulse" }
    }
  }
}
```

**Rendered HTML**:
```html
<div class="block-block_card">
  ...card content...
</div>
```

**Injected CSS**:
```css
.block-block_card:hover { animation: pulse 1s both; }
```

**Assets loaded**: animate.min.css only (no AOS needed)

### Block with all three categories

```ts
{
  id: "block_cta",
  name: "core/button",
  other: {
    animation: {
      entry: { name: "bounceIn", duration: 1000, once: true },
      hover: { name: "tada" },
      loop: { name: "pulse" },
    }
  }
}
```

**Rendered HTML**:
```html
<div class="block-block_cta" data-aos="animate__bounceIn" data-aos-duration="1000" data-aos-once="true">
  <button>Click Me</button>
</div>
```

**Injected CSS**:
```css
.block-block_cta:hover { animation: tada 1s both; }
.block-block_cta.aos-animate { animation: pulse 1s infinite both; }
```

Note: loop scoped to `.aos-animate` because entry also exists — loop starts only after entry triggers.

**Assets loaded**: animate.min.css, aos.css, aos.js + AOS.init()

### Block with token system + animation (both systems coexisting)

```ts
{
  id: "block_feature",
  name: "core/paragraph",
  other: {
    tokenMap: {
      color: { property: "color", value: "blue", variant: "600", alias: "text" },
      backgroundColor: { property: "backgroundColor", value: "white", variant: null, alias: "bg" },
    },
    units: { spacing: "px" },
    animation: {
      entry: { name: "fadeInLeft", duration: 600 },
      hover: { name: "headShake" },
    }
  }
}
```

Token system resolves inline styles. Animation system adds data attributes and CSS rules. Both live on `block.other`, both flow through the same render pipeline, zero conflict.

---

## 14. Edge Cases

### Hover + Loop conflict

Both hover and loop set the `animation` CSS property. When a user hovers a block that has a loop animation, the hover rule takes precedence (`:hover` specificity). When hover ends, the loop animation resumes. Natural CSS cascade behavior — no special handling needed.

### Entry + Loop timing

Loop is scoped to `.aos-animate` when entry exists. AOS adds the `aos-animate` class when the element enters viewport, which activates both the entry animation (via AOS class mechanism) and the loop (via our CSS rule). The entry animation plays first (one-shot), then the loop takes over because `infinite` keeps it running.

### No animations on page

When no block has `animation` set, zero vendor files are injected. The page loads exactly as before the animation system existed.

### AOS and dynamic content

AOS uses MutationObserver to detect new DOM elements. If blocks are loaded dynamically, AOS picks them up automatically. No manual `AOS.refresh()` calls needed.

---

## 15. Phase 1 Scope

### In scope

- `BlockAnimation` types and `animation` field on `block.other`
- Curated preset registry (entry, hover, loop)
- AnimationPicker sidebar component with preview
- SSR: data-aos attributes for entry, generated CSS rules for hover/loop
- Conditional asset injection (animate.css + AOS only when needed)
- Self-hosted vendor files
- Accessibility via Animate.css built-in `prefers-reduced-motion`

### Out of scope (future)

- Custom keyframe authoring
- Per-animation duration/easing for hover and loop
- Exit animations (on scroll out)
- Staggered animations across child blocks
- Animation sequencing/chaining
