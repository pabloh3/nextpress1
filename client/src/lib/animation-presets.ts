/**
 * Animation preset registry for the PageBuilder animation system.
 *
 * Uses Animate.css keyframe names as the animation source.
 * Three categories: entry (scroll-triggered), hover (CSS :hover), loop (infinite CSS).
 * Only entry animations require AOS. Hover and loop are pure CSS.
 */
import type { BlockAnimation, HoverAnimation, LoopAnimation } from "@shared/schema-types";

/** A single animation preset option shown in the sidebar picker */
export interface AnimationPreset {
  /** Animate.css class name (without `animate__` prefix) */
  name: string;
  /** Human-readable label for the sidebar UI */
  label: string;
}

/** Entry presets — scroll-triggered entrance animations via AOS + Animate.css */
export const entryPresets: AnimationPreset[] = [
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
export const hoverPresets: AnimationPreset[] = [
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
export const loopPresets: AnimationPreset[] = [
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

/**
 * Generates CSS rule for a hover animation.
 * References the Animate.css @keyframes name directly in a :hover rule.
 */
export function generateHoverAnimationCSS(
  blockId: string,
  hover: HoverAnimation,
): string {
  return `.block-${blockId}:hover { animation: ${hover.name} 1s both; }`;
}

/**
 * Generates CSS rule for a loop/continuous animation.
 * Scopes to `.aos-animate` when an entry animation also exists so the loop
 * starts only after AOS triggers the entry animation.
 */
export function generateLoopAnimationCSS(
  blockId: string,
  loop: LoopAnimation,
  hasEntry: boolean,
): string {
  const selector = hasEntry
    ? `.block-${blockId}.aos-animate`
    : `.block-${blockId}`;
  return `${selector} { animation: ${loop.name} 1s infinite both; }`;
}

/**
 * Generates all animation CSS rules for a single block (hover + loop).
 * Entry animations are handled via data-aos-* attributes — no CSS needed here.
 * Returns empty string if no hover/loop animations are configured.
 */
export function generateBlockAnimationCSS(
  blockId: string,
  animation: BlockAnimation,
): string {
  const rules: string[] = [];
  const hasEntry = !!animation.entry;

  if (animation.hover) {
    rules.push(generateHoverAnimationCSS(blockId, animation.hover));
  }

  if (animation.loop) {
    rules.push(generateLoopAnimationCSS(blockId, animation.loop, hasEntry));
  }

  return rules.join("\n");
}
