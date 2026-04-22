/**
 * Parses `nextpress install [--version <tag>]` — `tag` is the Docker Hub tag for `husseinkizz/nextpress` (default applied in caller: `latest`).
 */
export function parseInstallArgv(argv: string[]): { version?: string } {
	let version: string | undefined;
	for (let i = 0; i < argv.length; i++) {
		if (argv[i] === "--version" || argv[i] === "-V") {
			const v = argv[i + 1];
			if (v && !v.startsWith("-")) {
				version = v;
				i++;
			}
		}
	}
	return { version };
}
