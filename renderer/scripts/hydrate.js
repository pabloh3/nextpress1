const HYDRATION_CONTAINER_ID = "react-island-";

/**
 * Replaces loading placeholder with actual component content
 */
function replacePlaceholder(island) {
	const placeholder = island.querySelector("[data-loading-placeholder]");
	const actualContent = island.querySelector("[data-actual-content]");

	if (placeholder && actualContent) {
		// Move actual content out of the hidden div
		while (actualContent.firstChild) {
			island.insertBefore(actualContent.firstChild, placeholder);
		}
		// Remove placeholder and container
		placeholder.remove();
		actualContent.remove();
	}
}

/**
 * Hydrates React islands on the page
 */
async function hydrateIslands() {
	// Use ESM CDN URLs for React (no bundling needed)
	let createRoot, React, BLOCK_COMPONENTS;

	try {
		// Import React and ReactDOM from ESM CDN
		const reactDomClient = await import(
			"https://esm.sh/react-dom@18.3.1/client"
		);
		createRoot = reactDomClient.createRoot;

		React = await import("https://esm.sh/react@18.3.1");

		// Import block components from server endpoint
		const blockComponentsModule = await import(
			"/renderer/react/block-components.js"
		);
		BLOCK_COMPONENTS = blockComponentsModule.BLOCK_COMPONENTS;
	} catch (error) {
		console.error("Failed to load React or block components:", error);
		return;
	}

	// Find all elements marked as React Islands
	const islands = document.querySelectorAll(
		`[id^="${HYDRATION_CONTAINER_ID}"]`,
	);

	islands.forEach((island) => {
		const componentName = island.getAttribute("data-block-component");
		const propsJson = island.getAttribute("data-block-props");

		if (!componentName || !propsJson) {
			console.warn("Island missing component name or props", island);
			return;
		}

		try {
			// Parse props (handle escaped quotes)
			const props = JSON.parse(propsJson);
			const Component = BLOCK_COMPONENTS[componentName];

			if (!Component) {
				console.warn(`Component not found for block: ${componentName}`);
				return;
			}

			// Replace placeholder with actual content before hydration
			replacePlaceholder(island);

			// Hydrate the component using React.createElement (no JSX in .js file)
			const root = createRoot(island);
			root.render(React.createElement(Component, props));
		} catch (error) {
			console.error("Failed to hydrate block:", componentName, error);
			// Show error state
			const placeholder = island.querySelector("[data-loading-placeholder]");
			if (placeholder) {
				placeholder.innerHTML = `
					<div style="
						padding: 1rem;
						background: #fee;
						border: 1px solid #fcc;
						border-radius: 0.375rem;
						color: #c33;
						font-size: 0.875rem;
					">
						Error loading ${componentName}. Please refresh the page.
					</div>
				`;
			}
		}
	});
}

// Run hydration when DOM is ready
if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", hydrateIslands);
} else {
	// DOM already loaded
	hydrateIslands();
}
