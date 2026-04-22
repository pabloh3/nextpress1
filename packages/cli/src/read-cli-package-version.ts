import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Reads `version` from this package's `package.json` (next to `dist/` when built).
 */
export function readCliPackageVersion(): string {
	const here = dirname(fileURLToPath(import.meta.url));
	const pkgPath = join(here, "..", "package.json");
	const raw = readFileSync(pkgPath, "utf8");
	const { version } = JSON.parse(raw) as { version?: string };
	return typeof version === "string" && version.length > 0 ? version : "0.0.0";
}
