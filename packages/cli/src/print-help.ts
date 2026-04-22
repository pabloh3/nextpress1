import { DEFAULT_INSTALL_DIR, PUBLISHED_CLI_PACKAGE } from "./constants.js";

/** CLI help text (keep in sync with implemented commands). */
export function printHelp(): void {
	const pkg = PUBLISHED_CLI_PACKAGE;
	console.log(`
nextpress — NextPress server CLI (pre-built Docker Hub images only; no image build on your server)

Recommended
  sudo npm install -g ${pkg}
  nextpress <command> [options]

  Use sudo with nextpress when the default install dir (${DEFAULT_INSTALL_DIR}) or Docker needs root. Do not use "sudo npx" (root often has no npx on PATH).

Global options:
  -d, --install-dir <path>   Install directory (default: ${DEFAULT_INSTALL_DIR})
                             Override with env NEXTPRESS_INSTALL_DIR.

Compose resolution (install only), in order:
  1. NEXTPRESS_COMPOSE_URL     Fetch this URL (e.g. raw GitHub for your deploy branch/tag).
  2. ./docker-compose.prod.yml If present under the current working directory (e.g. repo root after deploy).
  3. Default public URL         Same main-branch compose as legacy curl installer.

Commands:
  install [--version <tag>]   Fetch compose YAML, write bootstrap + .env, then pull images and start (same as install.sh: never docker build).
                              Default Hub tag is latest (husseinkizz/nextpress:latest). --version <tag> pins husseinkizz/nextpress:<tag>.
  upgrade                     docker compose pull && up -d (refresh pre-built images; still no build).
  reload                      Restart only the Caddy service.
  restart                     Restart all compose services.
  status                      docker compose ps
  logs [service...]           docker compose logs -f (optional service names)
  uninstall --yes             docker compose down -v, remove NextPress images, delete install dir.

Examples:
  sudo npm install -g ${pkg}
  sudo nextpress install
  sudo nextpress install --version beta-v1.0.2
  cd /path/to/nextpress && sudo nextpress install
  NEXTPRESS_COMPOSE_URL=https://raw.githubusercontent.com/org/nextpress/v1/docker-compose.prod.yml sudo -E nextpress install
  nextpress install --install-dir "$HOME/nextpress"
  nextpress -d /opt/nextpress upgrade
`.trim());
}
