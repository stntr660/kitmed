# ✅ Server Onboarding Checklist
*Step-by-step checklist for setting up new applications on the VPS*

## 🎯 Pre-Deployment Planning

### **Application Assessment** ⏱️ 15 minutes
- [ ] **Application Type**: Next.js / WordPress / Node.js / Static Site
- [ ] **Resource Requirements**: RAM (512MB/1GB/2GB+), CPU (light/medium/heavy)
- [ ] **Database Needs**: SQLite / MySQL / PostgreSQL / None
- [ ] **Domain Requirements**: Primary domain, staging subdomain
- [ ] **SSL Certificate**: Let's Encrypt / Custom
- [ ] **Environment Variables**: Development, staging, production configs

### **Port Planning** ⏱️ 5 minutes
- [ ] **Check Available Ports**:
  ```bash
  netstat -tuln | grep LISTEN | sort
  ```
- [ ] **Assign Ports**:
  - Production: 3001-3010
  - Staging: 3011-3020
  - Development: 3021-3030
  - Services: 3031-3040

### **Domain Planning** ⏱️ 10 minutes
- [ ] **Production Domain**: app.domain.com
- [ ] **Staging Domain**: staging-app.domain.com
- [ ] **DNS Records Ready**: A records pointing to 72.61.107.43

---

## 🔧 Initial Server Setup (One-time only)

### **Basic Security Hardening** ⏱️ 60 minutes
- [ ] **SSH Configuration**:
  ```bash
  # Change SSH port
  nano /etc/ssh/sshd_config
  # Set: Port 2222
  # Set: PasswordAuthentication no
  systemctl restart ssh
  ```

- [ ] **Firewall Setup**:
  ```bash
  ufw --force enable
  ufw default deny incoming
  ufw default allow outgoing
  ufw allow 80/tcp
  ufw allow 443/tcp
  ufw allow 2222/tcp
  ```

- [ ] **Fail2Ban Installation**:
  ```bash
  apt update && apt install fail2ban
  systemctl enable fail2ban
  systemctl start fail2ban
  ```

### **Docker Network Setup** ⏱️ 15 minutes
- [ ] **Create Main Network**:
  ```bash
  docker network create root_wp-network
  ```

- [ ] **Setup Nginx Proxy**:
  ```bash
  docker run -d --name nginx-proxy \
    --restart unless-stopped \
    --network root_wp-network \
    -p 80:80 -p 443:443 \
    -v /root/nginx/conf.d:/etc/nginx/conf.d:ro \
    -v /etc/letsencrypt:/etc/letsencrypt:ro \
    nginx:alpine
  ```

### **Default Nginx Configuration** ⏱️ 10 minutes
- [ ] **Create Default Server Block**:
  ```bash
  mkdir -p /root/nginx/conf.d
  cat > /root/nginx/conf.d/000-default.conf << 'EOF'
  server {
      listen 80 default_server;
      listen 443 ssl default_server;
      server_name _;
      
      ssl_certificate /etc/letsencrypt/live/default/fullchain.pem;
      ssl_certificate_key /etc/letsencrypt/live/default/privkey.pem;
      
      return 444;
  }
  EOF
  ```

---

## 🚀 Application Deployment Process

### **Step 1: Prepare Application Environment** ⏱️ 30 minutes

#### **For Next.js Applications**
- [ ] **Create Directory Structure**:
  ```bash
  APP_NAME="newapp"
  mkdir -p /root/docker-volumes/${APP_NAME}-prod
  mkdir -p /root/docker-volumes/${APP_NAME}-staging
  ```

- [ ] **Clone Repository**:
  ```bash
  cd /root/docker-volumes/${APP_NAME}-prod
  git clone <repo-url> .
  git checkout main
  
  cd /root/docker-volumes/${APP_NAME}-staging
  git clone <repo-url> .
  git checkout staging
  ```

