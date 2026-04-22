import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { assertInstallDirExists } from "../assert-install-dir.js";
import { COMPOSE_FILE } from "../constants.js";
import { composeFileArgs } from "../compose-args.js";
import { runSpawn } from "../run-spawn.js";

/**
 * Parses `nextpress uninstall [--yes]` (destructive; requires explicit consent).
 */
export function parseUninstallArgv(argv: string[]): { yes: boolean } {
	return { yes: argv.includes("--yes") || argv.includes("-y") };
}

function removeInstallDirectory(installDir: string): number {
	console.log(`Removing install directory: ${installDir}\n`);
	let r = runSpawn("rm", ["-rf", installDir], { silent: true });
	if (!r.ok) {
		console.log("Elevating with sudo to remove install directory…\n");
		r = runSpawn("sudo", ["rm", "-rf", installDir]);
	}
	if (!r.ok) {
		console.error(
			`Could not remove ${installDir}. Stop containers if any file is busy, then remove manually.`,
		);
		return r.code ?? 1;
	}
	return 0;
}

function pruneNextpressImages(): void {
	try {
		const out = execFileSync("docker", ["images", "-q", "husseinkizz/nextpress"], {
			encoding: "utf8",
		});
		const ids = out
			.trim()
			.split(/\n/)
			.filter(Boolean);
		for (const id of ids) {
			runSpawn("docker", ["rmi", "-f", id], { silent: true });
		}
	} catch {
		// ignore when no images / docker errors
	}
}

/**
 * Stops stack, removes compose volumes, prunes NextPress images, deletes install dir (no external cleanup script).
 */
export function runUninstall(installDir: string, argv: string[]): number {
	const { yes } = parseUninstallArgv(argv);
	if (!yes) {
		console.error(
			"Refusing to uninstall without --yes. This removes containers, named volumes, images, and the install directory.\n" +
				`Run: npx nextpress uninstall --yes   (install dir: ${installDir})`,
		);
		return 1;
	}

	const check = assertInstallDirExists(installDir);
	if (!check.status) {
		console.error(check.message);
		return 1;
	}

	const composePath = path.join(installDir, COMPOSE_FILE);
	if (existsSync(composePath)) {
		console.log("Stopping stack and removing named volumes…\n");
		const down = runSpawn("docker", [...composeFileArgs(), "down", "-v", "--remove-orphans"], {
			cwd: installDir,
		});
		if (!down.ok) {
			console.warn(down.message);
		}
	} else {
		console.warn(`No ${COMPOSE_FILE} found; skipping compose down.\n`);
	}

	console.log("Removing NextPress images (best effort)…\n");
	pruneNextpressImages();

	const rm = removeInstallDirectory(installDir);
	if (rm !== 0) return rm;

	console.log("\nUninstall finished.\n");
	return 0;
}
