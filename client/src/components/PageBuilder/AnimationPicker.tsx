import { useState, useCallback, useRef } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { CollapsibleCard } from "@/components/ui/collapsible-card"
import { Zap, MousePointer, Repeat, Eye, X } from "lucide-react"
import type { BlockAnimation, EntryAnimation, HoverAnimation, LoopAnimation } from "@shared/schema-types"
import { entryPresets, hoverPresets, loopPresets, type AnimationPreset } from "@/lib/animation-presets"

interface AnimationPickerProps {
  animation: BlockAnimation | null | undefined
  blockId: string
  onChange: (animation: BlockAnimation | undefined) => void
}

/**
 * Sidebar animation selection UI — entry, hover, and loop categories.
 * Users select from curated Animate.css presets.
 */
export default function AnimationPicker({ animation, blockId, onChange }: AnimationPickerProps) {

  const updateAnimation = useCallback((updates: Partial<BlockAnimation>) => {
    // Use null instead of undefined for cleared categories so deepMerge properly removes them
    const sanitized = Object.fromEntries(
      Object.entries(updates).map(([k, v]) => [k, v === undefined ? null : v])
    )
    const next = { ...animation, ...sanitized }
    // If all categories are cleared, remove animation entirely
    if (!next.entry && !next.hover && !next.loop) {
      onChange(undefined)
    } else {
      onChange(next as BlockAnimation)
    }
  }, [animation, onChange])

  /** Preview animation on the canvas block element */
  const previewAnimation = useCallback((animName: string, infinite = false) => {
    const el = document.querySelector(`.block-${blockId}`) as HTMLElement | null
    if (!el) return

    // Remove any existing preview classes
    el.classList.remove("animate__animated", "animate__infinite")
    el.getAnimations().forEach(a => a.cancel())

    // Force reflow to restart animation
    void el.offsetWidth

    el.classList.add("animate__animated", `animate__${animName}`)
    if (infinite) {
      el.classList.add("animate__infinite")
    }

    if (!infinite) {
      const cleanup = () => {
        el.classList.remove("animate__animated", `animate__${animName}`)
        el.removeEventListener("animationend", cleanup)
      }
      el.addEventListener("animationend", cleanup, { once: true })
    }
  }, [blockId])

  const stopPreview = useCallback(() => {
    const el = document.querySelector(`.block-${blockId}`) as HTMLElement | null
    if (!el) return
    const classes = Array.from(el.classList).filter(c => c.startsWith("animate__"))
    classes.forEach(c => el.classList.remove(c))
  }, [blockId])

  const renderPresetGrid = (
    presets: AnimationPreset[],
    selected: string | undefined,
    onSelect: (name: string | undefined) => void,
    onHover?: (name: string) => void
  ) => (
    <div className="space-y-2">
      {/* None option */}
      <button
        onClick={() => onSelect(undefined)}
        className={`w-full text-left px-2 py-1.5 text-xs border rounded-none transition-colors ${
          !selected
            ? "bg-gray-200 text-gray-800 border-gray-300"
            : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
        }`}
      >
        None
      </button>

      {/* Preset grid */}
      <div className="grid grid-cols-2 gap-1 max-h-40 overflow-y-auto">
        {presets.map((preset) => (
          <button
            key={preset.name}
            onClick={() => onSelect(preset.name)}
            onMouseEnter={() => onHover?.(preset.name)}
            className={`px-2 py-1.5 text-xs border rounded-none transition-colors text-left truncate ${
              selected === preset.name
                ? "bg-gray-800 text-white border-gray-800"
                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
            }`}
            title={preset.label}
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Entry Animations */}
      <CollapsibleCard title="Entry Animation" icon={Eye} defaultOpen={!!animation?.entry}>
        {renderPresetGrid(
          entryPresets,
          animation?.entry?.name,
          (name) => {
            if (!name) {
              updateAnimation({ entry: undefined })
            } else {
              updateAnimation({
                entry: {
                  name,
                  duration: animation?.entry?.duration ?? 1000,
                  delay: animation?.entry?.delay ?? 0,
                  once: animation?.entry?.once ?? true,
                },
              })
              previewAnimation(name)
            }
          }
        )}

        {/* Entry options (only if entry is selected) */}
        {animation?.entry && (
          <div className="space-y-3 mt-3 pt-3 border-t border-gray-200">
            {/* Duration */}
            <div>
              <Label className="text-xs text-gray-600">Duration: {animation.entry.duration ?? 1000}ms</Label>
              <Slider
                value={[animation.entry.duration ?? 1000]}
                onValueChange={([v]) =>
                  updateAnimation({ entry: { ...animation.entry!, duration: v } })
                }
                min={200}
                max={3000}
                step={50}
                className="mt-1"
              />
            </div>

            {/* Delay */}
            <div>
              <Label className="text-xs text-gray-600">Delay</Label>
              <Input
                type="number"
                value={animation.entry.delay ?? 0}
                onChange={(e) =>
                  updateAnimation({
                    entry: { ...animation.entry!, delay: Number(e.target.value) },
                  })
                }
                min={0}
                max={3000}
                step={50}
                className="h-8 text-xs border-gray-200 rounded-none mt-1"
                placeholder="0ms"
              />
            </div>

            {/* Play once toggle */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={animation.entry.once ?? true}
                onChange={(e) =>
                  updateAnimation({
                    entry: { ...animation.entry!, once: e.target.checked },
                  })
                }
                className="rounded-none border-gray-300"
              />
              <span className="text-xs text-gray-700">Play once only</span>
            </label>

            {/* Preview button */}
            <button
              onClick={() => previewAnimation(animation.entry!.name)}
              className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-none bg-white text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-1"
            >
              <Eye className="w-3 h-3" /> Preview
            </button>
          </div>
        )}
      </CollapsibleCard>

      {/* Hover Animations */}
      <CollapsibleCard title="Hover Animation" icon={MousePointer} defaultOpen={!!animation?.hover}>
        {renderPresetGrid(
          hoverPresets,
          animation?.hover?.name,
          (name) => {
            if (!name) {
              updateAnimation({ hover: undefined })
              stopPreview()
            } else {
              updateAnimation({ hover: { name } })
            }
          },
          (name) => previewAnimation(name)
        )}
      </CollapsibleCard>

      {/* Loop Animations */}
      <CollapsibleCard title="Loop Animation" icon={Repeat} defaultOpen={!!animation?.loop}>
        {renderPresetGrid(
          loopPresets,
          animation?.loop?.name,
          (name) => {
            if (!name) {
              updateAnimation({ loop: undefined })
              stopPreview()
            } else {
              updateAnimation({ loop: { name } })
              previewAnimation(name, true)
            }
          }
        )}
      </CollapsibleCard>
    </div>
  )
}