- [ ] **Create Environment Files**:
  ```bash
  # Production
  cat > /root/docker-volumes/${APP_NAME}-prod/.env.production.local << EOF
  NODE_ENV=production
  PORT=3000
  DATABASE_URL=file:/app/data/production.db
  NEXTAUTH_SECRET=$(openssl rand -base64 32)
  NEXTAUTH_URL=https://app.domain.com
  EOF
  
  # Staging
  cat > /root/docker-volumes/${APP_NAME}-staging/.env.local << EOF
  NODE_ENV=development
  PORT=3000
  DATABASE_URL=file:/app/data/staging.db
  NEXTAUTH_SECRET=$(openssl rand -base64 32)
  NEXTAUTH_URL=https://staging-app.domain.com
  EOF
  ```

#### **For WordPress Applications**
- [ ] **Create Directory Structure**:
  ```bash
  APP_NAME="newwp"
  mkdir -p /root/docker-volumes/${APP_NAME}
  ```

- [ ] **Create Docker Compose**:
  ```bash
  cat > /root/docker-volumes/${APP_NAME}/docker-compose.yml << EOF
  version: '3.8'
  services:
    wordpress:
      image: wordpress:latest
      container_name: ${APP_NAME}-wp
      networks:
        - root_wp-network
      environment:
        WORDPRESS_DB_HOST: mysql-server
        WORDPRESS_DB_USER: ${APP_NAME}_user
        WORDPRESS_DB_PASSWORD: $(openssl rand -base64 20)
        WORDPRESS_DB_NAME: ${APP_NAME}_db
      volumes:
        - ./wp-content:/var/www/html/wp-content
      restart: unless-stopped

  networks:
    root_wp-network:
      external: true
  EOF
  ```

### **Step 2: Build and Deploy Containers** ⏱️ 45 minutes

#### **Next.js Deployment**
- [ ] **Build Production Container**:
  ```bash
  cd /root/docker-volumes/${APP_NAME}-prod
  docker build -t ${APP_NAME}-prod:latest .
  ```

- [ ] **Deploy Production**:
  ```bash
  PROD_PORT=3005  # Use next available port
  docker run -d \
    --name ${APP_NAME}-prod \
    --network root_wp-network \
    -p ${PROD_PORT}:3000 \
    --env-file .env.production.local \
    ${APP_NAME}-prod:latest
  ```

- [ ] **Build and Deploy Staging**:
  ```bash
  cd /root/docker-volumes/${APP_NAME}-staging
  docker build -t ${APP_NAME}-staging:latest .
  
  STAGING_PORT=3015  # Use next available port
  docker run -d \
    --name ${APP_NAME}-staging \
    --network root_wp-network \
    -p ${STAGING_PORT}:3000 \
    --env-file .env.local \
    ${APP_NAME}-staging:latest
  ```

#### **WordPress Deployment**
- [ ] **Deploy WordPress**:
  ```bash
  cd /root/docker-volumes/${APP_NAME}
  docker-compose up -d
  ```

### **Step 3: Configure Nginx** ⏱️ 20 minutes

- [ ] **Create Nginx Configuration**:
  ```bash
  cat > /root/nginx/conf.d/${APP_NAME}.conf << EOF
  # ${APP_NAME} Production
  server {
      listen 80;
      listen 443 ssl;
      server_name app.domain.com;

      ssl_certificate /etc/letsencrypt/live/app.domain.com/fullchain.pem;
      ssl_certificate_key /etc/letsencrypt/live/app.domain.com/privkey.pem;

      location / {
          proxy_pass http://${APP_NAME}-prod:3000;
          proxy_set_header Host \$host;
          proxy_set_header X-Real-IP \$remote_addr;
          proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
          proxy_set_header X-Forwarded-Proto \$scheme;
      }
  }

  # ${APP_NAME} Staging
  server {
      listen 80;
      listen 443 ssl;
      server_name staging-app.domain.com;

      ssl_certificate /etc/letsencrypt/live/staging-app.domain.com/fullchain.pem;
      ssl_certificate_key /etc/letsencrypt/live/staging-app.domain.com/privkey.pem;

      location / {
          proxy_pass http://${APP_NAME}-staging:3000;
          proxy_set_header Host \$host;
          proxy_set_header X-Real-IP \$remote_addr;
          proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
          proxy_set_header X-Forwarded-Proto \$scheme;
      }
  }
  EOF
  ```

