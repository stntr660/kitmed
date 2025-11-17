# 🖥️ VPS Server Management - Best Practices Guide
*Comprehensive guide for managing multiple applications on a single VPS*

## 🎯 Server Overview

**Server Details:**
- **IP**: 72.61.107.43
- **Provider**: Hostinger VPS
- **OS**: Ubuntu/Debian Linux
- **Purpose**: Multi-application hosting (WordPress, Next.js, Node.js services)

---

## 🏗️ Server Architecture Standards

### **Directory Structure**
```
/root/
├── docker-volumes/          # Application data
│   ├── app-name-prod/      # Production environment
│   ├── app-name-staging/   # Staging environment
│   └── app-name-dev/       # Development environment
├── nginx/                  # Nginx configurations
│   └── conf.d/             # Individual site configs
├── scripts/                # Management scripts
├── backups/                # Backup storage
│   ├── daily/             # Automated daily backups
│   ├── manual/            # Manual backups
│   └── encrypted/         # Encrypted sensitive backups
└── ssl/                   # SSL certificate storage
```

### **Network Architecture**
```
Internet → nginx-proxy (80/443) → Docker Network → Applications
                                     ├── app1-prod (port 3001)
                                     ├── app1-staging (port 3002)  
                                     ├── app2-prod (port 3003)
                                     ├── app2-staging (port 3004)
                                     └── monitoring services
```

---

## 🚀 Adding New Applications

### **1. Planning Phase** ⏱️ 30 minutes

#### **Application Assessment**
```bash
# Before starting, document:
# - Application type (WordPress, Next.js, Node.js, etc.)
# - Resource requirements (RAM, CPU, storage)
# - Environment variables needed
# - Database requirements
# - Domain/subdomain requirements
# - SSL certificate needs
```

#### **Port Assignment Strategy**
```bash
# Port allocation scheme:
# 3001-3010: Production applications
# 3011-3020: Staging applications  
# 3021-3030: Development applications
# 3031-3040: Monitoring/utility services

# Check available ports
netstat -tuln | grep LISTEN | sort
```

### **2. Environment Setup** ⏱️ 45 minutes

#### **Create Directory Structure**
```bash
APP_NAME="newapp"  # Change this

# Create application directories
mkdir -p /root/docker-volumes/${APP_NAME}-prod
mkdir -p /root/docker-volumes/${APP_NAME}-staging
mkdir -p /root/docker-volumes/${APP_NAME}-dev

# Set proper permissions
chmod 755 /root/docker-volumes/${APP_NAME}-*
```

#### **Docker Network Setup**
```bash
# Ensure application uses the main network
docker network ls | grep root_wp-network || docker network create root_wp-network

# Connect future containers to this network
```

### **3. Application Deployment** ⏱️ 60-90 minutes

#### **For Next.js/React Applications**
```bash
APP_NAME="newapp"
PROD_PORT="3005"     # Assign available port
STAGING_PORT="3015"  # Assign available port

# Production deployment
cd /root/docker-volumes/${APP_NAME}-prod
git clone <repository-url> .
git checkout main

# Create production environment file
cat > .env.production.local << EOF
NODE_ENV=production
PORT=3000
DATABASE_URL=file:/app/data/production.db
NEXTAUTH_SECRET=$(openssl rand -base64 32)
NEXTAUTH_URL=https://${APP_NAME}.yourdomain.com
EOF

# Build and run production
docker build -t ${APP_NAME}-prod:latest .
docker run -d \
  --name ${APP_NAME}-prod \
  --network root_wp-network \
  -p ${PROD_PORT}:3000 \
  --env-file .env.production.local \
  ${APP_NAME}-prod:latest

# Staging deployment  
cd /root/docker-volumes/${APP_NAME}-staging
git clone <repository-url> .
git checkout staging

# Create staging environment file
cat > .env.local << EOF
NODE_ENV=development
PORT=3000
DATABASE_URL=file:/app/data/staging.db
NEXTAUTH_SECRET=$(openssl rand -base64 32)
NEXTAUTH_URL=https://staging-${APP_NAME}.yourdomain.com
EOF

# Build and run staging
docker build -t ${APP_NAME}-staging:latest .
docker run -d \
  --name ${APP_NAME}-staging \
  --network root_wp-network \
  -p ${STAGING_PORT}:3000 \
  --env-file .env.local \
  ${APP_NAME}-staging:latest
```

