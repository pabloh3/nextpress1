import { assertInstallDirExists } from "../assert-install-dir.js";
import { composeFileArgs } from "../compose-args.js";
import { runSpawn } from "../run-spawn.js";

/**
 * Tails compose logs; extra argv is forwarded after `logs` (e.g. service names).
 */
export function runLogs(installDir: string, argv: string[]): number {
	const check = assertInstallDirExists(installDir);
	if (!check.status) {
		console.error(check.message);
		return 1;
	}

	const args = [...composeFileArgs(), "logs", "-f", ...argv];
	const r = runSpawn("docker", args, { cwd: installDir });
	return r.ok ? 0 : r.code ?? 1;
}