- [ ] **Test and Reload Nginx**:
  ```bash
  docker exec nginx-proxy nginx -t
  docker exec nginx-proxy nginx -s reload
  ```

### **Step 4: SSL Certificate Setup** ⏱️ 15 minutes

- [ ] **Stop Nginx for Standalone Mode**:
  ```bash
  docker stop nginx-proxy
  ```

- [ ] **Generate SSL Certificates**:
  ```bash
  certbot certonly --standalone -d app.domain.com -d staging-app.domain.com
  ```

- [ ] **Restart Nginx**:
  ```bash
  docker start nginx-proxy
  ```

- [ ] **Test SSL**:
  ```bash
  curl -I https://app.domain.com
  curl -I https://staging-app.domain.com
  ```

### **Step 5: Verify Deployment** ⏱️ 10 minutes

- [ ] **Check Container Status**:
  ```bash
  docker ps | grep ${APP_NAME}
  ```

- [ ] **Test HTTP Response**:
  ```bash
  curl -I https://app.domain.com
  curl -I https://staging-app.domain.com
  ```

- [ ] **Check Application Logs**:
  ```bash
  docker logs ${APP_NAME}-prod
  docker logs ${APP_NAME}-staging
  ```

- [ ] **Test Core Functionality**: Manual testing of key features

---

## 💾 Post-Deployment Setup

### **Backup Configuration** ⏱️ 20 minutes

- [ ] **Create Backup Script**:
  ```bash
  cat > /root/scripts/backup_${APP_NAME}.sh << 'EOF'
  #!/bin/bash
  APP_NAME="newapp"
  BACKUP_DIR="/root/backups/daily/$(date +%Y%m%d)"
  mkdir -p $BACKUP_DIR
  
  # Database backup
  docker exec ${APP_NAME}-prod cp /app/data/production.db /tmp/
  docker cp ${APP_NAME}-prod:/tmp/production.db $BACKUP_DIR/${APP_NAME}_prod.db
  
  # Uploads backup
  docker exec ${APP_NAME}-prod tar -czf /tmp/uploads.tar.gz /app/uploads/ 2>/dev/null || true
  docker cp ${APP_NAME}-prod:/tmp/uploads.tar.gz $BACKUP_DIR/${APP_NAME}_uploads.tar.gz 2>/dev/null || true
  
  echo "$(date): ${APP_NAME} backup completed" >> /var/log/backup.log
  EOF
  
  chmod +x /root/scripts/backup_${APP_NAME}.sh
  ```

- [ ] **Add to Cron** (if not already scheduled):
  ```bash
  echo "0 3 * * * /root/scripts/backup_${APP_NAME}.sh" | crontab -l > mycron && echo "0 3 * * * /root/scripts/backup_${APP_NAME}.sh" >> mycron && crontab mycron && rm mycron
  ```

### **Monitoring Setup** ⏱️ 15 minutes

- [ ] **Add to Health Check Script**:
  ```bash
  # Add lines to /root/scripts/health_check_all.sh
  echo "# Check ${APP_NAME}" >> /root/scripts/health_check_all.sh
  echo "curl -s -o /dev/null -w \"${APP_NAME} prod: %{http_code}\n\" https://app.domain.com" >> /root/scripts/health_check_all.sh
  echo "curl -s -o /dev/null -w \"${APP_NAME} staging: %{http_code}\n\" https://staging-app.domain.com" >> /root/scripts/health_check_all.sh
  ```

### **Documentation Update** ⏱️ 10 minutes

- [ ] **Update Application Inventory**:
  ```bash
  echo "## ${APP_NAME}" >> /root/APPLICATION_INVENTORY.md
  echo "- **Type**: Next.js/WordPress" >> /root/APPLICATION_INVENTORY.md
  echo "- **Production**: https://app.domain.com (port ${PROD_PORT})" >> /root/APPLICATION_INVENTORY.md
  echo "- **Staging**: https://staging-app.domain.com (port ${STAGING_PORT})" >> /root/APPLICATION_INVENTORY.md
  echo "- **Repository**: <repo-url>" >> /root/APPLICATION_INVENTORY.md
  echo "- **Deployed**: $(date)" >> /root/APPLICATION_INVENTORY.md
  echo "" >> /root/APPLICATION_INVENTORY.md
  ```

