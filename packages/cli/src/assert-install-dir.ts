import { existsSync } from "node:fs";

export type DirCheck =
	| { status: true }
	| { status: false; message: string };

/**
 * Ensures the install directory exists before mutating a live deployment.
 */
export function assertInstallDirExists(installDir: string): DirCheck {
	if (!existsSync(installDir)) {
		return {
			status: false,
			message: `Install directory not found: ${installDir}. Install first (see nextpress help): nextpress install`,
		};
	}
	return { status: true };
}
