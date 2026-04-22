# nextpress cli

Command-line interface for **self-hosting NextPress** on your own server with Docker. You get a running site stack (database, application, HTTPS front end) using **images pulled from Docker Hub** (`husseinkizz/nextpress`). The application image is not built on your machine.

**What you can do**

- **Install** a new server from published images (default tag **`latest`**, or pin a release with **`--version`** / **`-V`** and the Docker Hub tag you want).
- **Upgrade** to newer images without reinstalling from scratch.
- **Operate** the deployment: view **status**, stream **logs**, **restart** services, or **reload** the proxy when routing or TLS settings change.
- **Uninstall** and tear down the stack when you need a clean removal (requires **`--yes`** or **`-y`**).

## Requirements

Docker Engine and Docker Compose version 2 (`docker compose version` must work).

## Usage

Default install location is **`/opt/nextpress`**. Override with **`--install-dir`** / **`-d`**, or **`NEXTPRESS_INSTALL_DIR`**. When both are set, **`-d`** wins.

Install the CLI from npm (global install puts the **`nextpress`** command on your `PATH`):

```bash
npm install -g @nextpress-org/cli
```

Then run **`nextpress`** (or use **`npx @nextpress-org/cli`** without a global install):

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

---

Package name on npm: **`@nextpress-org/cli`**. The executable name is **`nextpress`**. Monorepo workspace root: **`nextpress-workspace`**.
