import { assertInstallDirExists } from "../assert-install-dir.js";
import { composeFileArgs } from "../compose-args.js";
import { runSpawn } from "../run-spawn.js";

/**
 * Refreshes pre-pulled images and recreates containers (`docker compose pull && up -d`), no local image build.
 */
export function runUpgrade(installDir: string): number {
	const check = assertInstallDirExists(installDir);
	if (!check.status) {
		console.error(check.message);
		return 1;
	}

	console.log(`Upgrading stack in ${installDir}…\n`);
	const pull = runSpawn("docker", [...composeFileArgs(), "pull"], { cwd: installDir });
	if (!pull.ok) {
		return pull.code ?? 1;
	}
	const up = runSpawn("docker", [...composeFileArgs(), "up", "-d"], { cwd: installDir });
	return up.ok ? 0 : up.code ?? 1;
}
