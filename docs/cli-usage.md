# NextPress Command Usage

**Type:** Reference  
**Date:** April 28, 2026  
**Author:** NextPress maintainers

## 1. Install The Command

Install NextPress and the standalone `nextpress` command:

```bash
curl -fsSL https://raw.githubusercontent.com/pabloh3/nextpress1/main/install.sh | bash
```

The installer writes the command to `/usr/local/bin/nextpress`, verifies it, and runs `nextpress install`.

## 2. Global Options

Use a custom install directory:

```bash
nextpress --install-dir "$HOME/nextpress" status
```

Short form:

```bash
nextpress -d "$HOME/nextpress" status
```

The default install directory is `/opt/nextpress`.

## 3. Install

Install the latest image:

```bash
nextpress install
```

Install a specific image tag:

```bash
nextpress install --version beta-v1.0.2
```

The install command:

- Resolves `docker-compose.prod.yml`.
- Writes `.env` with generated secrets if needed.
- Writes the first Caddy config if needed.
- Pulls images.
- Starts PostgreSQL.
- Runs Drizzle migrations from the app image.
- Starts the app and Caddy.

## 4. Upgrade

Upgrade to the latest image:

```bash
nextpress upgrade
```

Upgrade to a specific image tag:

```bash
nextpress upgrade --version beta-v1.0.2
```

Explicit latest form:

```bash
nextpress upgrade --latest
```

Allow a database reset for incompatible schema changes:

```bash
nextpress upgrade --version beta-v1.0.2 --override
```

Use override mode without a confirmation prompt:

```bash
nextpress upgrade --version beta-v1.0.2 --override --yes
```

Standard upgrade preserves database data. Override mode creates a backup first, then resets the PostgreSQL data volume.

See [`upgrade-flow.md`](upgrade-flow.md) for schema behavior.

## 5. Operate

Show service status:

```bash
nextpress status
```

Follow all service logs:

```bash
nextpress logs
```

Follow one or more services:

```bash
nextpress logs app
nextpress logs postgres caddy
```

Restart all services:

```bash
nextpress restart
```

Reload Caddy:

```bash
nextpress reload
```

## 6. Uninstall

Uninstall requires confirmation through `--yes`:

```bash
nextpress uninstall --yes
```

This stops the compose stack, removes named volumes, removes NextPress images on a best effort basis, and removes the install directory.

## 7. Environment Variables

- `NEXTPRESS_INSTALL_DIR`: default install path when `--install-dir` is omitted.
- `NEXTPRESS_COMPOSE_URL`: compose file URL used by `nextpress install`.
- `NEXTPRESS_PUBLIC_IP`: public address shown in install output.
- `NEXTPRESS_RAW_BASE`: raw file base URL used by `install.sh`.
- `NEXTPRESS_BIN_PATH`: command install path used by `install.sh`.
- `NEXTPRESS_SKIP_DOCKER_INSTALL`: make missing Docker a hard installer error.

## 8. Version Output

Print the command version:

```bash
nextpress --version
nextpress version
```
