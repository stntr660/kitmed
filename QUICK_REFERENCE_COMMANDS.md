# ⚡ KITMED Quick Reference Commands
*Essential commands for daily operations*

## 🔑 Server Access
```bash
# SSH into server
ssh vps

# Alternative direct access
ssh root@72.61.107.43
```

## 🐳 Container Management

### **Status Check**
```bash
# See all running containers
docker ps

# Check specific container logs
docker logs kitmed-prod
docker logs kitmed-staging-container

# Check container resource usage
docker stats
```

### **Restart Services**
```bash
# Restart production
docker restart kitmed-prod

# Restart staging
docker restart kitmed-staging-container

# Force restart if needed
docker stop kitmed-prod && docker start kitmed-prod
```

### **Quick Redeploy**
```bash
# Update staging
cd /root/docker-volumes/kitmed-staging
git pull origin staging
docker build -t kitmed-staging:latest . && \
docker stop kitmed-staging-container && docker rm kitmed-staging-container && \
docker run -d --name kitmed-staging-container -p 3002:3000 --env-file .env.local kitmed-staging:latest

# Update production  
cd /root/docker-volumes/kitmed-prod
git pull origin main
docker build -t kitmed-prod:latest . && \
docker stop kitmed-prod && docker rm kitmed-prod && \
docker run -d --name kitmed-prod -p 3001:3000 --env-file .env.production.local kitmed-prod:latest
```

## 🛠️ Maintenance Mode

### **Enable Maintenance**
```bash
echo "MAINTENANCE_MODE=true" >> /root/docker-volumes/kitmed-prod/.env.production.local
docker restart kitmed-prod
```

### **Disable Maintenance**
```bash
sed -i '/MAINTENANCE_MODE=true/d' /root/docker-volumes/kitmed-prod/.env.production.local
docker restart kitmed-prod
```

### **Check Maintenance Status**
```bash
curl -I https://kitmed-main.zonemation.cloud | grep middleware
# Should show: x-middleware-rewrite: /fr/maintenance (if enabled)
```

## 🌐 Nginx Management

### **Status & Control**
```bash
# Check nginx status
systemctl status nginx

# Test configuration
nginx -t

# Reload configuration
systemctl reload nginx

# Restart nginx
systemctl restart nginx
```

### **Log Monitoring**
```bash
# Watch access logs
tail -f /var/log/nginx/access.log

# Watch error logs
tail -f /var/log/nginx/error.log

# Check recent errors
tail -20 /var/log/nginx/error.log
```

## 🔒 SSL Certificate Management

### **Check Certificates**
```bash
# List all certificates
certbot certificates

# Check expiry dates
certbot certificates | grep -E "(Certificate Name|Expiry Date)"

# Test SSL config
echo | openssl s_client -connect kitmed-main.zonemation.cloud:443 -servername kitmed-main.zonemation.cloud 2>/dev/null | openssl x509 -noout -dates
```

### **Renew Certificates**
```bash
# Dry run renewal
certbot renew --dry-run

# Force renewal
certbot renew --force-renewal

# Renew specific certificate
certbot renew --cert-name kitmed-staging.zonemation.cloud
```

## 📊 System Monitoring

### **Resource Check**
```bash
# System overview
htop

# Disk usage
df -h
du -sh /var/lib/docker/

# Memory usage
free -h

# Check running processes
ps aux | grep -E "(docker|nginx|ssh)"
```

### **Network Status**
```bash
# Check listening ports
netstat -tuln | grep LISTEN

# Check active connections
ss -tuln

# Test connectivity
curl -I https://kitmed-main.zonemation.cloud
curl -I https://kitmed-staging.zonemation.cloud
```

## 💾 Backup Operations

### **Quick Manual Backup**
```bash
# Create backup directory
BACKUP_DIR="/root/backups/manual_$(date +%Y%m%d_%H%M%S)"
mkdir -p $BACKUP_DIR

# Backup databases
docker exec kitmed-prod cp /app/data/production.db /tmp/prod.db
docker cp kitmed-prod:/tmp/prod.db $BACKUP_DIR/

# Backup staging
docker exec kitmed-staging-container cp /app/data/staging.db /tmp/staging.db
docker cp kitmed-staging-container:/tmp/staging.db $BACKUP_DIR/

echo "✅ Backup created in: $BACKUP_DIR"
```

### **List Backups**
```bash
# Show available backups
ls -la /root/backups/

# Show backup sizes
du -sh /root/backups/*/
```

## 🔍 Troubleshooting

### **Quick Health Check**
```bash
#!/bin/bash
echo "=== KITMED Quick Health Check ==="
echo "Date: $(date)"
echo

# Container status
echo "Containers:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo

# HTTP Status
echo "HTTP Responses:"
curl -s -o /dev/null -w "Production: %{http_code}\n" https://kitmed-main.zonemation.cloud
curl -s -o /dev/null -w "Staging: %{http_code}\n" https://kitmed-staging.zonemation.cloud
echo

# Disk space
echo "Disk Usage:"
df -h / | tail -1
echo

# Memory
echo "Memory:"
free -h | head -2
echo "=========================="
```

### **Common Issues**

#### **Container Won't Start**
```bash
# Check logs for errors
docker logs kitmed-prod

# Check if port is in use
netstat -tuln | grep :3001

# Remove and recreate container
docker stop kitmed-prod && docker rm kitmed-prod
docker run -d --name kitmed-prod -p 3001:3000 --env-file /root/docker-volumes/kitmed-prod/.env.production.local kitmed-prod:latest
```

