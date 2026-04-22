import { mkdirSync } from "node:fs";
import { COMPOSE_FILE, DEFAULT_VERSION } from "./constants.js";
import { composeFileArgs } from "./compose-args.js";
import { resolveInstallPath } from "./resolve-install-path.js";
import { resolveComposeYaml } from "./resolve-compose-yaml.js";
import { runSpawn } from "./run-spawn.js";
import { tryChownToSudoUser } from "./try-chown-install-dir.js";
import {
	writeComposeFile,
	writeInitialCaddyfile,
	writeOrUpdateEnv,
} from "./write-install-artifacts.js";
import { parseInstallArgv } from "./parse-install-argv.js";

function assertDockerAvailable(): { ok: true } | { ok: false; message: string } {
	const r = runSpawn("docker", ["compose", "version"], { silent: true });
	if (!r.ok) {
		return {
			ok: false,
			message:
				"Docker Compose v2 not found. Install Docker Engine + Compose plugin, then run this command again.",
		};
	}
	return { ok: true };
}

function sanitizeVersionTag(raw: string): string {
	return raw.replace(/[^a-zA-Z0-9._-]/g, "");
}

function printPostInstallHints(installDir: string, version: string): void {
	console.log("\n============================================");
	console.log("       Installation complete");
	console.log("============================================\n");
	console.log(`NextPress ${version} is running (Docker Hub image + compose stack).\n`);
	console.log(
		"Open the setup wizard in your browser (use your server IP or hostname on port 80).\n",
	);
	console.log("Useful commands:");
	console.log(`  cd ${installDir} && docker compose -f ${COMPOSE_FILE} logs -f`);
	console.log(`  cd ${installDir} && docker compose -f ${COMPOSE_FILE} down`);
	console.log(`  cd ${installDir} && docker compose -f ${COMPOSE_FILE} up -d`);
	console.log(`  npx nextpress -d ${installDir} upgrade`);
	console.log(`  npx nextpress -d ${installDir} uninstall --yes\n`);
}

/**
 * Install: same flow as `install.sh` — resolve compose, write bootstrap + `.env`, then `docker compose pull` and `up -d`.
 * Uses only `image:` services from that YAML (no `docker compose build`, no `--build`).
 */
export async function runLocalInstall(
	installDirRaw: string,
	argv: string[],
): Promise<number> {
	let installDir: string;
	try {
		installDir = resolveInstallPath(installDirRaw);
	} catch (e) {
		console.error(e instanceof Error ? e.message : String(e));
		return 1;
	}

	const { version: versionArg } = parseInstallArgv(argv);
	const version = versionArg
		? sanitizeVersionTag(versionArg)
		: DEFAULT_VERSION;
	if (versionArg && version.length === 0) {
		console.error("Invalid --version tag.");
		return 1;
	}

	const docker = assertDockerAvailable();
	if (!docker.ok) {
		console.error(docker.message);
		return 1;
	}

	try {
		mkdirSync(installDir, { recursive: true });
	} catch (e) {
		console.error(
			`Could not create ${installDir}: ${e instanceof Error ? e.message : String(e)}. Try sudo or a writable --install-dir.`,
		);
		return 1;
	}

	console.log("Resolving docker-compose.prod.yml…\n");
	const resolved = await resolveComposeYaml();
	if (!resolved.status) {
		console.error(resolved.message);
		return 1;
	}
	console.log(`Using compose from: ${resolved.source}\n`);

	writeComposeFile(installDir, resolved.data);
	writeInitialCaddyfile(installDir);
	const env = writeOrUpdateEnv(installDir, version);
	console.log(
		env.created ? "Generated new .env with secrets." : "Updated NEXTPRESS_VERSION in existing .env.",
	);

	tryChownToSudoUser(installDir);

	console.log("\nPulling images from Docker Hub…\n");
	const pull = runSpawn("docker", [...composeFileArgs(), "pull"], {
		cwd: installDir,
	});
	if (!pull.ok) {
		return pull.code ?? 1;
	}

	console.log("\nStarting services…\n");
	const up = runSpawn("docker", [...composeFileArgs(), "up", "-d"], {
		cwd: installDir,
	});
	if (!up.ok) {
		return up.code ?? 1;
	}

	runSpawn("sh", ["-c", "sleep 3"], { silent: true });
	printPostInstallHints(installDir, version);
	return 0;
}
