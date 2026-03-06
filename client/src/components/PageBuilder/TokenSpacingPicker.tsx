/**
 * TokenSpacingPicker — selects a Tailwind spacing token or a custom numeric value.
 *
 * Renders spacing scale values as selectable chips. A unit selector (shared per
 * category section) controls the unit appended to custom values. A "Custom" toggle
 * switches to a free-form numeric input.
 */
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { TokenEntry } from "@shared/schema-types";
import { tokenSpacing, propertyAliasMap, unitCategories } from "@/lib/tailwind-tokens";

/** Spacing scale keys to show as chips — a curated subset of common values */
const SPACING_DISPLAY_KEYS = [
  "0", "0.5", "1", "1.5", "2", "2.5", "3", "3.5", "4", "5",
  "6", "7", "8", "9", "10", "11", "12", "14", "16", "20",
  "24", "28", "32", "36", "40", "44", "48", "52", "56", "60",
  "64", "72", "80", "96",
];

interface TokenSpacingPickerProps {
  /** CSS property this picker controls: "paddingTop", "marginLeft", etc. */
  property: string;
  /** Unit category for this property: "spacing" | "font" | "dimension" | "border" */
  unitCategory: string;
  /** Current token entry for this property */
  currentEntry: TokenEntry | undefined;
  /** Currently active unit for this category (e.g. "px") */
  currentUnit: string;
  /** Called when the user changes the active unit for this category */
  onUnitChange: (unit: string) => void;
  /** Called whenever the user changes the token/custom selection */
  onChange: (entry: TokenEntry) => void;
}

export default function TokenSpacingPicker({
  property,
  unitCategory,
  currentEntry,
  currentUnit,
  onUnitChange,
  onChange,
}: TokenSpacingPickerProps) {
  const isCustomMode = currentEntry
    ? currentEntry.value === "" && currentEntry.style !== undefined
    : false;
  const [showCustom, setShowCustom] = useState(isCustomMode);
  const [customInput, setCustomInput] = useState(currentEntry?.style ?? "");

  const alias = propertyAliasMap[property] ?? property;
  const units = unitCategories[unitCategory] ?? ["px", "rem"];

  const buildTokenEntry = (key: string): TokenEntry => ({
    property,
    value: key,
    variant: null,
    alias,
    unitCategory,
  });

  const buildCustomEntry = (val: string): TokenEntry => ({
    property,
    value: "",
    variant: null,
    alias,
    style: val,
    unitCategory,
  });

  const isChipSelected = (key: string) => {
    if (!currentEntry || showCustom) return false;
    return currentEntry.value === key && !currentEntry.style;
  };

  const displayKeys = SPACING_DISPLAY_KEYS.filter((k) => tokenSpacing[k]);

  return (
    <div className="space-y-2">
      {/* Unit selector */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">Unit:</span>
        {units.map((u) => (
          <button
            key={u}
            onClick={() => onUnitChange(u)}
            className={`h-6 px-2 text-xs border rounded-none transition-colors ${
              currentUnit === u
                ? "bg-gray-800 text-white border-gray-800"
                : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
            }`}
          >
            {u}
          </button>
        ))}
      </div>

      {/* Token chips */}
      {!showCustom && (
        <div className="flex flex-wrap gap-1">
          {displayKeys.map((key) => {
            const resolved = tokenSpacing[key];
            return (
              <button
                key={key}
                title={`${key} = ${resolved}`}
                onClick={() => onChange(buildTokenEntry(key))}
                className={`h-6 px-1.5 text-xs border rounded-none transition-colors ${
                  isChipSelected(key)
                    ? "bg-gray-800 text-white border-gray-800"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                }`}
              >
                {key}
              </button>
            );
          })}
        </div>
      )}

      {/* Custom numeric input */}
      {showCustom && (
        <div className="flex gap-2">
          <Input
            type="number"
            value={customInput}
            onChange={(e) => {
              setCustomInput(e.target.value);
              onChange(buildCustomEntry(e.target.value));
            }}
            placeholder="0"
            className="flex-1 h-8 text-xs border-gray-200 rounded-none"
          />
          <span className="text-xs text-gray-500 self-center">{currentUnit}</span>
        </div>
      )}

      {/* Toggle between token and custom mode */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          const next = !showCustom;
          setShowCustom(next);
          if (next) {
            const initVal = currentEntry?.style ?? "";
            setCustomInput(initVal);
            onChange(buildCustomEntry(initVal));
          }
        }}
        className="h-6 text-xs px-2 text-gray-500 hover:text-gray-800"
      >
        {showCustom ? "← Token scale" : "Custom value →"}
      </Button>
    </div>
  );
}
