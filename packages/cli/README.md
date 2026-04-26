# nextpress command

Standalone command to make self hosting and managing nextpress easier.

**What you can do**

- **Install** a fresh instance (default **`latest`**, or **`--version`** / **`-V`** with a tag you trust).
- **Upgrade** in place when you want a newer build.
- **Operate** day to day: **status**, **logs**, **restart**, **reload** when routing or TLS changes.
- **Uninstall** with **`--yes`** / **`-y`** when you want the stack and install paths removed.

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

sudo nextpress install
sudo nextpress install --version beta-v1.0.2

nextpress -d /opt/nextpress upgrade
nextpress status
nextpress logs
nextpress reload
sudo nextpress uninstall --yes
```

### Optional configuration

| Variable | Use |
|----------|-----|
| `NEXTPRESS_INSTALL_DIR` | Default path if you omit **`-d`**. |
| `NEXTPRESS_COMPOSE_URL` | During **install**, use the compose definition from this URL. |
| `NEXTPRESS_RAW_BASE` | During **install.sh**, override the GitHub raw base URL. |
| `NEXTPRESS_BIN_PATH` | During **install.sh**, override where the command is installed. |
| `NEXTPRESS_SKIP_DOCKER_INSTALL` | During **install.sh**, fail instead of installing Docker when Docker is missing. |

---

The command source lives at **`scripts/nextpress`**. The bootstrap installer lives at the repo root: **`install.sh`**.

## Legacy npm package

The older npm package was **`@nextpress-org/cli`**, but the recommended path is now the GitHub installer because it avoids npm global **`PATH`** issues on fresh servers.
