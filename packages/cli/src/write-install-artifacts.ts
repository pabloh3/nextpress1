import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { COMPOSE_FILE } from "./constants.js";
import { INITIAL_CADDYFILE } from "./initial-caddyfile.js";

/**
 * Writes or updates `.env` with secrets and `NEXTPRESS_VERSION` (Docker Hub tag for `husseinkizz/nextpress`, e.g. `latest` or `beta-v1.0.2`).
 */
export function writeOrUpdateEnv(
	installDir: string,
	versionTag: string,
): { created: boolean } {
	const envPath = path.join(installDir, ".env");
	if (!existsSync(envPath)) {
		const password = randomBytes(16).toString("hex");
		const sessionSecret = randomBytes(32).toString("base64");
		const body = `POSTGRES_PASSWORD=${password}
SESSION_SECRET=${sessionSecret}
NEXTPRESS_VERSION=${versionTag}
`;
		writeFileSync(envPath, body, { encoding: "utf8", mode: 0o600 });
		return { created: true };
	}

	let text = readFileSync(envPath, "utf8");
	if (/^NEXTPRESS_VERSION=/m.test(text)) {
		text = text.replace(/^NEXTPRESS_VERSION=.*$/m, `NEXTPRESS_VERSION=${versionTag}`);
	} else {
		text = `${text.trimEnd()}\nNEXTPRESS_VERSION=${versionTag}\n`;
	}
	writeFileSync(envPath, text, "utf8");
	return { created: false };
}

/**
 * Writes bundled `docker-compose.prod.yml` into the install directory.
 */
export function writeComposeFile(installDir: string, composeYaml: string): void {
	mkdirSync(installDir, { recursive: true });
	writeFileSync(path.join(installDir, COMPOSE_FILE), composeYaml, "utf8");
}

/**
 * Creates `caddy_config/Caddyfile` used before the app sets a real hostname.
 */
export function writeInitialCaddyfile(installDir: string): void {
	const dir = path.join(installDir, "caddy_config");
	const caddyfilePath = path.join(dir, "Caddyfile");
	mkdirSync(dir, { recursive: true });
	if (existsSync(caddyfilePath)) {
		return;
	}
	writeFileSync(caddyfilePath, INITIAL_CADDYFILE, "utf8");
}
