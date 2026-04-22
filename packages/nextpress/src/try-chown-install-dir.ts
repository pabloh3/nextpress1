import { runSpawn } from "./run-spawn.js";

/**
 * When running under `sudo`, hand ownership back to `SUDO_USER` so compose can edit files without root.
 */
export function tryChownToSudoUser(installDir: string): void {
	if (process.platform === "win32") return;
	if (typeof process.getuid !== "function" || process.getuid() !== 0) return;
	const user = process.env.SUDO_USER?.trim();
	if (!user) return;
	runSpawn("chown", ["-R", `${user}:${user}`, installDir]);
}
