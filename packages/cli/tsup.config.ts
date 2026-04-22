import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["src/cli.ts"],
	format: ["esm"],
	platform: "node",
	target: "node20",
	clean: true,
	outDir: "dist",
	sourcemap: true,
	banner: {
		js: "#!/usr/bin/env node",
	},
});