#### **Site Not Accessible**
```bash
# Check nginx status
systemctl status nginx

# Check container status
docker ps | grep kitmed

# Check SSL certificates
certbot certificates

# Test local connectivity
curl -I localhost:3001
```

#### **High Resource Usage**
```bash
# Find resource-heavy processes
top -o %CPU
top -o %MEM

# Check Docker stats
docker stats

# Clean up Docker resources
docker system prune -f
```

## 🔧 Environment Management

### **View Environment Variables**
```bash
# Production environment
cat /root/docker-volumes/kitmed-prod/.env.production.local

# Staging environment
cat /root/docker-volumes/kitmed-staging/.env.local

# Check environment in running container
docker exec kitmed-prod printenv | grep -E "(NODE_ENV|MAINTENANCE|DATABASE)"
```

### **Update Environment Variables**
```bash
# Add new variable
echo "NEW_VAR=value" >> /root/docker-volumes/kitmed-prod/.env.production.local

# Remove variable
sed -i '/VARIABLE_NAME=/d' /root/docker-volumes/kitmed-prod/.env.production.local

# Restart to apply changes
docker restart kitmed-prod
```

## 🛡️ Security Commands

### **Security Status Check**
```bash
# Check failed login attempts
grep "Failed password" /var/log/auth.log | tail -10

# Check firewall status
ufw status

# Check SSL security
nmap --script ssl-enum-ciphers -p 443 kitmed-main.zonemation.cloud

# Check for rootkits
chkrootkit
```

### **Fail2Ban Management**
```bash
# Check fail2ban status
fail2ban-client status

# Check SSH jail status
fail2ban-client status sshd

# Unban an IP (if needed)
fail2ban-client set sshd unbanip IP_ADDRESS
```

## 📁 File Locations

### **Important Directories**
```bash
# Application code
/root/docker-volumes/kitmed-prod/
/root/docker-volumes/kitmed-staging/

# Nginx configuration
/etc/nginx/conf.d/kitmed.conf

# SSL certificates
/etc/letsencrypt/live/

# Backup location
/root/backups/

# Log files
/var/log/nginx/
/var/log/auth.log
```

### **Configuration Files**
```bash
# Environment files
/root/docker-volumes/kitmed-prod/.env.production.local
/root/docker-volumes/kitmed-staging/.env.local

# SSH configuration
/etc/ssh/sshd_config

# Nginx configuration
/etc/nginx/conf.d/kitmed.conf

# Firewall rules
/etc/ufw/user.rules
```

## 🚀 Deployment Shortcuts

### **Quick Production Deploy**
```bash
# One-liner production deployment
cd /root/docker-volumes/kitmed-prod && git pull origin main && docker build -t kitmed-prod:latest . && docker stop kitmed-prod && docker rm kitmed-prod && docker run -d --name kitmed-prod -p 3001:3000 --env-file .env.production.local kitmed-prod:latest && echo "✅ Production deployed!"
```

### **Quick Staging Deploy**
```bash
# One-liner staging deployment
cd /root/docker-volumes/kitmed-staging && git pull origin staging && docker build -t kitmed-staging:latest . && docker stop kitmed-staging-container && docker rm kitmed-staging-container && docker run -d --name kitmed-staging-container -p 3002:3000 --env-file .env.local kitmed-staging:latest && echo "✅ Staging deployed!"
```

### **Full System Restart**
```bash
# Restart everything (use with caution)
docker stop $(docker ps -q)
systemctl restart docker
systemctl restart nginx
cd /root/docker-volumes/kitmed-prod && docker run -d --name kitmed-prod -p 3001:3000 --env-file .env.production.local kitmed-prod:latest
cd /root/docker-volumes/kitmed-staging && docker run -d --name kitmed-staging-container -p 3002:3000 --env-file .env.local kitmed-staging:latest
```

## 📞 Emergency Procedures

### **Emergency Maintenance**
```bash
# Quick maintenance mode activation
echo "MAINTENANCE_MODE=true" >> /root/docker-volumes/kitmed-prod/.env.production.local && docker restart kitmed-prod && echo "🚨 Emergency maintenance mode activated"
```

### **Emergency Backup**
```bash
# Quick emergency backup
mkdir -p /root/emergency_backup_$(date +%H%M) && \
docker exec kitmed-prod cp /app/data/production.db /tmp/ && \
docker cp kitmed-prod:/tmp/production.db /root/emergency_backup_$(date +%H%M)/ && \
echo "🆘 Emergency backup created in /root/emergency_backup_$(date +%H%M)/"
```

### **Service Recovery**
```bash
# Try to recover all services
systemctl restart docker && \
systemctl restart nginx && \
sleep 5 && \
docker start kitmed-prod kitmed-staging-container && \
echo "🔄 Service recovery attempted"
```

---

## 📋 Daily Checklist

```bash
# Copy and paste this for daily checks:
echo "=== Daily KITMED Check $(date +%Y-%m-%d) ==="
echo "1. Container Status:" && docker ps --format "table {{.Names}}\t{{.Status}}"
echo "2. HTTP Status:" && curl -s -o /dev/null -w "Prod: %{http_code} " https://kitmed-main.zonemation.cloud && curl -s -o /dev/null -w "Staging: %{http_code}\n" https://kitmed-staging.zonemation.cloud
echo "3. Disk Space:" && df -h / | tail -1
echo "4. Memory:" && free -h | grep Mem
echo "5. SSL Status:" && certbot certificates | grep -A1 "Certificate Name"
echo "6. Recent Errors:" && tail -5 /var/log/nginx/error.log 2>/dev/null || echo "No recent errors"
echo "✅ Daily check complete"
```

---

*💡 Bookmark this page and keep it handy for quick reference*  
*🔄 Update commands as configurations change*