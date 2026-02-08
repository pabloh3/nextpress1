#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ============================================
# CONFIGURATION - Edit these values as needed
# ============================================
COMPOSE_URL="https://raw.githubusercontent.com/pabloh3/nextpress1/ft-packaging/docker-compose.prod.yml"
INSTALL_DIR="/opt/nextpress"
DEFAULT_DOMAIN="nextpress.localhost"
DEFAULT_VERSION="beta-v1.0.0"
# ============================================

# Spinner for long-running commands (ASCII compatible)
run_with_spinner() {
  local msg=$1
  shift
  local spin='|/-\'
  local i=0
  local tempfile=$(mktemp)
  
  # Run command in background, capture exit code
  "$@" > "$tempfile" 2>&1 &
  local pid=$!
  
  while kill -0 $pid 2>/dev/null; do
    i=$(( (i+1) % 4 ))
    printf "\r  [%c] %s" "${spin:$i:1}" "$msg"
    sleep 0.1
  done
  
  # Get exit code
  wait $pid
  local exit_code=$?
  
  if [ $exit_code -eq 0 ]; then
    printf "\r  [✓] %s\n" "$msg"
    rm -f "$tempfile"
    return 0
  else
    printf "\r  [✗] %s\n" "$msg"
    echo -e "${RED}Error output:${NC}"
    cat "$tempfile"
    rm -f "$tempfile"
    return $exit_code
  fi
}

echo -e "${GREEN}"
echo "============================================"
echo "       NextPress Installer"
echo "============================================"
echo -e "${NC}"

# Parse arguments
NEXTPRESS_VERSION="$DEFAULT_VERSION"
while [[ $# -gt 0 ]]; do
  case $1 in
    --version)
      NEXTPRESS_VERSION="$2"
      shift 2
      ;;
    -h|--help)
      echo "Usage: ./install.sh [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  --version <tag>  Specify NextPress version (default: latest)"
      echo "  -h, --help       Show this help message"
      echo ""
      echo "Examples:"
      echo "  ./install.sh                      # Install latest"
      echo "  ./install.sh --version beta-v1.0.0  # Install specific version"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      echo "Use --help for usage information"
      exit 1
      ;;
  esac
done

echo -e "Installing NextPress version: ${GREEN}${NEXTPRESS_VERSION}${NC}"
echo ""

# 1. Root check
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}Please run this script with sudo${NC}"
  echo "Usage: curl -fsSL https://raw.githubusercontent.com/pabloh3/nextpress1/ft-packaging/install.sh | sudo bash"
  echo "       curl -fsSL ... | sudo bash -s -- --version beta-v1.0.0"
  exit 1
fi

# Get the original user who invoked sudo (for file ownership)
ORIGINAL_USER="${SUDO_USER:-$USER}"

# 2. Check for Docker
echo -e "${YELLOW}Checking for Docker...${NC}"
if ! command -v docker &> /dev/null; then
  if ! run_with_spinner "Installing Docker" bash -c "curl -fsSL https://get.docker.com | sh -s -- --quiet"; then
    echo -e "${RED}Failed to install Docker. Please install manually and re-run.${NC}"
    exit 1
  fi
  systemctl enable docker >/dev/null 2>&1
  systemctl start docker >/dev/null 2>&1
  echo -e "  ${GREEN}Docker installed successfully${NC}"
else
  echo -e "  ${GREEN}Docker is already installed${NC}"
fi

# 3. Check for Docker Compose
echo -e "${YELLOW}Checking for Docker Compose...${NC}"
if ! docker compose version &> /dev/null; then
  echo -e "${RED}Docker Compose v2 not found.${NC}"
  echo "Please install Docker Compose v2 and try again."
  echo "Visit: https://docs.docker.com/compose/install/"
  exit 1
fi
echo -e "  ${GREEN}Docker Compose is available${NC}"

# 4. Setup installation directory
echo -e "${YELLOW}Setting up installation directory...${NC}"
mkdir -p "$INSTALL_DIR"
cd "$INSTALL_DIR"
echo -e "  ${GREEN}Directory ready: ${INSTALL_DIR}${NC}"

# 5. Download docker-compose.prod.yml
echo -e "${YELLOW}Downloading NextPress configuration...${NC}"
if ! run_with_spinner "Downloading docker-compose.prod.yml" curl -fsSL "$COMPOSE_URL" -o docker-compose.prod.yml; then
  echo -e "${RED}Failed to download configuration.${NC}"
  echo -e "${YELLOW}Check your internet connection and try again.${NC}"
  exit 1
fi
chown "$ORIGINAL_USER:$ORIGINAL_USER" docker-compose.prod.yml
echo -e "  ${GREEN}Configuration ready${NC}"

