# VPS Setup Guide for KITMED

## Server Requirements

- Ubuntu 20.04+ or similar Linux distribution
- Minimum 2GB RAM, 20GB storage
- Docker and docker-compose installed
- SSH access with sudo privileges

## Initial VPS Setup

### 1. Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install docker-compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.21.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install nginx
sudo apt install nginx -y
```

### 2. Create Directory Structure

```bash
sudo mkdir -p /var/www/kitmed-staging
sudo mkdir -p /var/www/kitmed-production
sudo chown -R $USER:$USER /var/www/
```

### 3. Clone Repository

```bash
# Staging
cd /var/www/kitmed-staging
git clone -b staging https://github.com/yourusername/kitmed .

# Production
cd /var/www/kitmed-production
git clone -b main https://github.com/yourusername/kitmed .
```

### 4. Environment Configuration

Create environment files for each environment:

**Staging (.env.staging):**
```bash
# Database
DATABASE_URL=file:/app/data/staging.db

# Application
NEXTAUTH_URL=https://staging.kitmed.com
NEXTAUTH_SECRET=staging-secret-key-change-this
NODE_ENV=production
MAINTENANCE_MODE=false

# File uploads
UPLOAD_DIR=/app/uploads
MAX_FILE_SIZE=20971520
```

**Production (.env.production):**
```bash
# Database
DATABASE_URL=file:/app/data/production.db

# Application
NEXTAUTH_URL=https://kitmed.com
NEXTAUTH_SECRET=production-secret-key-change-this
NODE_ENV=production
MAINTENANCE_MODE=false

# File uploads
UPLOAD_DIR=/app/uploads
MAX_FILE_SIZE=20971520
```

### 5. Nginx Configuration

Create `/etc/nginx/sites-available/kitmed`:

```nginx
# Staging
server {
    listen 80;
    server_name staging.kitmed.com;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Production
server {
    listen 80;
    server_name kitmed.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/kitmed /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 6. Update Docker Compose for VPS

**Staging docker-compose.yml:**
```yaml
services:
  kitmed-staging:
    image: ghcr.io/yourusername/kitmed:staging
    container_name: kitmed-staging
    restart: unless-stopped
    ports:
      - "3001:3000"
    environment:
      - DATABASE_URL=file:/app/data/staging.db
      - NEXTAUTH_URL=https://staging.kitmed.com
      - NEXTAUTH_SECRET=${STAGING_SECRET}
      - NODE_ENV=production
      - MAINTENANCE_MODE=${MAINTENANCE_MODE:-false}
    volumes:
      - ./data:/app/data
      - ./uploads:/app/uploads
```

**Production docker-compose.yml:**
```yaml
services:
  kitmed-production:
    image: ghcr.io/yourusername/kitmed:main
    container_name: kitmed-production
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=file:/app/data/production.db
      - NEXTAUTH_URL=https://kitmed.com
      - NEXTAUTH_SECRET=${PRODUCTION_SECRET}
      - NODE_ENV=production
      - MAINTENANCE_MODE=${MAINTENANCE_MODE:-false}
    volumes:
      - ./data:/app/data
      - ./uploads:/app/uploads
```

## GitHub Secrets Setup

Add these secrets to your GitHub repository:

### Repository Secrets
- `SSH_PRIVATE_KEY`: Your VPS SSH private key
- `STAGING_HOST`: staging server IP/hostname
- `STAGING_USER`: SSH username for staging
- `PRODUCTION_HOST`: production server IP/hostname  
- `PRODUCTION_USER`: SSH username for production

### Environment Secrets
**Staging Environment:**
- `STAGING_SECRET`: NextAuth secret for staging

**Production Environment:**  
- `PRODUCTION_SECRET`: NextAuth secret for production

## Maintenance Mode

To enable maintenance mode:

```bash
# Staging
cd /var/www/kitmed-staging
docker-compose down
MAINTENANCE_MODE=true docker-compose up -d

# Production
cd /var/www/kitmed-production
docker-compose down  
MAINTENANCE_MODE=true docker-compose up -d
```

To disable:
```bash
MAINTENANCE_MODE=false docker-compose up -d
```

## Deployment Workflow

1. **Local Development:**
   - Work on feature branches
   - Test locally with `npm run dev`

2. **Staging Deployment:**
   - Push to `staging` branch
   - GitHub Actions auto-deploys to staging server
   - Test at staging.kitmed.com

3. **Production Deployment:**
   - Merge staging to `main` branch  
   - GitHub Actions auto-deploys to production server
   - Live at kitmed.com

## SSL Setup (Optional)

For HTTPS, install Let's Encrypt:

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d kitmed.com -d staging.kitmed.com
```

## Monitoring Commands

```bash
# Check container status
docker ps

# View logs
docker logs kitmed-production -f
docker logs kitmed-staging -f

# Update containers manually
cd /var/www/kitmed-production
docker-compose pull && docker-compose up -d

# Database backup
docker exec kitmed-production cp /app/data/production.db /app/data/backup-$(date +%Y%m%d).db
```

This setup gives you complete control over staging and production environments while maintaining simple CI/CD with GitHub Actions.