import path from "node:path";

/**
 * Resolves and normalizes the install directory to an absolute path (no trailing slash).
 */
export function resolveInstallPath(installDir: string): string {
	const resolved = path.resolve(installDir.trim());
	if (resolved === "/" || resolved === "") {
		throw new Error("Refusing to use root or empty install directory.");
	}
	return resolved;
}
