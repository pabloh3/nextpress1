import { runLocalInstall } from "../run-local-install.js";

export { parseInstallArgv } from "../parse-install-argv.js";

/**
 * Writes compose (resolved at runtime), bootstrap Caddy, `.env`, then Docker Compose pull/up (Hub).
 */
export async function runInstall(
	installDir: string,
	argv: string[],
): Promise<number> {
	console.log(
		"NextPress install (compose from URL/cwd; pre-built images via docker compose pull — no docker build)…\n",
	);
	return runLocalInstall(installDir, argv);
}
