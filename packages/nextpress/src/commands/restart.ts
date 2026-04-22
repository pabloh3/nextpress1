import { assertInstallDirExists } from "../assert-install-dir.js";
import { composeFileArgs } from "../compose-args.js";
import { runSpawn } from "../run-spawn.js";

/**
 * Restarts every service in the compose project.
 */
export function runRestart(installDir: string): number {
	const check = assertInstallDirExists(installDir);
	if (!check.status) {
		console.error(check.message);
		return 1;
	}

	console.log(`Restarting all services in ${installDir}…\n`);
	const r = runSpawn("docker", [...composeFileArgs(), "restart"], { cwd: installDir });
	return r.ok ? 0 : r.code ?? 1;
}
