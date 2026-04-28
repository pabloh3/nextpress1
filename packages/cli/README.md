# nextpress command

Standalone command to self-host and manage NextPress.

**What you can do**

- **Install** a fresh instance, using **`latest`** by default or **`--version`** / **`-V`** with a specific tag.
- **Upgrade** in place with schema checks and database backup before migrations.
- **Operate** day to day with **`status`**, **`logs`**, **`restart`**, and **`reload`**.
- **Uninstall** with **`--yes`** / **`-y`** when you want the stack and install path removed.

## Requirements

Docker Engine and Docker Compose version 2 (`docker compose version` must work).

## Install

Default install location is **`/opt/nextpress`**. Override with **`--install-dir`** / **`-d`**, or **`NEXTPRESS_INSTALL_DIR`**. When both are set, **`-d`** wins.

Install NextPress and the standalone command from GitHub:

```bash
curl -fsSL https://raw.githubusercontent.com/pabloh3/nextpress1/main/install.sh | bash
```

The installer checks for Docker Compose v2, writes **`/usr/local/bin/nextpress`**, makes it executable, verifies **`nextpress --version`**, and runs **`nextpress install`** before finishing.

If you already have Docker installed, the command is ready immediately. If Docker is missing, the installer uses Docker's official Linux installer. Set **`NEXTPRESS_SKIP_DOCKER_INSTALL=1`** to make missing Docker a hard failure instead.

Pass install options through bash when needed:

```bash
curl -fsSL https://raw.githubusercontent.com/pabloh3/nextpress1/main/install.sh | bash -s -- --version beta-v1.0.2
curl -fsSL https://raw.githubusercontent.com/pabloh3/nextpress1/main/install.sh | bash -s -- -d "$HOME/nextpress"
```

## Usage

```bash
nextpress help

nextpress install
nextpress install --version beta-v1.0.2

nextpress upgrade
nextpress upgrade --version beta-v1.0.2
nextpress upgrade --override --yes
nextpress status
nextpress logs
nextpress reload
nextpress uninstall --yes
```

Upgrade behavior is documented in [`../../docs/upgrade-flow.md`](../../docs/upgrade-flow.md). Full command usage is documented in [`../../docs/cli-usage.md`](../../docs/cli-usage.md).

### Optional configuration

| Variable | Use |
|----------|-----|
| `NEXTPRESS_INSTALL_DIR` | Default path if you omit **`-d`**. |
| `NEXTPRESS_COMPOSE_URL` | During **install**, use the compose definition from this URL. |
| `NEXTPRESS_PUBLIC_IP` | Public address shown in install output. |
| `NEXTPRESS_RAW_BASE` | During **install.sh**, override the GitHub raw base URL. |
| `NEXTPRESS_BIN_PATH` | During **install.sh**, override where the command is installed. |
| `NEXTPRESS_SKIP_DOCKER_INSTALL` | During **install.sh**, fail instead of installing Docker when Docker is missing. |

---

The command source lives at **`scripts/nextpress`**. The bootstrap installer lives at the repo root: **`install.sh`**.

## Legacy npm package

The older npm package was **`@nextpress-org/cli`**, but the recommended path is now the GitHub installer because it avoids npm global **`PATH`** issues on fresh servers.
