# nextpress cli

Command-line interface for **self-hosting NextPress** on a server you control. One tool to **stand up** a production stack, **refresh** it, **inspect** it, and **remove** it when you are done, instead of copying ad hoc scripts between machines.

**What you can do**

- **Install** a fresh instance (default **`latest`**, or **`--version`** / **`-V`** with a tag you trust).
- **Upgrade** in place when you want a newer build.
- **Operate** day to day: **status**, **logs**, **restart**, **reload** when routing or TLS changes.
- **Uninstall** with **`--yes`** / **`-y`** when you want the stack and install paths removed.

## Requirements

Docker Engine and Docker Compose version 2 (`docker compose version` must work).

## Usage

Default install location is **`/opt/nextpress`**. Override with **`--install-dir`** / **`-d`**, or **`NEXTPRESS_INSTALL_DIR`**. When both are set, **`-d`** wins.

Install the CLI globally so **`nextpress`** is on your **`PATH`**. You often use **`sudo`** for **`npm install -g`** and for **`install`** when the default directory needs root:

```bash
sudo npm install -g @nextpress-org/cli
```

Then run **`nextpress`**. Avoid **`sudo npx`**: root usually has no **`npx`** on **`PATH`**.

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

## Publishing (maintainers)

**VITE+** can replace **`npm`** with a shim so **`npm publish`** errors with **`Command publish not found`**. Prefer **`pnpm`** (this repo already uses it):

```bash
cd packages/cli
pnpm publish --access public
```

Or call Node’s **`npm`** explicitly (example):

```bash
/usr/bin/npm publish --access public
PATH="/usr/local/bin:/usr/bin:/bin" npm publish --access public
```

From the repo root:

```bash
pnpm --filter @nextpress-org/cli publish --access public
```
