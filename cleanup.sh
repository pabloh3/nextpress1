#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${RED}"
echo "============================================"
echo "       NextPress Cleanup"
echo "============================================"
echo -e "${NC}"

# Configuration
INSTALL_DIR="/opt/nextpress"

# 1. Root check
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}Please run this script with sudo${NC}"
  echo "Usage: sudo ./cleanup.sh"
  exit 1
fi

# 2. Change to install directory if it exists
if [ -d "$INSTALL_DIR" ]; then
  cd "$INSTALL_DIR"
else
  echo -e "${YELLOW}Installation directory not found: ${INSTALL_DIR}${NC}"
  echo -e "${YELLOW}Attempting to clean up Docker resources anyway...${NC}"
fi

# 3. Stop and remove containers
echo -e "${YELLOW}Stopping containers...${NC}"
if [ -f "docker-compose.yml" ]; then
  docker compose down --remove-orphans 2>/dev/null || true
fi
echo -e "${GREEN}Containers stopped${NC}"

# 4. Remove Docker volumes
echo -e "${YELLOW}Removing Docker volumes...${NC}"
docker volume rm nextpress_db_data 2>/dev/null || true
docker volume rm nextpress_caddy_config 2>/dev/null || true
docker volume rm nextpress_caddy_data 2>/dev/null || true
docker volume rm nextpress_caddy_config_files 2>/dev/null || true
docker volume rm nextpress_uploads 2>/dev/null || true
echo -e "${GREEN}Docker volumes removed${NC}"

# 5. Remove Docker images
echo -e "${YELLOW}Removing Docker images...${NC}"
docker rmi nextpress-app 2>/dev/null || true
docker rmi $(docker images -q nextpress* 2>/dev/null) 2>/dev/null || true
echo -e "${GREEN}Docker images removed${NC}"

# 6. Remove installation directory
echo -e "${YELLOW}Removing installation directory...${NC}"
if [ -d "$INSTALL_DIR" ]; then
  rm -rf "$INSTALL_DIR"
  echo -e "${GREEN}Installation directory removed: ${INSTALL_DIR}${NC}"
else
  echo -e "${YELLOW}Installation directory already removed${NC}"
fi

# 7. Prune unused Docker resources
echo -e "${YELLOW}Pruning unused Docker resources...${NC}"
docker system prune -f 2>/dev/null || true
echo -e "${GREEN}Docker resources pruned${NC}"

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}       Cleanup Complete!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo -e "NextPress has been completely removed."
echo -e "To reinstall, run:"
# TODO: Update URL when repo is public (remove token/use raw.githubusercontent.com)
echo -e "  ${YELLOW}curl -fsSL https://raw.githubusercontent.com/pabloh3/nextpress1/ft-packaging/install.sh | sudo bash${NC}"
echo ""
