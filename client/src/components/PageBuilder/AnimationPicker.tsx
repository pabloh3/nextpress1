/**
 * AnimationPicker — sidebar section for configuring block animations.
 *
 * Three categories:
 * - Entry: scroll-triggered via AOS + Animate.css keyframes
 * - Hover: CSS :hover rule + Animate.css keyframes
 * - Loop: continuous CSS rule + Animate.css keyframes (infinite)
 *
 * Preview behavior applies Animate.css classes directly to the block in the
 * editor canvas and removes them after the animation completes.
 */
import { useCallback } from "react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { CollapsibleCard } from "@/components/ui/collapsible-card";
import { Zap } from "lucide-react";
import type { BlockAnimation, EntryAnimation, HoverAnimation, LoopAnimation } from "@shared/schema-types";
import { entryPresets, hoverPresets, loopPresets } from "@/lib/animation-presets";

interface AnimationPickerProps {
  animation: BlockAnimation | undefined;
  blockId: string;
  onChange: (animation: BlockAnimation | undefined) => void;
}

/** Applies Animate.css classes to the block element in the editor canvas for preview */
function previewOnBlock(blockId: string, animName: string, isLoop = false) {
  const el = document.querySelector(`.block-${blockId}`) as HTMLElement | null;
  if (!el) return;

  const classes = ["animate__animated", `animate__${animName}`];
  if (isLoop) classes.push("animate__infinite");

  el.classList.add(...classes);

  if (!isLoop) {
    const cleanup = () => {
      el.classList.remove(...classes);
      el.removeEventListener("animationend", cleanup);
    };
    el.addEventListener("animationend", cleanup);
  }
}

/** Removes loop animation preview classes from the block element */
function stopLoopPreview(blockId: string, animName: string) {
  const el = document.querySelector(`.block-${blockId}`) as HTMLElement | null;
  if (!el) return;
  el.classList.remove(
    "animate__animated",
    `animate__${animName}`,
    "animate__infinite",
  );
}

export default function AnimationPicker({
  animation,
  blockId,
  onChange,
}: AnimationPickerProps) {
  const entry = animation?.entry;
  const hover = animation?.hover;
  const loop = animation?.loop;

  const setEntry = useCallback(
    (val: EntryAnimation | undefined) => {
      onChange({ ...animation, entry: val });
    },
    [animation, onChange],
  );

  const setHover = useCallback(
    (val: HoverAnimation | undefined) => {
      onChange({ ...animation, hover: val });
    },
    [animation, onChange],
  );

  const setLoop = useCallback(
    (val: LoopAnimation | undefined) => {
      // Stop previous loop preview if clearing
      if (!val && loop) stopLoopPreview(blockId, loop.name);
      onChange({ ...animation, loop: val });
    },
    [animation, loop, blockId, onChange],
  );

  return (
    <CollapsibleCard title="Animations" icon={Zap} defaultOpen={false}>
      {/* Entry Animation */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold text-gray-800">Entry (scroll)</Label>
        <div className="grid grid-cols-2 gap-1">
          {/* None option */}
          <button
            onClick={() => setEntry(undefined)}
            className={`h-7 px-2 text-xs border rounded-none transition-colors ${
              !entry
                ? "bg-gray-800 text-white border-gray-800"
                : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
            }`}
          >
            None
          </button>
          {entryPresets.map((preset) => (
            <button
              key={preset.name}
              onClick={() => {
                setEntry({
                  name: preset.name,
                  duration: entry?.duration ?? 1000,
                  delay: entry?.delay ?? 0,
                  once: entry?.once ?? true,
                });
                previewOnBlock(blockId, preset.name);
              }}
              className={`h-7 px-2 text-xs border rounded-none transition-colors truncate ${
                entry?.name === preset.name
                  ? "bg-gray-800 text-white border-gray-800"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
              }`}
              title={preset.label}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Entry options — shown only when an entry preset is selected */}
        {entry && (
          <div className="space-y-3 pt-1 border-t border-gray-100">
            <div>
              <Label className="text-xs text-gray-600">
                Duration: {entry.duration ?? 1000}ms
              </Label>
              <Slider
                min={200}
                max={3000}
                step={50}
                value={[entry.duration ?? 1000]}
                onValueChange={([val]) =>
                  setEntry({ ...entry, duration: val })
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-600">
                Delay: {entry.delay ?? 0}ms
              </Label>
              <Slider
                min={0}
                max={3000}
                step={50}
                value={[entry.delay ?? 0]}
                onValueChange={([val]) => setEntry({ ...entry, delay: val })}
                className="mt-1"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id={`entry-once-${blockId}`}
                checked={entry.once ?? true}
                onChange={(e) =>
                  setEntry({ ...entry, once: e.target.checked })
                }
                className="h-3 w-3"
              />
              <Label
                htmlFor={`entry-once-${blockId}`}
                className="text-xs text-gray-600 cursor-pointer"
              >
                Play once only
              </Label>
            </div>
          </div>
        )}
      </div>

      {/* Hover Animation */}
      <div className="space-y-3 mt-4">
        <Label className="text-sm font-semibold text-gray-800">Hover</Label>
        <div className="grid grid-cols-2 gap-1">
          <button
            onClick={() => setHover(undefined)}
            className={`h-7 px-2 text-xs border rounded-none transition-colors ${
              !hover
                ? "bg-gray-800 text-white border-gray-800"
                : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
            }`}
          >
            None
          </button>
          {hoverPresets.map((preset) => (
            <button
              key={preset.name}
              onMouseEnter={() => previewOnBlock(blockId, preset.name)}
              onClick={() => setHover({ name: preset.name })}
              className={`h-7 px-2 text-xs border rounded-none transition-colors truncate ${
                hover?.name === preset.name
                  ? "bg-gray-800 text-white border-gray-800"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
              }`}
              title={preset.label}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loop Animation */}
      <div className="space-y-3 mt-4">
        <Label className="text-sm font-semibold text-gray-800">Loop (continuous)</Label>
        <div className="grid grid-cols-2 gap-1">
          <button
            onClick={() => setLoop(undefined)}
            className={`h-7 px-2 text-xs border rounded-none transition-colors ${
              !loop
                ? "bg-gray-800 text-white border-gray-800"
                : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
            }`}
          >
            None
          </button>
          {loopPresets.map((preset) => (
            <button
              key={preset.name}
              onClick={() => {
                if (loop) stopLoopPreview(blockId, loop.name);
                setLoop({ name: preset.name });
                previewOnBlock(blockId, preset.name, true);
              }}
              className={`h-7 px-2 text-xs border rounded-none transition-colors truncate ${
                loop?.name === preset.name
                  ? "bg-gray-800 text-white border-gray-800"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
              }`}
              title={preset.label}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>
    </CollapsibleCard>
  );
}