---

## 🔍 Testing Checklist

### **Functional Testing** ⏱️ 30 minutes
- [ ] **Homepage loads correctly**
- [ ] **Navigation works**
- [ ] **User authentication** (if applicable)
- [ ] **Database operations** (CRUD functionality)
- [ ] **File uploads** (if applicable)
- [ ] **API endpoints respond** (if applicable)
- [ ] **Mobile responsiveness**

### **Performance Testing** ⏱️ 15 minutes
- [ ] **Page load time** < 3 seconds
- [ ] **Server response time** < 500ms
- [ ] **Resource usage** within limits:
  ```bash
  docker stats ${APP_NAME}-prod
  ```

### **Security Testing** ⏱️ 20 minutes
- [ ] **HTTPS redirect working**
- [ ] **Security headers present**:
  ```bash
  curl -I https://app.domain.com
  ```
- [ ] **No exposed environment variables**
- [ ] **Database files protected** (not web-accessible)
- [ ] **Admin areas protected** (if applicable)

---

## 🚨 Rollback Procedures

### **If Deployment Fails**
- [ ] **Check Container Logs**:
  ```bash
  docker logs ${APP_NAME}-prod
  ```

- [ ] **Rollback Container** (if backup exists):
  ```bash
  docker stop ${APP_NAME}-prod && docker rm ${APP_NAME}-prod
  docker run -d --name ${APP_NAME}-prod --network root_wp-network -p PORT:3000 --env-file .env.production.local ${APP_NAME}-prod:backup-TIMESTAMP
  ```

- [ ] **Enable Maintenance Mode**:
  ```bash
  echo "MAINTENANCE_MODE=true" >> /root/docker-volumes/${APP_NAME}-prod/.env.production.local
  docker restart ${APP_NAME}-prod
  ```

### **If SSL Fails**
- [ ] **Use Temporary Self-Signed**:
  ```bash
  openssl req -x509 -nodes -days 30 -newkey rsa:2048 \
    -keyout /etc/ssl/private/temp.key \
    -out /etc/ssl/certs/temp.crt
  ```

- [ ] **Update Nginx temporarily**
- [ ] **Fix Let's Encrypt issue**
- [ ] **Regenerate proper certificates**

---

## 📋 Final Verification

### **Deployment Complete Checklist**
- [ ] **Application accessible** on production domain
- [ ] **Application accessible** on staging domain
- [ ] **SSL certificates** valid and working
- [ ] **Container health** check passing
- [ ] **Backup script** configured and tested
- [ ] **Monitoring** updated with new application
- [ ] **Documentation** updated
- [ ] **Team notified** of new deployment

### **Handover Information**
- [ ] **Application URLs**: Production and staging
- [ ] **Container Names**: For management commands
- [ ] **Environment Files**: Locations for updates
- [ ] **Backup Schedule**: When and where backups run
- [ ] **Key Commands**: For common operations
- [ ] **Emergency Contacts**: Who to call if issues arise

---

## 📞 Quick Commands for New App

```bash
# Replace 'newapp' with actual app name
APP_NAME="newapp"

# Check status
docker ps | grep $APP_NAME

# View logs
docker logs ${APP_NAME}-prod
docker logs ${APP_NAME}-staging

# Restart
docker restart ${APP_NAME}-prod
docker restart ${APP_NAME}-staging

# Update and redeploy
cd /root/docker-volumes/${APP_NAME}-prod
git pull origin main
docker build -t ${APP_NAME}-prod:latest .
docker stop ${APP_NAME}-prod && docker rm ${APP_NAME}-prod
docker run -d --name ${APP_NAME}-prod --network root_wp-network -p PORT:3000 --env-file .env.production.local ${APP_NAME}-prod:latest

# Check health
curl -I https://app.domain.com
```

---

*💡 Use this checklist for every new application deployment*  
*✅ Check off each item as completed*  
*📝 Update with lessons learned from each deployment*