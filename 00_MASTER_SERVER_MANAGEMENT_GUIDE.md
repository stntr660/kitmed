# 🖥️ Master Server Management Guide
*Complete VPS Management for Multiple Applications*

## 📍 Quick Navigation

### **General Server Management**
- [🔧 Server Setup & Hardening](#server-setup--hardening)
- [🚀 Application Deployment](#application-deployment)
- [🔒 Security Management](#security-management)
- [📊 Monitoring & Maintenance](#monitoring--maintenance)
- [🆘 Emergency Procedures](#emergency-procedures)

### **Server Information**
- **IP**: 72.61.107.43
- **Provider**: Hostinger VPS
- **SSH**: `ssh vps` (port 22, key-based auth)
- **OS**: Ubuntu/Debian Linux

---

## 🏗️ Server Architecture

### **Current Applications**
| **Application** | **Status** | **Production URL** | **Staging URL** | **Ports** |
|-----------------|------------|-------------------|-----------------|-----------|
| KITMED Platform | 🟢 Active | https://kitmed.ma | https://staging.kitmed.ma | 3001/3002 |
| WordPress Sites | 🟢 Active | airarom.ma, electroromanos.ma, yvesmorel.ma | - | 80/443 |
| Monitoring | 🟢 Active | n8n.zonemation.cloud, grafana.zonemation.cloud | - | Custom |

### **Directory Structure**
```
/root/
├── docker-volumes/          # Application data
│   ├── kitmed-prod/         # KITMED production
│   ├── kitmed-staging/      # KITMED staging
│   ├── airarom-wp/          # WordPress sites
│   └── [app-name]/          # Future applications
├── nginx/                   # Nginx configurations
│   └── conf.d/              # Individual site configs
├── scripts/                 # Management scripts
├── backups/                 # Backup storage
│   ├── daily/              # Automated backups
│   ├── manual/             # Manual backups
│   └── encrypted/          # Sensitive backups
└── ssl/                    # SSL certificates
```

### **Network Architecture**
```
Internet → nginx-proxy (80/443) → root_wp-network → Applications
                                     ├── kitmed-prod (3001)
                                     ├── kitmed-staging (3002)
                                     ├── wordpress sites (80)
                                     └── monitoring services
```

---

## 🔧 Server Setup & Hardening

### **Initial Security Setup** ⏱️ 90 minutes

#### **SSH Hardening (Critical)**
```bash
# 1. Change SSH port
nano /etc/ssh/sshd_config
# Change: Port 22 → Port 2222
# Set: PasswordAuthentication no
# Set: PermitRootLogin prohibit-password

# 2. Restart SSH (CAUTION: Do while connected)
systemctl restart sshd

# 3. Update firewall
ufw allow 2222/tcp
ufw deny 22/tcp

# 4. Update local SSH config
echo "Host vps
    HostName 72.61.107.43
    User root
    Port 2222
    IdentityFile ~/.ssh/claude_vps_key
    StrictHostKeyChecking no" > ~/.ssh/config
```

#### **Firewall Configuration**
```bash
# Enable firewall
ufw --force enable
ufw default deny incoming
ufw default allow outgoing

# Allow essential ports only
ufw allow 80/tcp       # HTTP
ufw allow 443/tcp      # HTTPS
ufw allow 2222/tcp     # SSH (new port)

# Verify rules
ufw status numbered
```

#### **Install Security Tools**
```bash
# Install essential security packages
apt update && apt install -y fail2ban logwatch chkrootkit

# Configure fail2ban
cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 1h
findtime = 10m
maxretry = 3

[sshd]
enabled = true
port = 2222
logpath = /var/log/auth.log
EOF

systemctl enable fail2ban && systemctl start fail2ban
```

### **Docker & Network Setup**
```bash
# Install Docker (if not already installed)
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Create main network for all applications
docker network create root_wp-network

# Setup nginx proxy container
docker run -d --name nginx-proxy \
  --restart unless-stopped \
  --network root_wp-network \
  -p 80:80 -p 443:443 \
  -v /root/nginx/conf.d:/etc/nginx/conf.d:ro \
  -v /etc/letsencrypt:/etc/letsencrypt:ro \
  nginx:alpine

# Create default server block (prevents domain bleeding)
mkdir -p /root/nginx/conf.d
cat > /root/nginx/conf.d/000-default.conf << 'EOF'
server {
    listen 80 default_server;
    listen 443 ssl default_server;
    server_name _;
    
    ssl_certificate /etc/letsencrypt/live/kitmed.ma/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/kitmed.ma/privkey.pem;
    
    return 444;
}
EOF
```

---

## 🚀 Application Deployment

### **Port Allocation Strategy**
```bash
# Port assignment scheme:
# 3001-3010: Production applications
# 3011-3020: Staging applications
# 3021-3030: Development applications
# 3031-3040: Monitoring/utility services

# Check available ports
netstat -tuln | grep LISTEN | sort
```

### **Adding New Application** ⏱️ 2-3 hours

#### **1. Planning Phase (30 minutes)**
- [ ] **Application type**: Next.js / WordPress / Node.js
- [ ] **Resource requirements**: RAM, CPU, storage
- [ ] **Domain requirements**: production/staging domains
- [ ] **Port assignment**: from available range
- [ ] **Database needs**: SQLite / MySQL / PostgreSQL

#### **2. Environment Setup (45 minutes)**
```bash
APP_NAME="newapp"  # Replace with actual name
PROD_PORT="3005"   # Assign available port
STAGING_PORT="3015"

# Create directories
mkdir -p /root/docker-volumes/${APP_NAME}-prod
mkdir -p /root/docker-volumes/${APP_NAME}-staging

# Set permissions
chmod 755 /root/docker-volumes/${APP_NAME}-*
```

#### **3. Next.js Application Setup (60 minutes)**
```bash
# Clone and setup production
cd /root/docker-volumes/${APP_NAME}-prod
git clone <repository-url> .
git checkout main

# Create production environment
cat > .env.production.local << EOF
NODE_ENV=production
PORT=3000
DATABASE_URL=file:/app/data/production.db
NEXTAUTH_SECRET=$(openssl rand -base64 32)
NEXTAUTH_URL=https://${APP_NAME}.domain.com
EOF

# Build and deploy production
docker build -t ${APP_NAME}-prod:latest .
docker run -d \
  --name ${APP_NAME}-prod \
  --network root_wp-network \
  -p ${PROD_PORT}:3000 \
  --env-file .env.production.local \
  ${APP_NAME}-prod:latest

# Setup staging
cd /root/docker-volumes/${APP_NAME}-staging
git clone <repository-url> .
git checkout staging

cat > .env.local << EOF
NODE_ENV=development
PORT=3000
DATABASE_URL=file:/app/data/staging.db
NEXTAUTH_SECRET=$(openssl rand -base64 32)
NEXTAUTH_URL=https://staging-${APP_NAME}.domain.com
EOF

docker build -t ${APP_NAME}-staging:latest .
docker run -d \
  --name ${APP_NAME}-staging \
  --network root_wp-network \
  -p ${STAGING_PORT}:3000 \
  --env-file .env.local \
  ${APP_NAME}-staging:latest
```

#### **4. Nginx Configuration (30 minutes)**
```bash
# Create nginx config for the new app
cat > /root/nginx/conf.d/${APP_NAME}.conf << EOF
# ${APP_NAME} Production
server {
    listen 80;
    listen 443 ssl;
    server_name ${APP_NAME}.domain.com;

    ssl_certificate /etc/letsencrypt/live/${APP_NAME}.domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${APP_NAME}.domain.com/privkey.pem;

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
    server_name staging-${APP_NAME}.domain.com;

    ssl_certificate /etc/letsencrypt/live/staging-${APP_NAME}.domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/staging-${APP_NAME}.domain.com/privkey.pem;

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

#### **5. SSL Certificate Generation (15 minutes)**
```bash
# Stop nginx for standalone mode
docker stop nginx-proxy

# Generate certificates
certbot certonly --standalone -d ${APP_NAME}.domain.com -d staging-${APP_NAME}.domain.com

# Start nginx
docker start nginx-proxy

# Test SSL
curl -I https://${APP_NAME}.domain.com
curl -I https://staging-${APP_NAME}.domain.com
```

### **WordPress Application Setup**
```bash
APP_NAME="newwordpress"

# Create docker-compose setup
mkdir -p /root/docker-volumes/${APP_NAME}
cd /root/docker-volumes/${APP_NAME}

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

# Deploy
docker-compose up -d
```

---

## 🔒 Security Management

### **Daily Security Checks**
```bash
# Create daily security audit script
cat > /root/scripts/daily_security_check.sh << 'EOF'
#!/bin/bash
echo "=== Daily Security Check $(date) ==="

# 1. Check failed login attempts
echo "Recent SSH failures:"
grep "Failed password" /var/log/auth.log | tail -5

# 2. Check running processes
echo "Suspicious processes:"
ps aux | grep -E "(bitcoin|mining|crypto)" || echo "None found"

# 3. Check network connections
echo "Listening ports:"
netstat -tuln | grep LISTEN

# 4. Check file permissions
echo "Critical file permissions:"
ls -la /etc/ssh/sshd_config
ls -la /root/docker-volumes/*/.env* 2>/dev/null | head -5

# 5. SSL certificate status
echo "SSL certificates:"
certbot certificates | grep -E "(Certificate Name|Expiry Date)" | head -10

# 6. Disk usage
echo "Disk usage:"
df -h / | tail -1

echo "=============================="
EOF

chmod +x /root/scripts/daily_security_check.sh
```

### **Security Headers for Nginx**
```bash
# Add security headers to nginx
cat > /root/nginx/conf.d/security-headers.conf << 'EOF'
# Security headers for all sites
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
add_header X-Frame-Options DENY always;
add_header X-Content-Type-Options nosniff always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;

# SSL configuration
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384;
ssl_prefer_server_ciphers off;
EOF
```

### **Container Security Standards**
```bash
# Template for secure container deployment
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

---

## 📊 Monitoring & Maintenance

### **Health Monitoring Setup**
```bash
# Create comprehensive health check
cat > /root/scripts/health_check_all.sh << 'EOF'
#!/bin/bash
echo "=== Server Health Check $(date) ==="

# System resources
echo "## System Resources"
echo "CPU Load: $(uptime | awk -F'load average:' '{print $2}')"
echo "Memory: $(free -h | awk 'NR==2{printf "%.1f%% used", $3*100/$2}')"
echo "Disk: $(df -h / | awk 'NR==2{print $5 " used"}')"

# Container status
echo -e "\n## Container Status"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# HTTP status checks for all domains
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
echo -e "\n## Recent Nginx Errors"
tail -5 /var/log/nginx/error.log 2>/dev/null || echo "No recent errors"

echo "=================================="
EOF

chmod +x /root/scripts/health_check_all.sh

# Schedule health checks every 30 minutes
echo "*/30 * * * * /root/scripts/health_check_all.sh >> /var/log/health_check.log" | crontab -
```

### **Backup Strategy**
```bash
# Create unified backup script for all applications
cat > /root/scripts/backup_all_apps.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/root/backups/daily/$(date +%Y%m%d)"
mkdir -p $BACKUP_DIR

echo "Starting backup: $(date)" >> /var/log/backup.log

# Backup KITMED databases
for env in prod staging; do
    if docker ps | grep -q kitmed-${env}; then
        container_name="kitmed-${env}"
        [[ "$env" == "staging" ]] && container_name="kitmed-staging-container"
        
        docker exec $container_name cp /app/data/${env}*.db /tmp/ 2>/dev/null || true
        docker cp $container_name:/tmp/${env}*.db $BACKUP_DIR/ 2>/dev/null || true
        
        # Backup uploads
        docker exec $container_name tar -czf /tmp/${env}_uploads.tar.gz /app/uploads/ 2>/dev/null || true
        docker cp $container_name:/tmp/${env}_uploads.tar.gz $BACKUP_DIR/ 2>/dev/null || true
    fi
done

# Backup WordPress databases
mysql_containers=$(docker ps --format "table {{.Names}}" | grep mysql || true)
if [ ! -z "$mysql_containers" ]; then
    for db in $(docker exec mysql-server mysql -e "SHOW DATABASES;" | grep -v "Database\|information_schema\|performance_schema\|mysql\|sys"); do
        docker exec mysql-server mysqldump $db > $BACKUP_DIR/${db}_backup.sql
    done
fi

# Backup nginx configurations
cp -r /root/nginx/conf.d $BACKUP_DIR/nginx_configs

# Backup environment files
mkdir -p $BACKUP_DIR/env_files
cp /root/docker-volumes/*/.env* $BACKUP_DIR/env_files/ 2>/dev/null || true

# Cleanup old backups (keep 7 days)
find /root/backups/daily -type d -mtime +7 -exec rm -rf {} \; 2>/dev/null || true

echo "Backup completed: $(date)" >> /var/log/backup.log
EOF

chmod +x /root/scripts/backup_all_apps.sh

# Schedule daily backups at 3 AM
echo "0 3 * * * /root/scripts/backup_all_apps.sh" | crontab -l > mycron && echo "0 3 * * * /root/scripts/backup_all_apps.sh" >> mycron && crontab mycron && rm mycron
```

### **Performance Monitoring**
```bash
# Create resource monitoring
cat > /root/scripts/resource_monitor.sh << 'EOF'
#!/bin/bash

# Log resource usage
MEMORY_USAGE=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
DISK_USAGE=$(df / | awk 'NR==2{print $5}' | tr -d %)
CPU_LOAD=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | tr -d ',')

echo "$(date),$CPU_LOAD,$MEMORY_USAGE,$DISK_USAGE" >> /var/log/resource_usage.log

# Alert on high usage
if [ $MEMORY_USAGE -gt 80 ]; then
    echo "$(date): High memory usage: ${MEMORY_USAGE}%" >> /var/log/alerts.log
fi

if [ $DISK_USAGE -gt 80 ]; then
    echo "$(date): High disk usage: ${DISK_USAGE}%" >> /var/log/alerts.log
fi
EOF

chmod +x /root/scripts/resource_monitor.sh

# Monitor every 5 minutes
echo "*/5 * * * * /root/scripts/resource_monitor.sh" | crontab -l > mycron && echo "*/5 * * * * /root/scripts/resource_monitor.sh" >> mycron && crontab mycron && rm mycron
```

---

## 🆘 Emergency Procedures

### **Server Unresponsive**
```bash
# 1. Check connectivity
ping 72.61.107.43

# 2. Access via Hostinger console if SSH fails

# 3. Restart services in order
systemctl restart docker
systemctl restart nginx

# 4. Start critical containers
docker start nginx-proxy
docker start $(docker ps -a --format "{{.Names}}" | grep -E "(prod|production)")

# 5. Verify services
/root/scripts/health_check_all.sh
```

### **Critical Application Down**
```bash
APP_NAME="appname"  # Replace with actual app name

# 1. Quick diagnosis
docker ps -a | grep $APP_NAME
docker logs ${APP_NAME}-prod

# 2. Quick restart
docker restart ${APP_NAME}-prod

# 3. If restart fails, redeploy
cd /root/docker-volumes/${APP_NAME}-prod
git pull origin main
docker build -t ${APP_NAME}-prod:latest .
docker stop ${APP_NAME}-prod && docker rm ${APP_NAME}-prod
docker run -d --name ${APP_NAME}-prod --network root_wp-network -p PORT:3000 --env-file .env.production.local ${APP_NAME}-prod:latest

# 4. Enable maintenance if needed
echo "MAINTENANCE_MODE=true" >> /root/docker-volumes/${APP_NAME}-prod/.env.production.local
docker restart ${APP_NAME}-prod
```

### **SSL Certificate Emergency**
```bash
# Temporary self-signed certificate
openssl req -x509 -nodes -days 30 -newkey rsa:2048 \
    -keyout /etc/ssl/private/temp.key \
    -out /etc/ssl/certs/temp.crt \
    -subj "/CN=temporary.local"

# Update nginx to use temp cert temporarily
# Then fix Let's Encrypt issue and regenerate
```

### **Domain Isolation Issues**
```bash
# If domains show wrong content
# 1. Check default server block exists
cat /root/nginx/conf.d/000-default.conf

# 2. Restart nginx-proxy with correct config mount
docker stop nginx-proxy && docker rm nginx-proxy
docker run -d --name nginx-proxy --restart unless-stopped \
    --network root_wp-network -p 80:80 -p 443:443 \
    -v /root/nginx/conf.d:/etc/nginx/conf.d:ro \
    -v /etc/letsencrypt:/etc/letsencrypt:ro nginx:alpine

# 3. Test all domains
for domain in $(grep server_name /root/nginx/conf.d/*.conf | awk '{print $2}' | tr -d ';' | sort -u); do
    curl -H "Host: $domain" http://localhost -I
done
```

---

## 📋 Maintenance Checklists

### **Daily Tasks**
- [ ] Run health check: `/root/scripts/health_check_all.sh`
- [ ] Check container status: `docker ps`
- [ ] Review alerts: `tail /var/log/alerts.log`
- [ ] Check disk space: `df -h`

### **Weekly Tasks**
- [ ] Update system packages: `apt update && apt upgrade`
- [ ] Review security logs: `grep "Failed password" /var/log/auth.log`
- [ ] Check SSL expiry: `certbot certificates`
- [ ] Test backup restoration
- [ ] Review resource usage: `tail -100 /var/log/resource_usage.log`

### **Monthly Tasks**
- [ ] Full security audit
- [ ] Update application dependencies
- [ ] Review and clean old logs
- [ ] Performance optimization review
- [ ] Documentation updates

---

## 🔧 Quick Commands Reference

### **Container Management**
```bash
# List all containers
docker ps -a

# View logs
docker logs <container-name>

# Restart container
docker restart <container-name>

# Access container shell
docker exec -it <container-name> bash

# Check resource usage
docker stats
```

### **Nginx Management**
```bash
# Test configuration
docker exec nginx-proxy nginx -t

# Reload configuration
docker exec nginx-proxy nginx -s reload

# View access logs
docker exec nginx-proxy tail -f /var/log/nginx/access.log

# Check loaded configs
docker exec nginx-proxy nginx -T | grep server_name
```

### **System Monitoring**
```bash
# System resources
htop
df -h
free -h

# Network connections
netstat -tuln | grep LISTEN

# Service status
systemctl status docker
systemctl status nginx
```

### **SSL Certificate Management**
```bash
# List certificates
certbot certificates

# Renew certificates
certbot renew --dry-run

# Test SSL
echo | openssl s_client -connect domain.com:443 -servername domain.com 2>/dev/null | openssl x509 -noout -dates
```

---

## 📁 Important File Locations

### **Configuration Files**
```
/root/nginx/conf.d/           # Nginx site configs
/root/docker-volumes/         # Application data
/etc/ssh/sshd_config         # SSH configuration
/etc/letsencrypt/live/       # SSL certificates
```

### **Logs**
```
/var/log/nginx/              # Nginx logs
/var/log/auth.log           # Authentication logs
/var/log/health_check.log   # Health monitoring
/var/log/backup.log         # Backup logs
/var/log/resource_usage.log # Resource monitoring
/var/log/alerts.log         # System alerts
```

### **Scripts**
```
/root/scripts/health_check_all.sh      # Health monitoring
/root/scripts/backup_all_apps.sh       # Backup automation
/root/scripts/daily_security_check.sh  # Security audit
/root/scripts/resource_monitor.sh      # Performance monitoring
```

---

**🔒 Keep this guide updated as you add new applications and refine processes**  
**📅 Last updated: November 17, 2025**  
**🔄 Review monthly and after major infrastructure changes**