#### **For WordPress Applications**
```bash
APP_NAME="newwordpress"
DOMAIN="newsite.com"

# Create WordPress setup
mkdir -p /root/docker-volumes/${APP_NAME}
cd /root/docker-volumes/${APP_NAME}

# Create docker-compose.yml
cat > docker-compose.yml << EOF
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

# Deploy WordPress
docker-compose up -d
```

### **4. Nginx Configuration** ⏱️ 30 minutes

#### **Create Nginx Configuration**
```bash
APP_NAME="newapp"
DOMAIN="newapp.yourdomain.com"
STAGING_DOMAIN="staging-newapp.yourdomain.com"

cat > /root/nginx/conf.d/${APP_NAME}.conf << EOF
# ${APP_NAME} - Production and Staging
server {
    listen 80;
    listen 443 ssl;
    server_name ${DOMAIN};

    ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;

    location / {
        proxy_pass http://${APP_NAME}-prod:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}

server {
    listen 80;
    listen 443 ssl;
    server_name ${STAGING_DOMAIN};

    ssl_certificate /etc/letsencrypt/live/${STAGING_DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${STAGING_DOMAIN}/privkey.pem;

    location / {
        proxy_pass http://${APP_NAME}-staging:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Test and reload nginx
docker exec nginx-proxy nginx -t
docker exec nginx-proxy nginx -s reload
```

### **5. SSL Certificate Setup** ⏱️ 15 minutes

#### **Generate SSL Certificates**
```bash
APP_DOMAIN="newapp.yourdomain.com"
STAGING_DOMAIN="staging-newapp.yourdomain.com"

# Stop nginx temporarily for standalone mode
docker stop nginx-proxy

# Generate certificates
certbot certonly --standalone -d ${APP_DOMAIN} -d ${STAGING_DOMAIN}

# Restart nginx
docker start nginx-proxy

# Test SSL
curl -I https://${APP_DOMAIN}
curl -I https://${STAGING_DOMAIN}
```

---

## 🔧 Application Management

### **Standard Operations**

#### **Update Application**
```bash
APP_NAME="appname"

# Update staging first
cd /root/docker-volumes/${APP_NAME}-staging
git pull origin staging
docker build -t ${APP_NAME}-staging:latest .
docker stop ${APP_NAME}-staging
docker rm ${APP_NAME}-staging
docker run -d --name ${APP_NAME}-staging --network root_wp-network -p PORT:3000 --env-file .env.local ${APP_NAME}-staging:latest

# Test staging thoroughly, then update production
cd /root/docker-volumes/${APP_NAME}-prod  
git pull origin main
docker build -t ${APP_NAME}-prod:latest .
docker stop ${APP_NAME}-prod
docker rm ${APP_NAME}-prod
docker run -d --name ${APP_NAME}-prod --network root_wp-network -p PORT:3000 --env-file .env.production.local ${APP_NAME}-prod:latest
```

#### **Environment Variable Management**
```bash
APP_NAME="appname"

# View current environment
cat /root/docker-volumes/${APP_NAME}-prod/.env.production.local

# Add new variable
echo "NEW_VARIABLE=value" >> /root/docker-volumes/${APP_NAME}-prod/.env.production.local

# Remove variable
sed -i '/VARIABLE_NAME=/d' /root/docker-volumes/${APP_NAME}-prod/.env.production.local

# Apply changes
docker restart ${APP_NAME}-prod
```

### **Maintenance Mode**

#### **Enable Maintenance**
```bash
APP_NAME="appname"

# For Next.js apps with maintenance middleware
echo "MAINTENANCE_MODE=true" >> /root/docker-volumes/${APP_NAME}-prod/.env.production.local
docker restart ${APP_NAME}-prod

# For other apps, create maintenance page in nginx
cat > /root/nginx/conf.d/${APP_NAME}-maintenance.conf << EOF
server {
    listen 80;
    listen 443 ssl;
    server_name yourdomain.com;
    
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    location / {
        return 503 "Site under maintenance. Please check back soon.";
        add_header Content-Type text/plain;
    }
}
EOF

# Disable main config and reload
mv /root/nginx/conf.d/${APP_NAME}.conf /root/nginx/conf.d/${APP_NAME}.conf.disabled
docker exec nginx-proxy nginx -s reload
```

