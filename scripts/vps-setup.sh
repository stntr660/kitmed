#!/bin/bash

# KITMED VPS Setup Script
# Run this on your VPS: bash vps-setup.sh

set -e

echo "🚀 KITMED VPS Setup Starting..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    print_error "Please don't run as root. Use a regular user with sudo privileges."
    exit 1
fi

# Update system
print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Docker if not installed
if ! command -v docker &> /dev/null; then
    print_status "Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
else
    print_status "Docker already installed"
fi

# Install docker-compose if not installed
if ! command -v docker-compose &> /dev/null; then
    print_status "Installing Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.21.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
else
    print_status "Docker Compose already installed"
fi

# Install nginx if not installed
if ! command -v nginx &> /dev/null; then
    print_status "Installing Nginx..."
    sudo apt install nginx -y
else
    print_status "Nginx already installed"
fi

# Install git if not installed
if ! command -v git &> /dev/null; then
    print_status "Installing Git..."
    sudo apt install git -y
else
    print_status "Git already installed"
fi

# Create directories
print_status "Creating project directories..."
sudo mkdir -p /var/www/kitmed-staging
sudo mkdir -p /var/www/kitmed-production
sudo chown -R $USER:$USER /var/www/

# Check if projects already exist
if [ -d "/var/www/kitmed-staging/.git" ]; then
    print_warning "Staging project already exists. Skipping clone."
else
    print_status "Cloning staging repository..."
    read -p "Enter your GitHub repository URL (https://github.com/username/repo): " REPO_URL
    git clone -b staging "$REPO_URL" /var/www/kitmed-staging || {
        print_warning "Staging branch doesn't exist. Cloning main branch and creating staging..."
        git clone "$REPO_URL" /var/www/kitmed-staging
        cd /var/www/kitmed-staging
        git checkout -b staging
        git push origin staging
    }
fi

if [ -d "/var/www/kitmed-production/.git" ]; then
    print_warning "Production project already exists. Skipping clone."
else
    print_status "Cloning production repository..."
    git clone -b main "$REPO_URL" /var/www/kitmed-production
fi

# Create environment files
print_status "Creating environment files..."

# Get domain information
read -p "Enter your domain name (e.g., example.com): " DOMAIN_NAME
read -p "Enter your staging subdomain (e.g., staging): " STAGING_SUBDOMAIN

# Generate secrets
STAGING_SECRET=$(openssl rand -hex 32)
PRODUCTION_SECRET=$(openssl rand -hex 32)

# Staging .env
cat > /var/www/kitmed-staging/.env << EOF
DATABASE_URL=file:/app/data/staging.db
NEXTAUTH_URL=https://${STAGING_SUBDOMAIN}.${DOMAIN_NAME}
NEXTAUTH_SECRET=${STAGING_SECRET}
NODE_ENV=production
MAINTENANCE_MODE=false
UPLOAD_DIR=/app/uploads
MAX_FILE_SIZE=20971520
EOF

# Production .env
cat > /var/www/kitmed-production/.env << EOF
DATABASE_URL=file:/app/data/production.db
NEXTAUTH_URL=https://${DOMAIN_NAME}
NEXTAUTH_SECRET=${PRODUCTION_SECRET}
NODE_ENV=production
MAINTENANCE_MODE=false
UPLOAD_DIR=/app/uploads
MAX_FILE_SIZE=20971520
EOF

print_status "Environment files created with generated secrets"

# Create Docker Compose override for VPS
print_status "Creating Docker Compose configurations..."

# Staging docker-compose.override.yml
cat > /var/www/kitmed-staging/docker-compose.override.yml << 'EOF'
version: '3.8'

services:
  kitmed-app:
    container_name: kitmed-staging
    ports:
      - "3001:3000"
    env_file:
      - .env
    volumes:
      - ./data:/app/data
      - ./uploads:/app/uploads
EOF

# Production docker-compose.override.yml
cat > /var/www/kitmed-production/docker-compose.override.yml << 'EOF'
version: '3.8'

services:
  kitmed-app:
    container_name: kitmed-production
    ports:
      - "3000:3000"
    env_file:
      - .env
    volumes:
      - ./data:/app/data
      - ./uploads:/app/uploads
EOF

# Configure Nginx
print_status "Configuring Nginx..."
sudo tee /etc/nginx/sites-available/kitmed << EOF
# Staging
server {
    listen 80;
    server_name ${STAGING_SUBDOMAIN}.${DOMAIN_NAME};
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Extended timeouts
        proxy_read_timeout 300s;
        proxy_connect_timeout 60s;
        client_body_timeout 300s;
        client_max_body_size 50M;
    }
}

# Production
server {
    listen 80;
    server_name ${DOMAIN_NAME};
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Extended timeouts
        proxy_read_timeout 300s;
        proxy_connect_timeout 60s;
        client_body_timeout 300s;
        client_max_body_size 50M;
    }
}
EOF

# Enable Nginx site
if [ ! -L "/etc/nginx/sites-enabled/kitmed" ]; then
    sudo ln -s /etc/nginx/sites-available/kitmed /etc/nginx/sites-enabled/
fi

# Test and reload Nginx
sudo nginx -t && sudo systemctl reload nginx

print_status "Building and starting applications..."

# Build and start staging
cd /var/www/kitmed-staging
docker-compose build
docker-compose up -d

# Build and start production
cd /var/www/kitmed-production
docker-compose build
docker-compose up -d

# Final status check
print_status "Checking deployment status..."
docker ps

echo ""
print_status "Setup completed! 🎉"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Configure your DNS to point to this server:"
echo "   - ${DOMAIN_NAME} → $(curl -s ifconfig.me)"
echo "   - ${STAGING_SUBDOMAIN}.${DOMAIN_NAME} → $(curl -s ifconfig.me)"
echo ""
echo "2. Set up SSL certificates:"
echo "   sudo apt install certbot python3-certbot-nginx"
echo "   sudo certbot --nginx -d ${DOMAIN_NAME} -d ${STAGING_SUBDOMAIN}.${DOMAIN_NAME}"
echo ""
echo "3. Add these secrets to your GitHub repository:"
echo "   SSH_PRIVATE_KEY: (your SSH private key)"
echo "   STAGING_HOST: $(curl -s ifconfig.me)"
echo "   PRODUCTION_HOST: $(curl -s ifconfig.me)"
echo "   STAGING_USER: $USER"
echo "   PRODUCTION_USER: $USER"
echo "   STAGING_SECRET: ${STAGING_SECRET}"
echo "   PRODUCTION_SECRET: ${PRODUCTION_SECRET}"
echo ""
echo "4. Test your deployments:"
echo "   Staging: http://${STAGING_SUBDOMAIN}.${DOMAIN_NAME}"
echo "   Production: http://${DOMAIN_NAME}"
echo ""
print_warning "Save the secrets above - you'll need them for GitHub Actions!"