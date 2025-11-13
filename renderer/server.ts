import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { renderTestPage } from "./test-render";

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = new Hono();

// Serve the hydrate script
app.get("/renderer/scripts/hydrate.js", (c) => {
	const hydratePath = join(__dirname, "scripts", "hydrate.js");
	const content = readFileSync(hydratePath, "utf-8");
	return c.text(content, 200, {
		"Content-Type": "application/javascript",
	});
});

// Serve block-components as ESM
app.get("/renderer/react/block-components.js", async (c) => {
	// Generate browser-compatible ESM for block components
	const blockComponentsCode = `
		import * as React from "https://esm.sh/react@18.3.1";
		import Counter from "/renderer/react/counter.js";

		const Heading = (props) => {
			const { content, level, className } = props;
			const Tag = \`h\${level}\`;
			return React.createElement(Tag, { className }, content);
		};

		const CounterBlock = (props) => {
			const { initialCount } = props;
			return React.createElement(Counter, { initialCount });
		};

		export const BLOCK_COMPONENTS = {
			"core/heading": Heading,
			"core/counter": CounterBlock,
		};
	`;

	return c.text(blockComponentsCode, 200, {
		"Content-Type": "application/javascript",
	});
});

// Serve counter component as ESM
app.get("/renderer/react/counter.js", (c) => {
	const counterCode = `
		import * as React from "https://esm.sh/react@18.3.1";

		const Counter = ({ initialCount }) => {
			const [count, setCount] = React.useState(initialCount);
			return React.createElement(
				"div",
				{ className: "interactive-counter" },
				React.createElement("p", null, \`Current Count: \${count}\`),
				React.createElement(
					"button",
					{
						onClick: () => setCount((c) => c + 1),
						type: "button",
					},
					"Increment"
				)
			);
		};

		export default Counter;
	`;

	return c.text(counterCode, 200, {
		"Content-Type": "application/javascript",
	});
});

const port = 3001;

// Test endpoint that renders sample blocks using test-render script
app.get("/test", (c) => {
	const baseUrl = `http://localhost:${port}/test`;
	const html = renderTestPage(baseUrl);
	return c.html(html);
});

// Health check
app.get("/", (c) => {
	return c.json({
		message: "Renderer test server",
		endpoints: {
			test: "/test - View rendered blocks with hydration",
		},
	});
});

// Start server
serve(
	{
		fetch: app.fetch,
		port,
	},
	(info) => {
		console.log(
			`🚀 Renderer test server running on http://localhost:${info.port}`,
		);
		console.log(`📄 Test page: http://localhost:${info.port}/test`);
	},
);
