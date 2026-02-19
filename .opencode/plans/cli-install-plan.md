# CLI Install & Setup Wizard Implementation Plan

## 1. Goal
Implement a "one-click" CLI installation (`curl ... | bash`) that deploys the application using Docker and directs the user to a web-based "Setup Wizard" for initial configuration.

## 2. Infrastructure (Docker & Caddy)

### 2.1 `Dockerfile`
Multi-stage build strategy.

```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

# Stage 2: Runtime
FROM node:20-alpine
WORKDIR /app
RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod
COPY --from=builder /app/dist ./dist
# Copy shared/ folder if it's referenced by dist, though tsup usually bundles it. 
# Checking tsup.config.ts might be needed, but assuming dist/index.js is self-contained or requires minimal local files.

EXPOSE 5000
CMD ["node", "dist/index.js"]
```

### 2.2 `docker-compose.yml`
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15-alpine
    restart: always
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: nextpress
    volumes:
      - db_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  app:
    build: .
    restart: always
    environment:
      DATABASE_URL: postgres://postgres:${POSTGRES_PASSWORD}@postgres:5432/nextpress
      SESSION_SECRET: ${SESSION_SECRET}
      PORT: 5000
      NODE_ENV: production
    volumes:
      - caddy_data:/etc/caddy
      - uploads:/app/uploads
    depends_on:
      postgres:
        condition: service_healthy

  caddy:
    image: caddy:2.7-alpine
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - caddy_data:/etc/caddy
      - caddy_certificates:/data
    depends_on:
      - app

volumes:
  db_data:
  caddy_data:
  caddy_certificates:
  uploads:
```

### 2.3 Caddy Integration
- **Default `Caddyfile`** (Created by `install.sh` initially):
  ```caddyfile
  :80 {
    reverse_proxy app:5000
  }
  ```
- **Updates**: The App will write to `/etc/caddy/Caddyfile` (mounted volume).

## 3. Backend Implementation

### 3.1 `server/routes/init/initialize-default.ts`
- **Action**: Wrap the auto-creation logic in a check.
  ```typescript
  // OLD:
  // if (users.length === 0) { createSystemUser... }
  
  // NEW:
  // Skip default site/user creation to allow Wizard to handle it.
  // We ONLY create default roles.
  ```

### 3.2 Middleware: `server/middleware/setupCheck.ts`
```typescript
export const setupCheck = async (req, res, next) => {
  // Allow static assets and setup API
  if (req.path.startsWith('/admin/assets') || req.path.startsWith('/api/setup')) return next();
  
  const siteCount = await deps.models.sites.count();
  if (siteCount === 0) {
     // If API request, return 428 Precondition Required
     if (req.path.startsWith('/api')) return res.status(428).json({ error: 'Setup Required' });
     // Otherwise redirect to setup page
     return res.redirect('/setup');
  }
  next();
};
```

### 3.3 Route: `server/routes/setup.routes.ts`
- **POST `/api/setup`**:
  ```typescript
  router.post('/', async (req, res) => {
    const { domain, siteName, email, password } = req.body;
    
    // 1. Create User & Site
    const user = await models.users.create({ ... });
    const site = await models.sites.create({ ... });
    
    // 2. Generate Caddyfile
    const caddyConfig = `${domain} {
      reverse_proxy app:5000
    }`;
    
    // 3. Write to Volume
    await fs.writeFile('/etc/caddy/Caddyfile', caddyConfig);
    
    // 4. Reload Caddy (using native fetch, Node 20+)
    await fetch('http://caddy:2019/load', {
      method: 'POST',
      headers: { 'Content-Type': 'text/caddyfile' },
      body: caddyConfig
    });
    
    res.json({ success: true });
  });
  ```

## 4. Frontend Implementation

### 4.1 `client/src/pages/Setup.tsx`
- A clean React component using `shadcn/ui`.
- Steps:
  1. **Welcome**: "NextPress Setup".
  2. **Admin**: Email/Password inputs.
  3. **Site**: Site Name, Domain Name.
  4. **Install**: Calls `POST /api/setup`. Show spinner. On success -> `window.location.href = '/login'`.

## 5. The `install.sh` Script
```bash
#!/bin/bash
set -e

# 1. Prereqs
if ! [ -x "$(command -v docker)" ]; then
  echo "Installing Docker..."
  curl -fsSL https://get.docker.com | sh
fi

# 2. Setup Dir
INSTALL_DIR="/opt/nextpress"
mkdir -p "$INSTALL_DIR"
cd "$INSTALL_DIR"

# 3. Get Code (Clone or Download)
# For now, assuming git clone or copying current directory
# git clone https://github.com/your/repo.git .

# 4. Generate Secrets
echo "Generating secrets..."
PG_PASS=$(openssl rand -hex 16)
SESSION_SEC=$(openssl rand -base64 32)

cat <<EOF > .env
POSTGRES_PASSWORD=$PG_PASS
SESSION_SECRET=$SESSION_SEC
EOF

# 5. Default Caddyfile
mkdir -p caddy_data
echo ":80 {
  reverse_proxy app:5000
}" > caddy_data/Caddyfile

# 6. Launch
docker compose up -d --build

echo "Installation complete! Open your browser to setup."
```

## 6. Execution Order
1.  **Backend**: Modify `initialize-default.ts`, create `setupCheck.ts`, create `setup.routes.ts`.
2.  **Frontend**: Create `Setup.tsx`, update `App.tsx`.
3.  **Infrastructure**: Create `Dockerfile`, `docker-compose.yml`.
4.  **Script**: Create `install.sh`.
