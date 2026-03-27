# Nextpress

A modern, self-hostable wordpress compatible CMS built in JavaScript.

## Development

```bash
git clone https://github.com/pabloh3/nextpress1 nextpress
pnpm install
pnpm dev
```

Nextpress uses [PGlite](https://pglite.dev/) (embedded PostgreSQL) for local development - no Docker or extra database setup needed.

## Self-Hosting

One-command install on any Linux server (pulls the latest version by default):

```bash
curl -fsSL https://raw.githubusercontent.com/pabloh3/nextpress1/main/install.sh | sudo bash
```

To install a specific version:

```bash
curl -fsSL https://raw.githubusercontent.com/pabloh3/nextpress1/main/install.sh | sudo bash -s -- --version beta-v1.0.1
```

## License

This project is licensed under the GNU General Public License v3.0.
See the LICENSE file for details.
