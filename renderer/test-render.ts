import { renderBlocksToHtml, getHydrationScript } from "./to-html";
import { PageTemplate } from "./templates/page";
import type { BlockData } from "./react/block-types";

/**
 * Get test blocks data
 */
export function getTestBlocks(): BlockData[] {
	return [
		{
			blockName: "core/heading",
			content: "Welcome to the Demo Page",
			level: 1,
			className: "text-4xl font-bold",
			interactive: false, // Static block
		},
		{
			blockName: "core/heading",
			content: "This is a static heading",
			level: 2,
			// interactive undefined = static
		},
		{
			blockName: "core/counter",
			initialCount: 5,
			interactive: true, // Interactive block - will show loading placeholder
		},
		{
			blockName: "core/heading",
			content: "Another static heading after interactive block",
			level: 3,
		},
		{
			blockName: "core/counter",
			initialCount: 10,
			interactive: true, // Another interactive block
		},
	];
}

/**
 * Render test page HTML
 */
export function renderTestPage(
	baseUrl: string = "http://localhost:3001/test",
): string {
	const blocks = getTestBlocks();
	const blockContentHtml = renderBlocksToHtml(blocks);
	const hydrateScript = getHydrationScript();

	return PageTemplate(
		"Renderer Test Page",
		"Testing the island architecture renderer with static and interactive blocks",
		baseUrl,
		"", // headScripts
		blockContentHtml,
		"", // bodyScripts
		hydrateScript,
	);
}

/**
 * Test script to see HTML output in console
 */
export function testRenderer() {
	const blocks = getTestBlocks();
	const blockContentHtml = renderBlocksToHtml(blocks);

	console.log("=".repeat(80));
	console.log("BLOCK CONTENT HTML OUTPUT:");
	console.log("=".repeat(80));
	console.log(blockContentHtml);
	console.log("=".repeat(80));
	console.log("\n");

	// Get hydration script
	const hydrateScript = getHydrationScript();
	console.log("HYDRATION SCRIPT:");
	console.log(hydrateScript);
	console.log("\n");

	// Create full page HTML
	const fullPageHtml = renderTestPage("http://localhost:3000/test");

	console.log("=".repeat(80));
	console.log("FULL PAGE HTML OUTPUT:");
	console.log("=".repeat(80));
	console.log(fullPageHtml);
	console.log("=".repeat(80));
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
	testRenderer();
}
