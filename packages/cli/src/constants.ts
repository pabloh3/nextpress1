/** Default on-disk install location (matches legacy installer). */
export const DEFAULT_INSTALL_DIR = "/opt/nextpress";

/** Compose file name used in production installs. */
export const COMPOSE_FILE = "docker-compose.prod.yml";

/** Default Docker Hub tag for `husseinkizz/nextpress` when `--version` is omitted (aligned with `install.sh`). */
export const DEFAULT_VERSION = "latest";

/** Published npm package name (`npx`, global install). */
export const PUBLISHED_CLI_PACKAGE = "@nextpress-org/cli";

/**
 * Canonical compose spec for installs when not using env/cwd (same default as `install.sh` / deploy docs).
 * Override with `NEXTPRESS_COMPOSE_URL`, or run `install` from a repo root that contains `docker-compose.prod.yml`.
 */
export const DEFAULT_COMPOSE_SPEC_URL =
	"https://raw.githubusercontent.com/pabloh3/nextpress1/main/docker-compose.prod.yml";
