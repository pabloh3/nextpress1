#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}"
echo "============================================"
echo "       NextPress Installer"
echo "============================================"
echo -e "${NC}"

# Configuration
REPO_URL="https://github.com/pabloh3/nextpress1.git"
BRANCH="ft-packaging"
INSTALL_DIR="/opt/nextpress"

# 1. Root check
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}Please run this script with sudo${NC}"
  echo "Usage: curl -fsSL https://raw.githubusercontent.com/pabloh3/nextpress1/${BRANCH}/install.sh | sudo bash"
  exit 1
fi

# 2. Check for Docker
echo -e "${YELLOW}Checking for Docker...${NC}"
if ! command -v docker &> /dev/null; then
  echo -e "${YELLOW}Docker not found. Installing Docker...${NC}"
  curl -fsSL https://get.docker.com | sh
  systemctl enable docker
  systemctl start docker
  echo -e "${GREEN}Docker installed successfully${NC}"
else
  echo -e "${GREEN}Docker is already installed${NC}"
fi

# 3. Check for Docker Compose
echo -e "${YELLOW}Checking for Docker Compose...${NC}"
if ! docker compose version &> /dev/null; then
  echo -e "${RED}Docker Compose v2 not found.${NC}"
  echo "Please install Docker Compose v2 and try again."
  echo "Visit: https://docs.docker.com/compose/install/"
  exit 1
fi
echo -e "${GREEN}Docker Compose is available${NC}"

# 4. Setup installation directory
echo -e "${YELLOW}Setting up installation directory: ${INSTALL_DIR}${NC}"
mkdir -p "$INSTALL_DIR"
cd "$INSTALL_DIR"

# 5. Download or update NextPress
if [ -d ".git" ]; then
  echo -e "${YELLOW}Updating existing installation...${NC}"
  git fetch origin
  git checkout "$BRANCH"
  git pull origin "$BRANCH"
else
  echo -e "${YELLOW}Downloading NextPress (branch: ${BRANCH})...${NC}"
  git clone --branch "$BRANCH" "$REPO_URL" .
fi
echo -e "${GREEN}NextPress code downloaded${NC}"

# 6. Generate secrets if .env doesn't exist
if [ ! -f .env ]; then
  echo -e "${YELLOW}Generating secure secrets...${NC}"
  POSTGRES_PASSWORD=$(openssl rand -hex 16)
  SESSION_SECRET=$(openssl rand -base64 32)
  
  cat > .env <<EOF
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
SESSION_SECRET=$SESSION_SECRET
EOF
  
  echo -e "${GREEN}Secrets generated and saved to .env${NC}"
else
  echo -e "${GREEN}Using existing .env file${NC}"
fi

# 7. Create default Caddyfile for initial setup
echo -e "${YELLOW}Setting up Caddy configuration...${NC}"
mkdir -p caddy_config
cat > caddy_config/Caddyfile <<EOF
{
  admin 0.0.0.0:2019
}

:80 {
  reverse_proxy app:5000
}
EOF
echo -e "${GREEN}Caddy configuration created${NC}"

# 8. Create .dockerignore if it doesn't exist
if [ ! -f .dockerignore ]; then
  cat > .dockerignore <<EOF
node_modules
.git
.gitignore
*.md
.env
.env.*
dist
uploads
caddy_config
EOF
fi

# 9. Launch the stack
echo -e "${YELLOW}Building and starting NextPress...${NC}"
docker compose up -d --build

# 10. Wait for services to be ready
echo -e "${YELLOW}Waiting for services to start...${NC}"
sleep 10

# 11. Get server IP
EXTERNAL_IP=$(curl -s --max-time 3 ipv4.icanhazip.com || echo "")
if [ -z "$EXTERNAL_IP" ]; then
  SERVER_IP=$(hostname -I | awk '{print $1}')
else
  SERVER_IP=$EXTERNAL_IP
fi

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}       Installation Complete!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo -e "NextPress is now running!"
echo ""
echo -e "Open your browser and visit:"
echo -e "  - ${GREEN}http://${SERVER_IP}${NC}                (Setup wizard)"
echo ""
echo -e "Complete the setup wizard to configure your:"
echo -e "  - Site name"
echo -e "  - Domain (point DNS to this server first)"
echo -e "  - Admin account"
echo ""
echo -e "${YELLOW}Useful commands:${NC}"
echo -e "  View logs:     cd ${INSTALL_DIR} && docker compose logs -f"
echo -e "  Stop:          cd ${INSTALL_DIR} && docker compose down"
echo -e "  Start:         cd ${INSTALL_DIR} && docker compose up -d"
echo -e "  Update:        cd ${INSTALL_DIR} && git pull origin ${BRANCH} && docker compose up -d --build"
echo -e "  Cleanup:       cd ${INSTALL_DIR} && sudo ./cleanup.sh"
echo ""
