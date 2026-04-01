import type { EntryAnimation, BlockAnimation, HoverAnimation, LoopAnimation } from "./schema-types";

/**
 * Translates entry animation config to data-aos-* HTML attributes.
 * Shared between client-side canvas and SSR rendering.
 */
export function getEntryAnimationAttributes(entry: EntryAnimation): Record<string, string> {
	const attrs: Record<string, string> = {
		"data-aos": `animate__${entry.name}`,
		"data-aos-duration": String(entry.duration ?? 1000),
		"data-aos-once": String(entry.once ?? true),
	};
	if (entry.delay && entry.delay > 0) {
		attrs["data-aos-delay"] = String(entry.delay);
	}
	return attrs;
}

/**
 * Generates CSS rule for a hover animation using Animate.css keyframe names.
 */
export function generateHoverAnimationCSS(blockId: string, hover: HoverAnimation): string {
	return `.block-${blockId}:hover { animation: ${hover.name} 1s both; }`;
}

/**
 * Generates CSS rule for a loop/continuous animation.
 * If block also has entry animation, scopes loop to post-entry state.
 */
export function generateLoopAnimationCSS(blockId: string, loop: LoopAnimation, hasEntry: boolean): string {
	const selector = hasEntry
		? `.block-${blockId}.aos-animate`
		: `.block-${blockId}`;
	return `${selector} { animation: ${loop.name} 1s infinite both; }`;
}

/**
 * Generates all animation CSS rules for a single block.
 * Returns empty string if no hover/loop animations configured.
 */
export function generateBlockAnimationCSS(blockId: string, animation: BlockAnimation): string {
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