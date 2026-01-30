#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Spinner for long-running commands (ASCII compatible)
# Usage: run_with_spinner "message" command arg1 arg2 ...
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

# Configuration
# TODO: Change to HTTPS URL when repo is public: https://github.com/pabloh3/nextpress1.git
REPO_URL="git@github.com:pabloh3/nextpress1.git"
BRANCH="ft-packaging"
INSTALL_DIR="/opt/nextpress"

# 1. Root check
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}Please run this script with sudo${NC}"
  # TODO: Update URL when repo is public (remove token/use raw.githubusercontent.com)
  echo "Usage: curl -fsSL https://raw.githubusercontent.com/pabloh3/nextpress1/${BRANCH}/install.sh | sudo bash"
  exit 1
fi

# Get the original user who invoked sudo (for SSH key access)
ORIGINAL_USER="${SUDO_USER:-$USER}"
ORIGINAL_HOME=$(eval echo "~$ORIGINAL_USER")

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
chown "$ORIGINAL_USER:$ORIGINAL_USER" "$INSTALL_DIR"
cd "$INSTALL_DIR"
echo -e "  ${GREEN}Directory ready: ${INSTALL_DIR}${NC}"

# 5. Download or update NextPress
echo -e "${YELLOW}Downloading NextPress...${NC}"

# SSH command that auto-accepts host keys (needed for non-interactive clone)
export GIT_SSH_COMMAND="ssh -o StrictHostKeyChecking=accept-new -o BatchMode=yes"

if [ -d ".git" ]; then
  # Update existing installation (as original user)
  if ! run_with_spinner "Updating repository" sudo -u "$ORIGINAL_USER" -E git pull origin "$BRANCH"; then
    echo -e "${RED}Failed to update repository.${NC}"
    exit 1
  fi
else
  # Fresh clone (as original user for SSH key access)
  if ! run_with_spinner "Cloning repository" sudo -u "$ORIGINAL_USER" -E git clone --branch "$BRANCH" "$REPO_URL" .; then
    echo -e "${RED}Failed to clone repository.${NC}"
    echo -e "${YELLOW}Make sure you have SSH access to the repository.${NC}"
    exit 1
  fi
fi
echo -e "  ${GREEN}NextPress code ready${NC}"

# 6. Generate secrets if .env doesn't exist
echo -e "${YELLOW}Configuring environment...${NC}"
if [ ! -f .env ]; then
  POSTGRES_PASSWORD=$(openssl rand -hex 16)
  SESSION_SECRET=$(openssl rand -base64 32)
  
  cat > .env <<EOF
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
SESSION_SECRET=$SESSION_SECRET
EOF
  chown "$ORIGINAL_USER:$ORIGINAL_USER" .env
  echo -e "  ${GREEN}Secrets generated${NC}"
else
  echo -e "  ${GREEN}Using existing .env file${NC}"
fi

# 7. Create default Caddyfile for initial setup
mkdir -p caddy_config
cat > caddy_config/Caddyfile <<EOF
{
  admin 0.0.0.0:2019
}

:80 {
  reverse_proxy app:5000
}
EOF
chown -R "$ORIGINAL_USER:$ORIGINAL_USER" caddy_config
echo -e "  ${GREEN}Caddy configuration ready${NC}"

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
  chown "$ORIGINAL_USER:$ORIGINAL_USER" .dockerignore
fi

# 9. Launch the stack
echo -e "${YELLOW}Building and starting NextPress...${NC}"
if ! run_with_spinner "Building containers (this may take a few minutes)" docker compose build; then
  echo -e "${RED}Failed to build containers.${NC}"
  exit 1
fi

if ! run_with_spinner "Starting services" docker compose up -d; then
  echo -e "${RED}Failed to start services.${NC}"
  exit 1
fi

# 10. Wait for services to be ready
run_with_spinner "Waiting for services to initialize" sleep 10

# 11. Get server IP
SERVER_IP=$(hostname -I | awk '{print $1}')

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}       Installation Complete!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo -e "NextPress is now running!"
echo ""
echo -e "Open your browser and visit:"
echo -e "  ${GREEN}http://${SERVER_IP}${NC}"
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
echo -e "  Update:        cd ${INSTALL_DIR} && git pull && docker compose up -d --build"
echo -e "  Cleanup:       cd ${INSTALL_DIR} && sudo ./cleanup.sh"
echo ""
