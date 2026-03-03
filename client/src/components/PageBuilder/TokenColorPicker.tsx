/**
 * TokenColorPicker — selects a Tailwind color token or a custom hex color.
 *
 * Renders a grid of swatches derived from the resolved Tailwind theme colors.
 * A "Custom" toggle switches to a free-form hex input as an escape hatch.
 */
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { TokenEntry } from "@shared/schema-types";
import { tokenColors, propertyAliasMap } from "@/lib/tailwind-tokens";

/** Color families that are plain strings (no shades), rendered as single swatches */
const SINGLE_VALUE_COLORS = new Set([
  "transparent",
  "white",
  "black",
  "current",
  "inherit",
]);

/** Standard Tailwind shade keys in display order */
const SHADE_KEYS = [
  "50",
  "100",
  "200",
  "300",
  "400",
  "500",
  "600",
  "700",
  "800",
  "900",
  "950",
];

interface TokenColorPickerProps {
  /** CSS property this picker controls: "color" | "backgroundColor" | "borderColor" */
  property: string;
  /** Current token entry for this property (undefined if no selection yet) */
  currentEntry: TokenEntry | undefined;
  /** Called whenever the user changes the color selection */
  onChange: (entry: TokenEntry) => void;
}

/**
 * Determines whether the color is a shade-based family (has numeric shade keys)
 * vs. a single-value color (white, black, transparent…).
 */
function isShadeFamily(
  colorValue: string | Record<string, string>,
): colorValue is Record<string, string> {
  return typeof colorValue === "object" && colorValue !== null;
}

export default function TokenColorPicker({
  property,
  currentEntry,
  onChange,
}: TokenColorPickerProps) {
  const isCustomMode = currentEntry
    ? currentEntry.value === "" && currentEntry.style !== undefined
    : false;
  const [customInput, setCustomInput] = useState(
    currentEntry?.style ?? "#000000",
  );
  const [showCustom, setShowCustom] = useState(isCustomMode);

  const alias = propertyAliasMap[property] ?? property;

  /** Build a token entry for a swatch click */
  const buildTokenEntry = (
    colorName: string,
    shade: string | null,
  ): TokenEntry => ({
    property,
    value: colorName,
    variant: shade,
    alias,
  });

  /** Build a custom entry from the hex input */
  const buildCustomEntry = (hexValue: string): TokenEntry => ({
    property,
    value: "",
    variant: null,
    alias,
    style: hexValue,
  });

  const isSwatchSelected = (name: string, shade: string | null) => {
    if (!currentEntry || showCustom) return false;
    return currentEntry.value === name && currentEntry.variant === shade;
  };

  // Color families to display — skip CSS-variable-based tokens (can't preview)
  const colorFamilies = Object.entries(tokenColors).filter(([, val]) => {
    if (typeof val === "string") {
      // Single-value: include only known named colors, skip CSS vars
      return !String(val).startsWith("var(");
    }
    // Shade family: include if at least one shade is a real hex/named color
    return Object.values(val as Record<string, string>).some(
      (v) => !String(v).startsWith("var("),
    );
  });

  return (
    <div className="space-y-3">
      {/* Token mode: swatch grid */}
      {!showCustom && (
        <div className="overflow-y-auto max-h-48 pr-1 space-y-1">
          {colorFamilies.map(([name, val]) => {
            if (!isShadeFamily(val)) {
              // Single-value swatch (white, black, transparent)
              const isSel = isSwatchSelected(name, null);
              const displayColor =
                name === "transparent" ? "transparent" : String(val);
              return (
                <div key={name} className="flex items-center gap-2">
                  <button
                    title={`${name}`}
                    onClick={() => {
                      onChange(buildTokenEntry(name, null));
                    }}
                    className={`w-5 h-5 rounded-sm border flex-shrink-0 ${isSel ? "ring-2 ring-blue-500 ring-offset-1" : "border-gray-200"}`}
                    style={{ backgroundColor: displayColor }}
                  />
                  <span className="text-xs text-gray-600 capitalize">{name}</span>
                </div>
              );
            }

            // Shade-based family row
            const shades = val as Record<string, string>;
            return (
              <div key={name} className="flex items-center gap-1">
                <span className="text-xs text-gray-500 w-12 flex-shrink-0 truncate capitalize">
                  {name}
                </span>
                <div className="flex gap-0.5 flex-wrap">
                  {SHADE_KEYS.filter((s) => shades[s]).map((shade) => {
                    const hex = shades[shade];
                    if (String(hex).startsWith("var(")) return null;
                    const isSel = isSwatchSelected(name, shade);
                    return (
                      <button
                        key={shade}
                        title={`${name}-${shade}: ${hex}`}
                        onClick={() => onChange(buildTokenEntry(name, shade))}
                        className={`w-4 h-4 rounded-sm ${isSel ? "ring-2 ring-blue-500 ring-offset-1" : ""}`}
                        style={{ backgroundColor: hex }}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Custom mode: hex input */}
      {showCustom && (
        <div className="flex gap-2">
          <Input
            type="color"
            value={customInput}
            onChange={(e) => {
              setCustomInput(e.target.value);
              onChange(buildCustomEntry(e.target.value));
            }}
            className="w-10 h-8 p-0.5 border-gray-200 rounded-none"
          />
          <Input
            value={customInput}
            onChange={(e) => {
              setCustomInput(e.target.value);
              onChange(buildCustomEntry(e.target.value));
            }}
            placeholder="#000000"
            className="flex-1 h-8 text-xs border-gray-200 rounded-none"
          />
        </div>
      )}

      {/* Toggle between token and custom mode */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          const next = !showCustom;
          setShowCustom(next);
          if (!next && currentEntry?.value) {
            // Returning to token mode — keep existing selection
          } else if (next) {
            // Switching to custom — initialise from current resolved value or empty
            const initHex = currentEntry?.style ?? "#000000";
            setCustomInput(initHex);
            onChange(buildCustomEntry(initHex));
          }
        }}
        className="h-6 text-xs px-2 text-gray-500 hover:text-gray-800"
      >
        {showCustom ? "← Token colors" : "Custom hex →"}
      </Button>
    </div>
  );
}
