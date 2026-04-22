import { DEFAULT_INSTALL_DIR } from "./constants.js";

export type ParsedGlobalArgv = {
	installDir: string;
	positionals: string[];
};

/**
 * Pulls `--install-dir` / `-d` out of argv so subcommands receive only their own flags.
 * `NEXTPRESS_INSTALL_DIR` wins when set, unless the user passes `-d` (explicit override).
 */
export function parseGlobalArgv(argv: string[]): ParsedGlobalArgv {
	const envDir = process.env.NEXTPRESS_INSTALL_DIR?.trim();
	let installDir = envDir && envDir.length > 0 ? envDir : DEFAULT_INSTALL_DIR;
	const positionals: string[] = [];
	for (let i = 0; i < argv.length; i++) {
		const a = argv[i];
		if (a === "--install-dir" || a === "-d") {
			const v = argv[i + 1];
			if (v) {
				installDir = v;
			}
			i++;
			continue;
		}
		positionals.push(a);
	}
	return { installDir, positionals };
}