---

## 🔒 Security Best Practices

### **Application Security**

#### **Container Security Standards**
```bash
# Always run containers with:
# 1. Resource limits
# 2. Read-only filesystem where possible
# 3. Non-root user
# 4. Isolated network
# 5. Environment file security

# Example secure container deployment
docker run -d \
  --name app-secure \
  --network isolated-network \
  --memory="512m" \
  --cpu-shares=512 \
  --read-only=true \
  --tmpfs /tmp:rw,noexec,nosuid \
  --user 1000:1000 \
  --env-file .env.secure \
  app-image:latest
```

#### **Environment File Security**
```bash
# Set proper permissions on environment files
chmod 600 /root/docker-volumes/*/.env*
chown root:root /root/docker-volumes/*/.env*

# Never commit environment files to git
echo "*.env*" >> /root/docker-volumes/*/.gitignore

# Use secrets management for sensitive data
docker secret create app_db_password - <<< "$(openssl rand -base64 32)"
```

### **Network Security**

#### **Firewall Rules for New Applications**
```bash
# When adding new applications, only open necessary ports
# Never expose application ports directly

# Good: Only expose 80/443 (nginx handles routing)
ufw allow 80/tcp
ufw allow 443/tcp

# Bad: Exposing application ports directly
# ufw allow 3001/tcp  # Don't do this
```

#### **Domain Security**
```bash
# Always ensure default server block exists to prevent domain bleeding
cat > /root/nginx/conf.d/000-default.conf << EOF
server {
    listen 80 default_server;
    listen 443 ssl default_server;
    server_name _;
    
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    return 444;
}
EOF
```

---

## 💾 Backup Strategies

### **Application Backup Standards**

#### **Database Backups**
```bash
# For each application, implement database backup
cat > /root/scripts/backup_${APP_NAME}.sh << 'EOF'
#!/bin/bash
APP_NAME="appname"
BACKUP_DIR="/root/backups/daily/$(date +%Y%m%d)"
mkdir -p $BACKUP_DIR

# SQLite backup
docker exec ${APP_NAME}-prod cp /app/data/production.db /tmp/
docker cp ${APP_NAME}-prod:/tmp/production.db $BACKUP_DIR/${APP_NAME}_prod.db

# MySQL backup (if applicable)
docker exec mysql-server mysqldump -u${APP_NAME}_user -p${PASSWORD} ${APP_NAME}_db > $BACKUP_DIR/${APP_NAME}_mysql.sql

# File uploads backup
docker exec ${APP_NAME}-prod tar -czf /tmp/uploads.tar.gz /app/uploads/
docker cp ${APP_NAME}-prod:/tmp/uploads.tar.gz $BACKUP_DIR/${APP_NAME}_uploads.tar.gz

echo "$(date): ${APP_NAME} backup completed" >> /var/log/backup.log
EOF

chmod +x /root/scripts/backup_${APP_NAME}.sh
```

#### **Configuration Backup**
```bash
# Backup nginx configurations
cat > /root/scripts/backup_configs.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/root/backups/configs/$(date +%Y%m%d)"
mkdir -p $BACKUP_DIR

# Backup nginx configs
cp -r /root/nginx/conf.d $BACKUP_DIR/

# Backup environment files
cp /root/docker-volumes/*/.env* $BACKUP_DIR/ 2>/dev/null || true

# Backup docker-compose files
find /root/docker-volumes -name "docker-compose.yml" -exec cp {} $BACKUP_DIR/ \;

echo "$(date): Configuration backup completed" >> /var/log/backup.log
EOF

chmod +x /root/scripts/backup_configs.sh
```

---

## 📊 Monitoring & Maintenance

### **Health Monitoring**

