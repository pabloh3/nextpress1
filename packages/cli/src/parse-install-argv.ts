/**
 * Parses `nextpress install [--version <tag>]` — `tag` is the Docker Hub tag for `husseinkizz/nextpress` (default applied in caller: `latest`).
 */
export function parseInstallArgv(
	argv: string[],
): { version?: string; error?: string } {
	let version: string | undefined;
	for (let i = 0; i < argv.length; i++) {
		const arg = argv[i];
		if (arg === "--version" || arg === "-V") {
			const v = argv[i + 1];
			if (!v || v.startsWith("-")) {
				return {
					version,
					error: `Missing value for ${arg}. Use ${arg} <tag>.`,
				};
			}
			version = v;
			i++;
			continue;
		}

		if (arg.startsWith("-")) {
			return { error: `Unknown install option: ${arg}` };
		}

		return { error: `Unexpected install argument: ${arg}` };
	}
	return { version };
}
