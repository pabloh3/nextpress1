import { parseGlobalArgv } from "./parse-global-argv.js";
import { printHelp } from "./print-help.js";
import { readCliPackageVersion } from "./read-cli-package-version.js";
import { runInstall } from "./commands/install.js";
import { runUpgrade } from "./commands/upgrade.js";
import { runReload } from "./commands/reload.js";
import { runRestart } from "./commands/restart.js";
import { runStatus } from "./commands/status.js";
import { runLogs } from "./commands/logs.js";
import { runUninstall } from "./commands/uninstall.js";

type CommandFn = (installDir: string, argv: string[]) => number;

const COMMANDS: Record<string, CommandFn> = {
	upgrade: (dir) => runUpgrade(dir),
	reload: (dir) => runReload(dir),
	restart: (dir) => runRestart(dir),
	status: (dir) => runStatus(dir),
	logs: (dir, argv) => runLogs(dir, argv),
	uninstall: (dir, argv) => runUninstall(dir, argv),
};

async function main(): Promise<number> {
	const raw = process.argv.slice(2);
	const { installDir, positionals, error } = parseGlobalArgv(raw);

	if (error) {
		console.error(`${error}\n`);
		printHelp();
		return 1;
	}

	if (
		positionals.length === 0 ||
		positionals[0] === "help" ||
		positionals[0] === "--help" ||
		positionals[0] === "-h"
	) {
		printHelp();
		return 0;
	}

	const command = positionals[0];
	const subArgv = positionals.slice(1);

	if (command === "-v" || command === "--version" || command === "version") {
		console.log(readCliPackageVersion());
		return 0;
	}

	if (command === "install") {
		return runInstall(installDir, subArgv);
	}

	const runner = COMMANDS[command];
	if (!runner) {
		console.error(`Unknown command: ${command}\n`);
		printHelp();
		return 1;
	}

	return runner(installDir, subArgv);
}

main().then(
	(code) => {
		process.exitCode = code;
	},
	(err) => {
		console.error(err);
		process.exitCode = 1;
	},
);
