import { assertInstallDirExists } from "../assert-install-dir.js";
import { composeFileArgs } from "../compose-args.js";
import { runSpawn } from "../run-spawn.js";

/** Prints `docker compose ps` for the install directory. */
export function runStatus(installDir: string): number {
	const check = assertInstallDirExists(installDir);
	if (!check.status) {
		console.error(check.message);
		return 1;
	}

	const r = runSpawn("docker", [...composeFileArgs(), "ps"], { cwd: installDir });
	return r.ok ? 0 : r.code ?? 1;
}
