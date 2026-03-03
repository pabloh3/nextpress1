/**
 * Tailwind design token utilities for the PageBuilder token system.
 *
 * Uses resolveConfig to derive the full merged Tailwind theme at build time,
 * giving the editor access to all design tokens (colors, spacing, font sizes, etc.)
 * without any runtime Tailwind dependency on published pages.
 */
import resolveConfig from "tailwindcss/resolveConfig";
// @ts-ignore - tailwind.config.ts is at project root, outside TS strict boundary
import tailwindConfig from "../../../tailwind.config";
import type { TokenEntry } from "@shared/schema-types";

const fullConfig = resolveConfig(tailwindConfig as any);

/** All color families from the resolved Tailwind theme */
export const tokenColors = fullConfig.theme.colors as Record<
  string,
  string | Record<string, string>
>;

/** Full spacing scale (e.g. { "0": "0px", "1": "0.25rem", ... }) */
export const tokenSpacing = fullConfig.theme.spacing as Record<string, string>;

/** Font size scale (entries can be [size, lineHeightConfig] tuples or plain strings) */
export const tokenFontSize = fullConfig.theme.fontSize as Record<
  string,
  string | [string, Record<string, string>]
>;

/** Responsive breakpoints (e.g. { sm: "640px", md: "768px", ... }) */
export const tokenScreens = (fullConfig.theme.screens ?? {}) as Record<
  string,
  string
>;

/** CSS property → Tailwind utility prefix hint used by the sidebar UI */
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

/** Available unit options per category */
export const unitCategories: Record<string, string[]> = {
  spacing: ["px", "rem", "em", "%"],
  font: ["px", "rem", "em"],
  dimension: ["px", "rem", "%", "vw", "vh"],
  border: ["px", "rem", "%"],
};

/** Maps CSS property names to their unit category */
export const propertyUnitCategoryMap: Record<string, string> = {
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
};

/** Maps pseudo-class modifier names to CSS selector suffixes */
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

/**
 * Resolves a token entry's value/variant to an actual CSS value using the
 * Tailwind resolved config. Returns null when the token cannot be resolved.
 */
export function resolveTokenValue(entry: TokenEntry): string | null {
  if (!entry.value) return null;

  const { property, value, variant } = entry;
  const theme = fullConfig.theme as any;

  // Color properties → look up in theme.colors
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

  // Spacing properties → look up in theme.spacing
  if (entry.unitCategory === "spacing") {
    return theme.spacing?.[value] ?? null;
  }

  // Font size → look up in theme.fontSize
  if (property === "fontSize") {
    const fs = theme.fontSize?.[value];
    if (typeof fs === "string") return fs;
    if (Array.isArray(fs)) return fs[0]; // [size, { lineHeight }] tuple
    return null;
  }

  // Font weight → look up in theme.fontWeight
  if (property === "fontWeight") {
    return theme.fontWeight?.[value] ?? null;
  }

  // Border radius → look up in theme.borderRadius
  if (property === "borderRadius") {
    return theme.borderRadius?.[value] ?? null;
  }

  return null;
}

/**
 * Composes a custom (non-token) entry's raw value with the active unit for its category.
 * e.g. style="23" + unitCategory="spacing" + units.spacing="px" → "23px"
 */
export function composeCustomValue(
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
 * Resolves a full tokenMap into inline style properties and a list of modifier
 * entries that require CSS rule generation (hover, focus, responsive).
 */
export function resolveTokenMap(
  tokenMap: Record<string, TokenEntry>,
  units: Record<string, string>,
): {
  style: React.CSSProperties;
  modifierEntries: Array<{ entry: TokenEntry; resolvedValue: string }>;
} {
  const inlineStyle: Record<string, string> = {};
  const modifierEntries: Array<{ entry: TokenEntry; resolvedValue: string }> =
    [];

  for (const entry of Object.values(tokenMap)) {
    const resolvedValue = entry.value
      ? resolveTokenValue(entry)
      : composeCustomValue(entry, units);

    if (!resolvedValue) continue;

    if (entry.modifier) {
      modifierEntries.push({ entry, resolvedValue });
    } else {
      inlineStyle[entry.property] = resolvedValue;
    }
  }

  return {
    style: inlineStyle as React.CSSProperties,
    modifierEntries,
  };
}

/**
 * Converts a camelCase CSS property name to kebab-case for use in CSS rules.
 * e.g. "backgroundColor" → "background-color"
 */
export function camelToKebab(str: string): string {
  return str.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
}

/**
 * Generates a single CSS rule string for a modifier entry (pseudo-class or @media).
 * Returns empty string when the modifier is not recognized.
 */
export function resolveModifierEntry(
  blockId: string,
  entry: TokenEntry,
  resolvedValue: string,
): string {
  if (!entry.modifier) return "";

  const cssProp = camelToKebab(entry.property);
  const selector = `.block-${blockId}`;

  if (stateModifierMap[entry.modifier]) {
    const pseudo = stateModifierMap[entry.modifier];
    return `${selector}${pseudo} { ${cssProp}: ${resolvedValue}; }`;
  }

  const breakpoint = tokenScreens[entry.modifier];
  if (breakpoint) {
    return `@media (min-width: ${breakpoint}) { ${selector} { ${cssProp}: ${resolvedValue}; } }`;
  }

  return "";
}

/**
 * Generates all modifier CSS rules for a single block from its resolved modifier entries.
 */
export function generateBlockModifierCSS(
  blockId: string,
  modifierEntries: Array<{ entry: TokenEntry; resolvedValue: string }>,
): string {
  return modifierEntries
    .map(({ entry, resolvedValue }) =>
      resolveModifierEntry(blockId, entry, resolvedValue),
    )
    .filter(Boolean)
    .join("\n");
}
