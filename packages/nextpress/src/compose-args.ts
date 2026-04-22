import { COMPOSE_FILE } from "./constants.js";

/** Base `docker compose` argv fragment including compose file. */
export function composeFileArgs(): string[] {
	return ["compose", "-f", COMPOSE_FILE];
}
