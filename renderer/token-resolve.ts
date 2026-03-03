/**
 * Server-side / renderer token and animation resolution utilities.
 *
 * This module is intentionally separate from client/src/lib/tailwind-tokens.ts
 * because the server build (tsup) excludes the client/ directory. Both modules
 * share the same logic — client uses React types for type safety, this module
 * uses plain objects for compatibility with the Node renderer.
 */
import resolveConfig from "tailwindcss/resolveConfig";
// tailwind.config.ts is at project root — accessible from renderer/
import tailwindConfig from "../tailwind.config";
import type { TokenEntry, BlockConfig, EntryAnimation } from "@shared/schema-types";

const fullConfig = resolveConfig(tailwindConfig as any);
const theme = fullConfig.theme as any;

/** Maps pseudo-class modifier names to CSS selector suffixes */
const STATE_MODIFIER_MAP: Record<string, string> = {
  hover: ":hover",
  focus: ":focus",
  active: ":active",
  "focus-within": ":focus-within",
  "focus-visible": ":focus-visible",
  disabled: ":disabled",
  first: ":first-child",
  last: ":last-child",
};

/** Converts camelCase CSS property to kebab-case for CSS rules */
function camelToKebab(str: string): string {
  return str.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
}

/**
 * Resolves a token entry's value/variant to an actual CSS string value
 * using the Tailwind resolved config.
 */
function resolveTokenValue(entry: TokenEntry): string | null {
  if (!entry.value) return null;
  const { property, value, variant } = entry;

  if (
    property === "backgroundColor" ||
    property === "color" ||
    property === "borderColor"
  ) {
    const colorGroup = theme.colors?.[value];
    if (typeof colorGroup === "string") return colorGroup;
    if (colorGroup && variant) return (colorGroup as any)[variant] ?? null;
    return null;
  }

  if (entry.unitCategory === "spacing") {
    return theme.spacing?.[value] ?? null;
  }

  if (property === "fontSize") {
    const fs = theme.fontSize?.[value];
    if (typeof fs === "string") return fs;
    if (Array.isArray(fs)) return fs[0];
    return null;
  }

  if (property === "fontWeight") {
    return theme.fontWeight?.[value] ?? null;
  }

  if (property === "borderRadius") {
    return theme.borderRadius?.[value] ?? null;
  }

  return null;
}

/**
 * Composes a custom (non-token) entry's value with its active unit.
 */
function composeCustomValue(
  entry: TokenEntry,
  units: Record<string, string>,
): string | null {
  if (!entry.style) return null;
  if (entry.unitCategory && units[entry.unitCategory]) {
    return `${entry.style}${units[entry.unitCategory]}`;
  }
  return entry.style;
}

/**
 * Generates a CSS rule string for a modifier entry (pseudo-class or @media).
 */
function resolveModifierEntry(
  blockId: string,
  entry: TokenEntry,
  resolvedValue: string,
): string {
  if (!entry.modifier) return "";

  const cssProp = camelToKebab(entry.property);
  const selector = `.block-${blockId}`;
  const screenBreakpoints = (theme.screens ?? {}) as Record<string, string>;

  if (STATE_MODIFIER_MAP[entry.modifier]) {
    return `${selector}${STATE_MODIFIER_MAP[entry.modifier]} { ${cssProp}: ${resolvedValue}; }`;
  }

  const breakpoint = screenBreakpoints[entry.modifier];
  if (breakpoint) {
    return `@media (min-width: ${breakpoint}) { ${selector} { ${cssProp}: ${resolvedValue}; } }`;
  }

  return "";
}

export interface ResolvedBlockTokens {
  /** Resolved inline styles from base (non-modifier) token entries */
  style: Record<string, string>;
  /** Generated CSS rules for modifier entries (hover, responsive) */
  modifierCss: string;
}

/**
 * Resolves a block's tokenMap and units into inline styles + modifier CSS rules.
 * Merges resolved token styles on top of legacy block.styles for backward compatibility.
 */
export function resolveBlockTokens(block: BlockConfig): ResolvedBlockTokens {
  const tokenMap = block.other?.tokenMap;
  const units = block.other?.units ?? {};

  if (!tokenMap || Object.keys(tokenMap).length === 0) {
    return { style: (block.styles as Record<string, string>) ?? {}, modifierCss: "" };
  }

  const inlineStyle: Record<string, string> = { ...(block.styles as any) };
  const modifierRules: string[] = [];

  for (const entry of Object.values(tokenMap)) {
    const resolvedValue = entry.value
      ? resolveTokenValue(entry)
      : composeCustomValue(entry, units);

    if (!resolvedValue) continue;

    if (entry.modifier) {
      const rule = resolveModifierEntry(block.id, entry, resolvedValue);
      if (rule) modifierRules.push(rule);
    } else {
      inlineStyle[entry.property] = resolvedValue;
    }
  }

  return {
    style: inlineStyle,
    modifierCss: modifierRules.join("\n"),
  };
}

/**
 * Translates block.other.animation.entry into data-aos-* HTML attributes.
 * Returns an empty object when no entry animation is configured.
 */
export function buildEntryAnimationAttributes(
  entry: EntryAnimation | undefined,
): Record<string, string> {
  if (!entry) return {};

  const attrs: Record<string, string> = {
    "data-aos": `animate__${entry.name}`,
    "data-aos-duration": String(entry.duration ?? 1000),
    "data-aos-once": String(entry.once ?? true),
  };

  if ((entry.delay ?? 0) > 0) {
    attrs["data-aos-delay"] = String(entry.delay);
  }

  return attrs;
}