# 6. Generate secrets if .env doesn't exist
echo -e "${YELLOW}Configuring environment...${NC}"
if [ ! -f .env ]; then
  POSTGRES_PASSWORD=$(openssl rand -hex 16)
  SESSION_SECRET=$(openssl rand -base64 32)
  
  cat > .env <<EOF
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
SESSION_SECRET=$SESSION_SECRET
NEXTPRESS_VERSION=$NEXTPRESS_VERSION
EOF
  chown "$ORIGINAL_USER:$ORIGINAL_USER" .env
  echo -e "  ${GREEN}Secrets generated${NC}"
else
  # Update version in existing .env
  if grep -q "^NEXTPRESS_VERSION=" .env; then
    sed -i "s/^NEXTPRESS_VERSION=.*/NEXTPRESS_VERSION=$NEXTPRESS_VERSION/" .env
  else
    echo "NEXTPRESS_VERSION=$NEXTPRESS_VERSION" >> .env
  fi
  echo -e "  ${GREEN}Using existing .env file (version updated)${NC}"
fi

# 7. Create default Caddyfile for initial setup
mkdir -p caddy_config
cat > caddy_config/Caddyfile <<EOF
{
  admin 0.0.0.0:2019
  email info@nextpress.com
}

# Default HTTP catch-all on port 80
:80 {
  root * /usr/share/caddy
  file_server
}

# App Domain
${DEFAULT_DOMAIN} {
  reverse_proxy app:5000
}
EOF
chown -R "$ORIGINAL_USER:$ORIGINAL_USER" caddy_config
echo -e "  ${GREEN}Caddy configuration ready${NC}"

# 8. Download cleanup script
echo -e "${YELLOW}Downloading cleanup script...${NC}"
CLEANUP_URL="https://raw.githubusercontent.com/pabloh3/nextpress1/ft-packaging/cleanup.sh"
if ! run_with_spinner "Downloading cleanup.sh" curl -fsSL "$CLEANUP_URL" -o cleanup.sh; then
  echo -e "${YELLOW}Warning: Failed to download cleanup script (non-critical)${NC}"
else
  chmod +x cleanup.sh
  chown "$ORIGINAL_USER:$ORIGINAL_USER" cleanup.sh
  echo -e "  ${GREEN}Cleanup script ready${NC}"
fi

# 9. Pull NextPress images
echo -e "${YELLOW}Pulling NextPress images...${NC}"
if ! run_with_spinner "Pulling images (this may take a minute)" docker compose -f docker-compose.prod.yml pull; then
  echo -e "${RED}Failed to pull images.${NC}"
  exit 1
fi
echo -e "  ${GREEN}Images pulled successfully${NC}"

# 10. Launch the stack
echo -e "${YELLOW}Starting NextPress...${NC}"
if ! run_with_spinner "Starting services" docker compose -f docker-compose.prod.yml up -d; then
  echo -e "${RED}Failed to start services.${NC}"
  exit 1
fi

# 11. Wait for services to be ready
run_with_spinner "Waiting for services to initialize" sleep 10

# 12. Get server IP
SERVER_IP=$(hostname -I | awk '{print $1}')

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}       Installation Complete!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo -e "NextPress ${GREEN}${NEXTPRESS_VERSION}${NC} is now running!"
echo ""
echo -e "Open your browser and visit:"
echo -e "  - ${GREEN}http://${SERVER_IP}:5000${NC}       (Direct app access)"
echo -e "  - ${GREEN}https://nextpress.localhost${NC}  (Local domain)"
echo -e "  - ${GREEN}http://${SERVER_IP}${NC}           (Server info page)"
echo ""
echo -e "Complete the setup wizard to configure your:"
echo -e "  - Site name"
echo -e "  - Domain (point DNS to this server first)"
echo -e "  - Admin account"
echo ""
echo -e "${YELLOW}Useful commands:${NC}"
echo -e "  View logs:     cd ${INSTALL_DIR} && docker compose -f docker-compose.prod.yml logs -f"
echo -e "  Stop:          cd ${INSTALL_DIR} && docker compose -f docker-compose.prod.yml down"
echo -e "  Start:         cd ${INSTALL_DIR} && docker compose -f docker-compose.prod.yml up -d"
echo -e "  Update:        cd ${INSTALL_DIR} && curl -fsSL ${COMPOSE_URL} -o docker-compose.prod.yml && docker compose -f docker-compose.prod.yml pull && docker compose -f docker-compose.prod.yml up -d"
echo -e "  Cleanup:       cd ${INSTALL_DIR} && sudo ./cleanup.sh"
echo ""
