import { mkdirSync } from "node:fs";
import {
	COMPOSE_FILE,
	DEFAULT_INSTALL_DIR,
	DEFAULT_VERSION,
	PUBLISHED_CLI_PACKAGE,
} from "./constants.js";
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
	console.log(`  nextpress -d ${installDir} upgrade`);
	console.log(`  nextpress -d ${installDir} uninstall --yes\n`);
}

/**
 * Install: resolve compose, write bootstrap + `.env`, then `docker compose pull` and `up -d`.
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

	const { version: versionArg, error } = parseInstallArgv(argv);
	if (error) {
		console.error(error);
		return 1;
	}
	if (versionArg && sanitizeVersionTag(versionArg) !== versionArg) {
		console.error(
			"Invalid --version tag. Use only letters, numbers, dots, underscores, and dashes.",
		);
		return 1;
	}
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
		const msg = e instanceof Error ? e.message : String(e);
		const code =
			e && typeof e === "object" && "code" in e
				? String((e as { code?: string }).code)
				: "";
		if (code === "EACCES" || code === "EPERM") {
			console.error(
				[
					`Could not create ${installDir}: ${msg}.`,
					"",
					`Install under a directory you own (install the CLI once, then):`,
					`  npm install -g ${PUBLISHED_CLI_PACKAGE}`,
					`  nextpress install --install-dir "$HOME/nextpress"`,
					"",
					`Or use the default ${DEFAULT_INSTALL_DIR} on a server:`,
					`  sudo npm install -g ${PUBLISHED_CLI_PACKAGE}`,
					`  sudo nextpress install`,
				].join("\n"),
			);
		} else {
			console.error(`Could not create ${installDir}: ${msg}.`);
		}
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
