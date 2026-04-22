import { assertInstallDirExists } from "../assert-install-dir.js";
import { composeFileArgs } from "../compose-args.js";
import { runSpawn } from "../run-spawn.js";

/**
 * Restarts only the Caddy reverse proxy (picks up `Caddyfile` / cert changes quickly).
 */
export function runReload(installDir: string): number {
	const check = assertInstallDirExists(installDir);
	if (!check.status) {
		console.error(check.message);
		return 1;
	}

	console.log(`Reloading Caddy in ${installDir}…\n`);
	const r = runSpawn("docker", [...composeFileArgs(), "restart", "caddy"], {
		cwd: installDir,
	});
	return r.ok ? 0 : r.code ?? 1;
}
