/**
 * Server-side animation CSS generation utilities.
 * Mirrors the logic in client/src/lib/animation-presets.ts but lives in the
 * renderer package so it can be used by the server routes without depending
 * on the client bundle.
 */
import type { BlockConfig, BlockAnimation, HoverAnimation, LoopAnimation } from "@shared/schema-types";

/** Generates CSS rule for a hover animation using Animate.css keyframe name */
function generateHoverCSS(blockId: string, hover: HoverAnimation): string {
  return `.block-${blockId}:hover { animation: ${hover.name} 1s both; }`;
}

/** Generates CSS rule for a loop animation, scoped to .aos-animate when entry also exists */
function generateLoopCSS(
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
 * Generates all animation CSS rules (hover + loop) for a single block.
 * Entry animations are handled via data-aos-* attributes — no CSS needed here.
 * Returns empty string when no hover/loop animations are configured.
 */
export function generateBlockAnimationCSS(
  blockId: string,
  animation: BlockAnimation,
): string {
  const rules: string[] = [];
  const hasEntry = !!animation.entry;

  if (animation.hover) {
    rules.push(generateHoverCSS(blockId, animation.hover));
  }

  if (animation.loop) {
    rules.push(generateLoopCSS(blockId, animation.loop, hasEntry));
  }

  return rules.join("\n");
}

/**
 * Collects animation CSS (hover + loop rules) from all blocks on a page.
 * Called during page rendering to build the <style> block for headScripts.
 */
export function collectPageAnimationCSS(blocks: BlockConfig[]): string {
  return blocks
    .filter((b) => b.other?.animation?.hover || b.other?.animation?.loop)
    .map((b) => generateBlockAnimationCSS(b.id, b.other!.animation!))
    .filter(Boolean)
    .join("\n");
}
