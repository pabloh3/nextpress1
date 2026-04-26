#!/usr/bin/env bash
set -euo pipefail

readonly NEXTPRESS_RAW_BASE="${NEXTPRESS_RAW_BASE:-https://raw.githubusercontent.com/pabloh3/nextpress1/main}"
readonly NEXTPRESS_BIN_PATH="${NEXTPRESS_BIN_PATH:-/usr/local/bin/nextpress}"
readonly NEXTPRESS_COMMAND_URL="${NEXTPRESS_COMMAND_URL:-$NEXTPRESS_RAW_BASE/scripts/nextpress}"

info() {
	printf '%s\n' "==> $*"
}

fail() {
	printf '%s\n' "Error: $*" >&2
	exit 1
}

command_exists() {
	command -v "$1" >/dev/null 2>&1
}

as_root() {
	if [ "$(id -u)" -eq 0 ]; then
		"$@"
		return
	fi

	if "$@"; then
		return
	fi

	if command_exists sudo; then
		sudo "$@"
		return
	fi

	fail "This step needs root permissions. Re-run as root or install sudo."
}

assert_linux() {
	if [ "$(uname -s)" != "Linux" ]; then
		fail "NextPress installer currently supports Linux servers only."
	fi
}

docker_compose_available() {
	if docker compose version >/dev/null 2>&1; then
		return 0
	fi

	if [ "$(id -u)" -ne 0 ] && command_exists sudo && sudo docker compose version >/dev/null 2>&1; then
		return 0
	fi

	return 1
}

install_docker_if_missing() {
	if docker_compose_available; then
		info "Docker Compose v2 is available."
		return
	fi

	if [ "${NEXTPRESS_SKIP_DOCKER_INSTALL:-}" = "1" ]; then
		fail "Docker Compose v2 is missing. Install Docker Engine + Compose plugin, then re-run this installer."
	fi

	info "Docker Compose v2 is missing; installing Docker Engine with the official Docker installer."
	curl -fsSL https://get.docker.com -o /tmp/nextpress-get-docker.sh
	as_root sh /tmp/nextpress-get-docker.sh
	rm -f /tmp/nextpress-get-docker.sh

	if ! docker_compose_available; then
		fail "Docker installed, but 'docker compose version' still failed. Open a new shell or check Docker permissions."
	fi
}

install_nextpress_command() {
	local bin_dir
	local tmp_file
	bin_dir="$(dirname "$NEXTPRESS_BIN_PATH")"
	tmp_file="$(mktemp)"

	info "Downloading nextpress command from GitHub."
	curl -fsSL "$NEXTPRESS_COMMAND_URL" -o "$tmp_file"
	chmod +x "$tmp_file"

	info "Installing nextpress command to $NEXTPRESS_BIN_PATH."
	as_root mkdir -p "$bin_dir"
	as_root install -m 0755 "$tmp_file" "$NEXTPRESS_BIN_PATH"
	rm -f "$tmp_file"
}

verify_nextpress_command() {
	if ! "$NEXTPRESS_BIN_PATH" --version >/dev/null 2>&1; then
		fail "Installed command did not pass version verification: $NEXTPRESS_BIN_PATH --version"
	fi

	info "Installed $("$NEXTPRESS_BIN_PATH" --version)."
}

run_nextpress_install() {
	info "Starting NextPress install."
	as_root "$NEXTPRESS_BIN_PATH" install "$@"
}

main() {
	assert_linux

	if ! command_exists curl; then
		fail "curl is required to install NextPress."
	fi

	install_docker_if_missing
	install_nextpress_command
	verify_nextpress_command
	run_nextpress_install "$@"

	printf '\n'
	printf '%s\n' "NextPress is installed and the nextpress command is ready."
	printf '%s\n' "Useful commands:"
	printf '%s\n' "  nextpress help"
	printf '%s\n' "  nextpress status"
	printf '%s\n' "  nextpress logs"
}

main "$@"
