import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { COMPOSE_FILE, DEFAULT_COMPOSE_SPEC_URL } from "./constants.js";

export type ResolveComposeResult =
	| { status: true; data: string; source: string }
	| { status: false; message: string };

async function fetchFromUrl(
	url: string,
	sourceLabel: string,
): Promise<ResolveComposeResult> {
	try {
		const res = await fetch(url, { signal: AbortSignal.timeout(45_000) });
		if (!res.ok) {
			return {
				status: false,
				message: `Could not fetch compose (${res.status} ${res.statusText}): ${url}`,
			};
		}
		const data = await res.text();
		if (!data.trim()) {
			return { status: false, message: `Empty response from ${sourceLabel}` };
		}
		return { status: true, data, source: url };
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		return {
			status: false,
			message: `Fetch failed (${sourceLabel}): ${msg}`,
		};
	}
}

/**
 * Resolves production compose YAML the same way your deploy flow expects:
 * 1. `NEXTPRESS_COMPOSE_URL` — pin to branch/tag raw URL after deploy
 * 2. `./docker-compose.prod.yml` under cwd — when you run the CLI from the repo root after `./deploy.sh`
 * 3. Default raw URL (main), same default as the published CLI package
 */
export async function resolveComposeYaml(): Promise<ResolveComposeResult> {
	const envUrl = process.env.NEXTPRESS_COMPOSE_URL?.trim();
	if (envUrl) {
		const r = await fetchFromUrl(envUrl, "NEXTPRESS_COMPOSE_URL");
		if (r.status) {
			return r;
		}
		return {
			status: false,
			message: `${r.message}\nFix NEXTPRESS_COMPOSE_URL or unset it to fall back to cwd / default URL.`,
		};
	}

	const cwdPath = join(process.cwd(), COMPOSE_FILE);
	if (existsSync(cwdPath)) {
		try {
			const data = readFileSync(cwdPath, "utf8");
			if (!data.trim()) {
				return { status: false, message: `Empty file: ${cwdPath}` };
			}
			return { status: true, data, source: cwdPath };
		} catch (e) {
			const msg = e instanceof Error ? e.message : String(e);
			return { status: false, message: `Could not read ${cwdPath}: ${msg}` };
		}
	}

	return fetchFromUrl(DEFAULT_COMPOSE_SPEC_URL, "default compose URL");
}