#### **Application Health Check Script**
```bash
cat > /root/scripts/health_check_all.sh << 'EOF'
#!/bin/bash

echo "=== Server Health Check $(date) ==="

# System resources
echo "## System Resources"
echo "CPU: $(uptime | awk -F'load average:' '{print $2}')"
echo "Memory: $(free -h | awk 'NR==2{printf "%.1f%% used", $3*100/$2}')"
echo "Disk: $(df -h / | awk 'NR==2{print $5 " used"}')"

# Container status
echo -e "\n## Container Status"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# HTTP status checks
echo -e "\n## HTTP Status"
for domain in $(grep server_name /root/nginx/conf.d/*.conf | grep -v '_' | awk '{print $2}' | tr -d ';' | sort -u); do
    if [[ $domain != "localhost" ]]; then
        status=$(curl -s -o /dev/null -w "%{http_code}" https://$domain 2>/dev/null || echo "ERROR")
        echo "$domain: $status"
    fi
done

# SSL certificate status
echo -e "\n## SSL Certificates"
certbot certificates 2>/dev/null | grep -E "(Certificate Name|Expiry Date)" | paste - - | while read line; do
    echo $line | awk '{print $3 ": expires " $6}'
done

# Recent errors
echo -e "\n## Recent Errors"
tail -5 /var/log/nginx/error.log 2>/dev/null || echo "No recent nginx errors"

echo "=================================="
EOF

chmod +x /root/scripts/health_check_all.sh

# Schedule health checks
echo "*/30 * * * * /root/scripts/health_check_all.sh >> /var/log/health_check.log" | crontab -
```

### **Performance Monitoring**

#### **Resource Usage Monitoring**
```bash
cat > /root/scripts/resource_monitor.sh << 'EOF'
#!/bin/bash

# Log resource usage
echo "$(date),$(uptime | awk -F'load average:' '{print $2}'),$(free | awk 'NR==2{printf "%.1f", $3*100/$2}'),$(df / | awk 'NR==2{print $5}' | tr -d %)" >> /var/log/resource_usage.log

# Alert on high usage
MEMORY_USAGE=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
DISK_USAGE=$(df / | awk 'NR==2{print $5}' | tr -d %)

if [ $MEMORY_USAGE -gt 80 ]; then
    echo "$(date): High memory usage: ${MEMORY_USAGE}%" >> /var/log/alerts.log
fi

if [ $DISK_USAGE -gt 80 ]; then
    echo "$(date): High disk usage: ${DISK_USAGE}%" >> /var/log/alerts.log
fi
EOF

chmod +x /root/scripts/resource_monitor.sh

# Monitor every 5 minutes
echo "*/5 * * * * /root/scripts/resource_monitor.sh" | crontab -
```

---

## 🚀 Deployment Automation

### **Automated Deployment Script**

#### **Generic Deployment Template**
```bash
cat > /root/scripts/deploy_app.sh << 'EOF'
#!/bin/bash

# Usage: ./deploy_app.sh <app-name> <environment> <branch>
# Example: ./deploy_app.sh myapp production main

APP_NAME=$1
ENVIRONMENT=$2
BRANCH=${3:-main}

if [ -z "$APP_NAME" ] || [ -z "$ENVIRONMENT" ]; then
    echo "Usage: $0 <app-name> <environment> [branch]"
    exit 1
fi

# Set variables
CONTAINER_NAME="${APP_NAME}-${ENVIRONMENT}"
APP_DIR="/root/docker-volumes/${CONTAINER_NAME}"
ENV_FILE=".env.${ENVIRONMENT}.local"

echo "=== Deploying ${APP_NAME} (${ENVIRONMENT}) ==="

# Pull latest code
cd $APP_DIR
git fetch origin
git checkout $BRANCH
git pull origin $BRANCH

# Build new image
docker build -t ${CONTAINER_NAME}:latest .

# Create backup of current container
if docker ps -a | grep -q $CONTAINER_NAME; then
    docker commit $CONTAINER_NAME ${CONTAINER_NAME}:backup-$(date +%Y%m%d-%H%M%S)
    docker stop $CONTAINER_NAME
    docker rm $CONTAINER_NAME
fi

# Deploy new container
docker run -d \
    --name $CONTAINER_NAME \
    --network root_wp-network \
    --env-file $ENV_FILE \
    ${CONTAINER_NAME}:latest

# Verify deployment
sleep 10
if docker ps | grep -q $CONTAINER_NAME; then
    echo "✅ Deployment successful"
    
    # Cleanup old backup images (keep 3 most recent)
    docker images ${CONTAINER_NAME} --format "table {{.Tag}}\t{{.CreatedAt}}" | grep backup | sort -k2 | head -n -3 | awk '{print $1}' | xargs -I {} docker rmi ${CONTAINER_NAME}:{} 2>/dev/null || true
else
    echo "❌ Deployment failed"
    # Rollback to backup
    BACKUP_TAG=$(docker images ${CONTAINER_NAME} --format "table {{.Tag}}" | grep backup | head -1)
    if [ ! -z "$BACKUP_TAG" ]; then
        echo "Rolling back to $BACKUP_TAG"
        docker run -d \
            --name $CONTAINER_NAME \
            --network root_wp-network \
            --env-file $ENV_FILE \
            ${CONTAINER_NAME}:$BACKUP_TAG
    fi
    exit 1
fi

echo "=== Deployment Complete ==="
EOF

chmod +x /root/scripts/deploy_app.sh
```

