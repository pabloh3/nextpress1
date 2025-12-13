import type { BlockConfig, BlockContent } from "@shared/schema-types";
import type { BlockData } from "./react/block-types";

/**
 * Transforms BlockConfig from database to BlockData for renderer
 * Handles all BlockConfig properties: styles, customCss, other, children, settings
 *
 * @param block - BlockConfig from database
 * @returns BlockData compatible with renderer, or null if block cannot be adapted
 */
export function adaptBlockConfigToBlockData(
	block: BlockConfig,
): BlockData | null {
	// If other.html override exists, skip component rendering
	// The renderer will handle this separately
	if (block.other?.html) {
		// Return a special marker that renderer can detect
		return {
			blockName: block.name as any,
			interactive: block.isReactive || false,
			htmlOverride: block.other.html,
			style: block.styles,
			className: block.other.classNames,
			customCss: block.customCss,
			userCss: block.other.css,
			attributes: block.other.attributes,
		} as any;
	}

	// Extract props from block.content based on kind
	const contentProps = extractContentProps(block.name, block.content);
	if (!contentProps) {
		console.warn(`Could not extract content props for block ${block.name}`);
		return null;
	}

	// Merge styles
	const mergedStyles = {
		...block.styles,
		...(contentProps.style || {}),
	};

	// Merge classNames
	const mergedClassName = [block.other?.classNames, contentProps.className]
		.filter(Boolean)
		.join(" ");

	// Recursively adapt children for container blocks
	const adaptedChildren = block.children
		? block.children
				.map((child) => adaptBlockConfigToBlockData(child))
				.filter((child): child is BlockData => child !== null)
		: undefined;

	// Build base BlockData
	const baseData: any = {
		blockName: block.name,
		interactive: block.isReactive || false,
		style: Object.keys(mergedStyles).length > 0 ? mergedStyles : undefined,
		className: mergedClassName || undefined,
		customCss: block.customCss,
		userCss: block.other?.css,
		attributes: {
			...block.other?.attributes,
			...(contentProps.attributes || {}),
		},
		// Merge settings into props
		...block.settings,
		// Add content-specific props
		...contentProps,
	};

	// Add children if present
	if (adaptedChildren && adaptedChildren.length > 0) {
		baseData.children = adaptedChildren;
	}

	return baseData as BlockData;
}

/**
 * Extracts props from BlockContent based on content kind and block name
 */
function extractContentProps(
	blockName: string,
	content: BlockContent | undefined,
): Record<string, any> | null {
	if (!content) {
		return {};
	}

	// Handle different content kinds
	switch (content.kind) {
		case "text": {
			const props: any = {
				content: content.value || "",
			};

			// Block-specific extractions
			if (blockName === "core/heading") {
				// Heading-specific: level, anchor, textAlign
				props.level = (content as any).level || 2;
				props.anchor = (content as any).anchor;
				props.textAlign = content.textAlign || (content as any).textAlign;
			} else if (blockName === "core/paragraph") {
				// Paragraph-specific: textAlign, dropCap
				props.textAlign = content.textAlign || (content as any).textAlign;
				props.dropCap = content.dropCap || false;
			} else if (blockName === "core/button" || blockName === "core/buttons") {
				// Button-specific: link, target
				props.link = (content as any).link;
				props.target = (content as any).target;
				props.variant = (content as any).variant;
			} else if (blockName === "core/list") {
				// List-specific: ordered, start
				props.ordered = (content as any).ordered || false;
				props.start = (content as any).start;
			} else if (blockName === "core/quote") {
				// Quote-specific: citation
				props.citation = (content as any).citation;
			} else if (blockName === "core/pullquote") {
				// Pullquote-specific: citation
				props.citation = (content as any).citation;
			}

			return props;
		}

		case "markdown": {
			return {
				content: content.value || "",
				textAlign: content.textAlign,
			};
		}

		case "media": {
			const props: any = {
				url: content.url,
				alt: content.alt || "",
				caption: content.caption,
				mediaType: content.mediaType,
			};

			// Media-specific extractions
			if (blockName === "core/image") {
				props.width = (content as any).width;
				props.height = (content as any).height;
				props.objectFit = (content as any).objectFit;
				// Image link properties
				props.href = (content as any).href;
				props.linkTarget =
					(content as any).linkTarget || (content as any).target;
				props.linkDestination = (content as any).linkDestination;
				props.rel = (content as any).rel;
				props.title = (content as any).title;
			} else if (blockName === "core/video") {
				props.autoplay = (content as any).autoplay;
				props.loop = (content as any).loop;
				props.controls = (content as any).controls;
				props.poster = (content as any).poster;
			} else if (blockName === "core/audio") {
				props.autoplay = (content as any).autoplay;
				props.loop = (content as any).loop;
				props.controls = (content as any).controls;
			} else if (blockName === "core/gallery") {
				props.images = (content as any).images || [];
				props.columns = (content as any).columns;
			} else if (blockName === "core/file") {
				props.filename = (content as any).filename;
				props.fileSize = (content as any).fileSize;
			} else if (blockName === "core/media-text") {
				props.mediaPosition = (content as any).mediaPosition || "left";
				props.verticalAlignment = (content as any).verticalAlignment;
				// Media-text link properties
				props.href = (content as any).href;
				props.linkTarget =
					(content as any).linkTarget || (content as any).target;
				props.rel = (content as any).rel;
				props.title = (content as any).title;
			} else if (blockName === "core/cover") {
				props.overlayColor = (content as any).overlayColor;
				props.overlayOpacity = (content as any).overlayOpacity;
				props.minHeight = (content as any).minHeight;
			}

			return props;
		}

		case "html": {
			return {
				content: content.value || "",
				sanitized: content.sanitized || false,
			};
		}

		case "structured": {
			// Extract structured data based on block type
			const data = content.data || {};

			if (blockName === "core/columns") {
				return {
					gap: data.gap,
					verticalAlignment: data.verticalAlignment,
					horizontalAlignment: data.horizontalAlignment,
					direction: data.direction,
					columnLayout: data.columnLayout, // From settings, but may be in data
				};
			} else if (blockName === "core/group") {
				return {
					layout: data.layout,
					tagName: data.tagName || "div",
				};
			} else if (blockName === "core/spacer") {
				return {
					height: data.height || "40px",
				};
			} else if (blockName === "core/buttons") {
				// Buttons are stored in content.data.buttons array
				// Each button has: id, text, url, linkTarget, rel, title, className
				return {
					buttons: data.buttons || [],
					layout: data.layout,
					orientation: data.orientation,
				};
			} else if (blockName === "core/table") {
				return {
					headers: data.headers,
					rows: data.rows,
					hasFixedLayout: data.hasFixedLayout || false,
				};
			} else if (blockName === "core/code") {
				return {
					content: data.content || "",
					language: data.language,
				};
			} else if (blockName === "core/preformatted") {
				return {
					content: data.content || "",
				};
			}

			// Generic structured data
			return { ...data };
		}

		case "empty": {
			return {};
		}

		default: {
			// Handle undefined or unknown content
			return {};
		}
	}
}
