import { spawnSync } from "node:child_process";

export type SpawnOutcome = {
	ok: boolean;
	code: number | null;
	message: string;
};

/**
 * Runs a subprocess with inherited stdio (suitable for docker / sudo flows).
 */
export function runSpawn(
	command: string,
	args: string[],
	options: { cwd?: string; silent?: boolean } = {},
): SpawnOutcome {
	const r = spawnSync(command, args, {
		stdio: options.silent ? "pipe" : "inherit",
		cwd: options.cwd,
		env: process.env,
		shell: false,
	});
	if (r.error) {
		return { ok: false, code: null, message: r.error.message };
	}
	const code = r.status ?? 1;
	return {
		ok: code === 0,
		code,
		message: code === 0 ? "OK" : `Process exited with code ${code}`,
	};
}