---

## 📋 Maintenance Checklists

### **Daily Tasks**
- [ ] Check health check logs: `tail /var/log/health_check.log`
- [ ] Verify all containers running: `docker ps`
- [ ] Check disk space: `df -h`
- [ ] Review nginx error logs: `tail /var/log/nginx/error.log`

### **Weekly Tasks**
- [ ] Update system packages: `apt update && apt upgrade`
- [ ] Review security logs: `grep "Failed password" /var/log/auth.log`
- [ ] Check SSL certificate expiry: `certbot certificates`
- [ ] Test backups: Restore test data from backup
- [ ] Review resource usage: `cat /var/log/resource_usage.log | tail -100`

### **Monthly Tasks**
- [ ] Security audit using scripts in SECURITY_AUDIT_CHECKLIST.md
- [ ] Full system backup
- [ ] Review and update documentation
- [ ] Performance optimization review
- [ ] Update application dependencies

---

## 🆘 Emergency Procedures

### **Server Unresponsive**
```bash
# 1. Check server connectivity
ping 72.61.107.43

# 2. Access via Hostinger console if SSH fails

# 3. Restart services in order
systemctl restart docker
systemctl restart nginx

# 4. Start critical applications first
docker start nginx-proxy
docker start $(docker ps -a | grep -E "(prod|production)" | awk '{print $1}')

# 5. Verify services
./health_check_all.sh
```

### **Critical Application Down**
```bash
APP_NAME="appname"

# 1. Check container status
docker ps -a | grep $APP_NAME

# 2. Check logs for errors
docker logs ${APP_NAME}-prod

# 3. Quick restart
docker restart ${APP_NAME}-prod

# 4. If restart fails, redeploy
./deploy_app.sh $APP_NAME production main

# 5. If still failing, enable maintenance mode
echo "MAINTENANCE_MODE=true" >> /root/docker-volumes/${APP_NAME}-prod/.env.production.local
docker restart ${APP_NAME}-prod
```

---

## 📞 Quick Reference

### **Essential Commands**
```bash
# Container management
docker ps                          # List running containers
docker logs <container>            # View container logs
docker restart <container>         # Restart container
docker exec -it <container> bash   # Access container shell

# Nginx management
docker exec nginx-proxy nginx -t   # Test configuration
docker exec nginx-proxy nginx -s reload  # Reload configuration
tail -f /var/log/nginx/access.log  # Monitor access

# System monitoring
htop                               # Resource usage
df -h                             # Disk usage
netstat -tuln | grep LISTEN      # Listening ports
systemctl status docker          # Docker service status

# SSL certificates
certbot certificates              # List certificates
certbot renew --dry-run          # Test renewal
```

### **Important File Locations**
```
Application code: /root/docker-volumes/
Nginx configs: /root/nginx/conf.d/
SSL certificates: /etc/letsencrypt/live/
Backup storage: /root/backups/
Scripts: /root/scripts/
Logs: /var/log/
```

---

*💡 Keep this guide updated as you add new applications and refine processes*  
*📅 Last updated: November 17, 2025*  
*🔄 Review and update monthly*