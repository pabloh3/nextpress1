import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Paintbrush } from "lucide-react"
import type { TokenEntry } from "@shared/schema-types"
import { tokenColors, propertyAliasMap } from "@/lib/tailwind-tokens"

interface TokenColorPickerProps {
  property: string               // CSS property: "backgroundColor" or "color"
  currentEntry: TokenEntry | undefined
  currentStyleValue: string | undefined  // Fallback from block.styles for legacy blocks
  onChange: (entry: TokenEntry) => void
}

// Standard Tailwind color families to display (skip CSS variable-based colors)
const COLOR_FAMILIES = [
  "slate", "gray", "zinc", "neutral", "stone",
  "red", "orange", "amber", "yellow", "lime",
  "green", "emerald", "teal", "cyan", "sky",
  "blue", "indigo", "violet", "purple", "fuchsia",
  "pink", "rose",
]

const SHADE_KEYS = ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900", "950"]

const SPECIAL_COLORS = ["white", "black", "transparent"]

export default function TokenColorPicker({ property, currentEntry, currentStyleValue, onChange }: TokenColorPickerProps) {
  // Determine if currently in custom mode
  const isCustom = currentEntry ? !currentEntry.value : !!currentStyleValue
  const [showCustom, setShowCustom] = useState(isCustom)
  
  const currentCustomValue = currentEntry?.style || currentStyleValue || "#000000"
  const alias = propertyAliasMap[property] || "bg"

  const handleTokenSelect = (family: string, shade: string | null, hexValue: string) => {
    setShowCustom(false)
    onChange({
      property,
      value: family,
      variant: shade,
      alias,
      style: hexValue,
    })
  }

  const handleCustomChange = (hex: string) => {
    onChange({
      property,
      value: "",
      variant: null,
      alias,
      style: hex,
    })
  }

  const isSelected = (family: string, shade: string | null) => {
    if (!currentEntry || !currentEntry.value) return false
    return currentEntry.value === family && currentEntry.variant === shade
  }

  // Get hex value for a color from tokenColors
  const getHex = (family: string, shade?: string): string | null => {
    const colorGroup = (tokenColors as Record<string, any>)[family]
    if (!colorGroup) return null
    if (typeof colorGroup === "string") return colorGroup
    if (shade && colorGroup[shade]) return colorGroup[shade]
    return null
  }

  return (
    <div className="space-y-3">
      {/* Mode toggle */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setShowCustom(!showCustom)}
          className={`text-xs px-2 py-1 border rounded-none transition-colors ${
            showCustom 
              ? "bg-gray-200 text-gray-800 border-gray-300" 
              : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
          }`}
        >
          {showCustom ? "← Tokens" : "Custom"}
        </button>
      </div>

      {showCustom ? (
        /* Custom hex input */
        <div className="flex gap-2">
          <Input
            type="color"
            value={currentCustomValue}
            onChange={(e) => handleCustomChange(e.target.value)}
            className="w-10 h-8 p-1 border-gray-200 rounded-none"
          />
          <Input
            value={currentCustomValue}
            onChange={(e) => handleCustomChange(e.target.value)}
            placeholder="#000000"
            className="flex-1 h-8 text-xs border-gray-200 rounded-none focus:outline-none focus:ring-1 focus:ring-gray-400"
          />
        </div>
      ) : (
        /* Token swatch grid */
        <div className="space-y-2">
          {/* Special colors row */}
          <div className="flex gap-1">
            {SPECIAL_COLORS.map((name) => {
              const hex = getHex(name)
              if (!hex) return null
              return (
                <button
                  key={name}
                  onClick={() => handleTokenSelect(name, null, hex)}
                  className={`w-6 h-6 border transition-all ${
                    isSelected(name, null)
                      ? "ring-2 ring-blue-500 ring-offset-1 border-blue-400"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                  style={{ backgroundColor: hex === "transparent" ? "transparent" : hex }}
                  title={name}
                >
                  {hex === "transparent" && (
                    <span className="text-xs text-gray-400 leading-none">∅</span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Color family grid */}
          <div className="max-h-48 overflow-y-auto space-y-0.5">
            {COLOR_FAMILIES.map((family) => {
              const colorGroup = (tokenColors as Record<string, any>)[family]
              if (!colorGroup || typeof colorGroup === "string") return null
              return (
                <div key={family} className="flex gap-0.5" title={family}>
                  {SHADE_KEYS.map((shade) => {
                    const hex = colorGroup[shade]
                    if (!hex || typeof hex !== "string" || hex.startsWith("var(")) return null
                    return (
                      <button
                        key={shade}
                        onClick={() => handleTokenSelect(family, shade, hex)}
                        className={`w-4 h-4 flex-shrink-0 transition-all ${
                          isSelected(family, shade)
                            ? "ring-2 ring-blue-500 ring-offset-1 scale-125 z-10"
                            : "hover:scale-110"
                        }`}
                        style={{ backgroundColor: hex }}
                        title={`${family}-${shade}: ${hex}`}
                      />
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
