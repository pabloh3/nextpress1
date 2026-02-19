# NextPress Installation Guide

## Quick Install

Run this one-liner to install NextPress (default version: `beta-v1.0.0`):

```bash
curl -fsSL https://raw.githubusercontent.com/pabloh3/nextpress1/ft-packaging/install.sh | sudo bash
```

### Install Latest Version

```bash
curl -fsSL https://raw.githubusercontent.com/pabloh3/nextpress1/ft-packaging/install.sh | sudo bash -s -- --version latest
```

### Install Specific Version

```bash
curl -fsSL https://raw.githubusercontent.com/pabloh3/nextpress1/ft-packaging/install.sh | sudo bash -s -- --version beta-v1.0.0
```

## Requirements

- Linux server (Ubuntu, Debian, CentOS, etc.)
- Root/sudo access
- Internet connection

The installer will automatically install Docker and Docker Compose if not present.

## What Gets Installed

- **PostgreSQL 15** - Database
- **NextPress App** - Main application (pre-built Docker image)
- **Caddy** - Reverse proxy with automatic HTTPS

### Installation Directory

```
/opt/nextpress/
├── docker-compose.prod.yml   # Docker Compose configuration
├── .env                      # Environment variables (auto-generated secrets)
├── caddy_config/
│   └── Caddyfile             # Caddy reverse proxy config
└── cleanup.sh                # Uninstall script
```

## Post-Installation

After installation, open your browser and visit:

- `http://<server-ip>:5000` - Direct app access
- `http://nextpress.localhost:5000` - Local domain
- `http://<server-ip>` - Caddy default page

Complete the setup wizard to configure:
- Site name
- Domain (point DNS to your server first)
- Admin account

## Managing NextPress

All commands should be run from `/opt/nextpress`:

```bash
cd /opt/nextpress
```

### View Logs

```bash
docker compose -f docker-compose.prod.yml logs -f
```

### Stop NextPress

```bash
docker compose -f docker-compose.prod.yml down
```

### Start NextPress

```bash
docker compose -f docker-compose.prod.yml up -d
```

### Update NextPress

Re-download the latest compose file and pull the newest image:

```bash
cd /opt/nextpress
curl -fsSL https://raw.githubusercontent.com/pabloh3/nextpress1/ft-packaging/docker-compose.prod.yml -o docker-compose.prod.yml
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

### Update to Specific Version

Edit `.env` and change `NEXTPRESS_VERSION`:

```bash
cd /opt/nextpress
sed -i 's/^NEXTPRESS_VERSION=.*/NEXTPRESS_VERSION=beta-v1.0.0/' .env
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

## Uninstall

To completely remove NextPress and all data:

```bash
cd /opt/nextpress && sudo ./cleanup.sh
```

This will:
- Stop and remove all containers
- Remove Docker volumes (database data, uploads)
- Remove Docker images
- Delete the installation directory

## Troubleshooting

### Check Container Status

```bash
docker compose -f docker-compose.prod.yml ps
```

### View App Logs

```bash
docker compose -f docker-compose.prod.yml logs app
```

### View Database Logs

```bash
docker compose -f docker-compose.prod.yml logs postgres
```

### Restart All Services

```bash
docker compose -f docker-compose.prod.yml restart
```

### Reset Database

**Warning**: This will delete all data!

```bash
cd /opt/nextpress
docker compose -f docker-compose.prod.yml down -v
docker compose -f docker-compose.prod.yml up -d
```

## Environment Variables

The `.env` file contains:

| Variable | Description |
|----------|-------------|
| `POSTGRES_PASSWORD` | Database password (auto-generated) |
| `SESSION_SECRET` | Session encryption key (auto-generated) |
| `NEXTPRESS_VERSION` | Docker image tag (default: `beta-v1.0.0`) |

## Docker Image

NextPress is available on Docker Hub:

- **Image**: `husseinkizz/nextpress`
- **Tags**: `latest`, `beta-v1.0.0`, etc.

Pull manually:

```bash
docker pull husseinkizz/nextpress:latest
docker pull husseinkizz/nextpress:beta-v1.0.0
```
