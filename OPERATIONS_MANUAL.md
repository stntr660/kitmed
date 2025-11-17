# 🛡️ KITMED Operations & Security Manual
*Version 1.0 - November 17, 2025*

## 🎯 Quick Reference

| **Service** | **Status** | **URL** | **Port** | **Action** |
|-------------|------------|---------|-----------|------------|
| Production | 🟡 Maintenance | https://kitmed-main.zonemation.cloud | 3001 | Ready for `kitmed.ma` |
| Staging | 🟢 Active | https://kitmed-staging.zonemation.cloud | 3002 | Fully operational |
| SSH Access | 🟢 Active | `ssh vps` | 22 | Key-based auth |

---

## 🚀 Daily Operations

### **Server Access**
```bash
# SSH into server
ssh vps
# or
ssh root@72.61.107.43
```

### **Service Status Check**
```bash
# Check all containers
docker ps

# Check specific service
docker logs kitmed-prod
docker logs kitmed-staging-container

# Check nginx status
systemctl status nginx

# Check SSL certificates
certbot certificates
```

### **Quick Health Check**
```bash
# Test production
curl -I https://kitmed-main.zonemation.cloud

# Test staging  
curl -I https://kitmed-staging.zonemation.cloud

# Check disk space
df -h

# Check memory usage
free -h
```

---

## 🔧 Maintenance Operations

### **Enable/Disable Maintenance Mode**

#### **Enable Maintenance**
```bash
# Edit environment file
echo "MAINTENANCE_MODE=true" >> /root/docker-volumes/kitmed-prod/.env.production.local

# Restart container
docker restart kitmed-prod

# Verify maintenance page is showing
curl -I https://kitmed-main.zonemation.cloud
# Should see: x-middleware-rewrite: /fr/maintenance
```

#### **Disable Maintenance**  
```bash
# Remove maintenance mode
sed -i '/MAINTENANCE_MODE=true/d' /root/docker-volumes/kitmed-prod/.env.production.local

# Restart container
docker restart kitmed-prod

# Verify site is live
curl -I https://kitmed-main.zonemation.cloud
```

### **Container Management**

#### **Restart Services**
```bash
# Restart production
docker restart kitmed-prod

# Restart staging
docker restart kitmed-staging-container

# Restart nginx
systemctl restart nginx
```

#### **Update and Redeploy**
```bash
# Update staging
cd /root/docker-volumes/kitmed-staging
git pull origin staging
docker build -t kitmed-staging:latest .
docker stop kitmed-staging-container && docker rm kitmed-staging-container
docker run -d --name kitmed-staging-container -p 3002:3000 --env-file .env.local kitmed-staging:latest

# Update production (after testing staging)
cd /root/docker-volumes/kitmed-prod  
git pull origin main
docker build -t kitmed-prod:latest .
docker stop kitmed-prod && docker rm kitmed-prod
docker run -d --name kitmed-prod -p 3001:3000 --env-file .env.production.local kitmed-prod:latest
```

---

## 🔒 Security Checklist

### **Weekly Security Audit**
```bash
# Check for unauthorized access attempts
grep "Failed password" /var/log/auth.log | tail -20

# Check active connections
ss -tuln | grep :22

# Verify SSL certificate status
certbot certificates

# Check for software updates
apt list --upgradable

# Verify firewall status
ufw status
```

### **Security Hardening Tasks**

#### **🔴 Critical - Implement ASAP**
1. **Change SSH Port**
   ```bash
   # Edit SSH config
   nano /etc/ssh/sshd_config
   # Change: Port 22 → Port 2222
   
   # Restart SSH
   systemctl restart ssh
   
   # Update firewall
   ufw allow 2222/tcp
   ufw deny 22/tcp
   ```

2. **Install Fail2Ban**
   ```bash
   apt update && apt install fail2ban
   systemctl enable fail2ban
   systemctl start fail2ban
   ```

3. **Configure Firewall**
   ```bash
   ufw --force enable
   ufw default deny incoming
   ufw default allow outgoing
   ufw allow 80/tcp      # HTTP
   ufw allow 443/tcp     # HTTPS  
   ufw allow 2222/tcp    # SSH (new port)
   ```

#### **🟡 Important - Implement Within 2 Weeks**
4. **SSL Security Headers**
   ```nginx
   # Add to nginx config
   add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
   add_header X-Frame-Options DENY always;
   add_header X-Content-Type-Options nosniff always;
   add_header X-XSS-Protection "1; mode=block" always;
   ```

5. **Database Security**
   ```bash
   # Restrict database file permissions
   docker exec kitmed-prod chown -R nextjs:nodejs /app/data
   docker exec kitmed-prod chmod 600 /app/data/*.db
   ```

---

## 💾 Backup Operations

### **Manual Backup Creation**
```bash
#!/bin/bash
# Create backup directory
BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/root/backups/manual_$BACKUP_DATE"
mkdir -p $BACKUP_DIR

# Backup databases
docker exec kitmed-prod cp /app/data/production.db /tmp/prod_backup.db
docker cp kitmed-prod:/tmp/prod_backup.db $BACKUP_DIR/
docker exec kitmed-staging-container cp /app/data/staging.db /tmp/staging_backup.db  
docker cp kitmed-staging-container:/tmp/staging_backup.db $BACKUP_DIR/

# Backup uploads
docker exec kitmed-prod tar -czf /tmp/prod_uploads.tar.gz /app/uploads
docker cp kitmed-prod:/tmp/prod_uploads.tar.gz $BACKUP_DIR/
docker exec kitmed-staging-container tar -czf /tmp/staging_uploads.tar.gz /app/uploads
docker cp kitmed-staging-container:/tmp/staging_uploads.tar.gz $BACKUP_DIR/

# Backup configurations
cp -r /etc/nginx/conf.d $BACKUP_DIR/
cp -r /root/docker-volumes/*/\.env* $BACKUP_DIR/ 2>/dev/null || true

echo "✅ Backup created: $BACKUP_DIR"
ls -la $BACKUP_DIR
```

### **Backup Restoration**
```bash
# Restore database
docker cp backup_file.db kitmed-prod:/app/data/production.db
docker restart kitmed-prod

# Restore uploads  
docker cp uploads_backup.tar.gz kitmed-prod:/tmp/
docker exec kitmed-prod tar -xzf /tmp/uploads_backup.tar.gz -C /
docker restart kitmed-prod
```

### **Automated Backup Setup**
```bash
# Create backup script
cat > /root/scripts/daily_backup.sh << 'EOF'
#!/bin/bash
# Daily automated backup
BACKUP_DIR="/root/backups/daily/$(date +%Y%m%d)"
mkdir -p $BACKUP_DIR

# Backup databases and uploads
docker exec kitmed-prod cp /app/data/production.db /tmp/
docker cp kitmed-prod:/tmp/production.db $BACKUP_DIR/
docker exec kitmed-prod tar -czf /tmp/uploads.tar.gz /app/uploads  
docker cp kitmed-prod:/tmp/uploads.tar.gz $BACKUP_DIR/

# Cleanup old backups (keep 7 days)
find /root/backups/daily -type d -mtime +7 -exec rm -rf {} \;

echo "$(date): Backup completed" >> /var/log/kitmed-backup.log
EOF

chmod +x /root/scripts/daily_backup.sh

# Add to crontab
echo "0 3 * * * /root/scripts/daily_backup.sh" | crontab -
```

---

## 📊 Monitoring & Alerts

### **Performance Monitoring**
```bash
# Check system resources
htop

# Check disk usage
df -h
du -sh /var/lib/docker/

# Monitor container resources
docker stats

# Check nginx access logs
tail -f /var/log/nginx/access.log

# Check application logs
docker logs -f kitmed-prod
```

### **Health Check Script**
```bash
cat > /root/scripts/health_check.sh << 'EOF'
#!/bin/bash
# Health monitoring script

# Check if containers are running
PROD_STATUS=$(docker inspect -f '{{.State.Running}}' kitmed-prod 2>/dev/null || echo "false")
STAGING_STATUS=$(docker inspect -f '{{.State.Running}}' kitmed-staging-container 2>/dev/null || echo "false")

# Check HTTP response
PROD_HTTP=$(curl -s -o /dev/null -w "%{http_code}" https://kitmed-main.zonemation.cloud)
STAGING_HTTP=$(curl -s -o /dev/null -w "%{http_code}" https://kitmed-staging.zonemation.cloud)

# Check disk space
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')

# Report status
echo "=== KITMED Health Check $(date) ==="
echo "Production Container: $PROD_STATUS"
echo "Staging Container: $STAGING_STATUS" 
echo "Production HTTP: $PROD_HTTP"
echo "Staging HTTP: $STAGING_HTTP"
echo "Disk Usage: $DISK_USAGE%"

# Alerts
if [ "$PROD_STATUS" != "true" ]; then
    echo "🚨 ALERT: Production container is down!"
fi

if [ "$STAGING_STATUS" != "true" ]; then
    echo "⚠️  WARNING: Staging container is down"
fi

if [ $DISK_USAGE -gt 80 ]; then
    echo "🚨 ALERT: Disk usage is $DISK_USAGE%"
fi

if [ "$PROD_HTTP" != "200" ] && [ "$PROD_HTTP" != "307" ]; then
    echo "🚨 ALERT: Production not responding (HTTP $PROD_HTTP)"
fi

echo "=================================="
EOF

chmod +x /root/scripts/health_check.sh

# Run every 5 minutes
echo "*/5 * * * * /root/scripts/health_check.sh >> /var/log/kitmed-health.log" | crontab -
```

---

## 🔄 Domain Migration Guide

### **When DNS Records are Updated**

#### **1. Update Nginx Configuration**
```bash
# Backup current config
cp /etc/nginx/conf.d/kitmed.conf /etc/nginx/conf.d/kitmed.conf.backup

# Update domains in config
sed -i 's/kitmed-main.zonemation.cloud/kitmed.ma/g' /etc/nginx/conf.d/kitmed.conf
sed -i 's/kitmed-staging.zonemation.cloud/staging.kitmed.ma/g' /etc/nginx/conf.d/kitmed.conf

# Test configuration
nginx -t

# Reload nginx
systemctl reload nginx
```

#### **2. Generate New SSL Certificates**
```bash
# Stop nginx temporarily
systemctl stop nginx

# Generate certificates for new domains
certbot certonly --standalone -d kitmed.ma -d www.kitmed.ma -d staging.kitmed.ma

# Update nginx SSL paths
nano /etc/nginx/conf.d/kitmed.conf
# Change certificate paths to new domain

# Restart nginx
systemctl start nginx
```

#### **3. Update Environment Variables**
```bash
# Update production environment
sed -i 's/kitmed-main.zonemation.cloud/kitmed.ma/g' /root/docker-volumes/kitmed-prod/.env.production.local

# Update staging environment  
sed -i 's/kitmed-staging.zonemation.cloud/staging.kitmed.ma/g' /root/docker-volumes/kitmed-staging/.env.local

# Restart containers
docker restart kitmed-prod
docker restart kitmed-staging-container
```

---

## 🆘 Emergency Procedures

### **Complete Service Outage**
```bash
# 1. Check server connectivity
ping 72.61.107.43

# 2. SSH into server
ssh vps

# 3. Check all services
systemctl status nginx
docker ps -a

# 4. Restart everything if needed
systemctl restart docker
systemctl restart nginx
docker start kitmed-prod kitmed-staging-container

# 5. Verify recovery
curl -I https://kitmed-main.zonemation.cloud
```

### **Database Corruption Recovery**
```bash
# 1. Stop application
docker stop kitmed-prod

# 2. Backup corrupted database
docker cp kitmed-prod:/app/data/production.db /root/backups/corrupted_$(date +%Y%m%d).db

# 3. Restore from latest backup
docker cp /root/backups/daily/20251117/production.db kitmed-prod:/app/data/

# 4. Restart application
docker start kitmed-prod

# 5. Verify functionality
curl -I https://kitmed-main.zonemation.cloud
```

### **SSL Certificate Emergency**
```bash
# If certificates expire unexpectedly
# 1. Generate temporary self-signed certificate
openssl req -x509 -nodes -days 30 -newkey rsa:2048 \
    -keyout /etc/ssl/private/temp.key \
    -out /etc/ssl/certs/temp.crt

# 2. Update nginx to use temporary cert
# 3. Fix Let's Encrypt issue
# 4. Generate new certificates
# 5. Update nginx back to proper certificates
```

---

## 📞 Contact Information

### **Emergency Contacts**
- **Primary Technical Lead**: [Your Name/Contact]
- **VPS Provider**: Hostinger Support 
- **Domain Registrar**: [Provider] Support

### **Service URLs**
- **Production**: https://kitmed-main.zonemation.cloud (→ https://kitmed.ma)
- **Staging**: https://kitmed-staging.zonemation.cloud (→ https://staging.kitmed.ma)
- **Server IP**: 72.61.107.43

### **Important Credentials**
- **SSH**: Key-based authentication (`claude_vps_key`)
- **SSL**: Let's Encrypt automatic renewal
- **Admin Login**: admin@kitmed.ma / admin123

---

## 📝 Change Log

| **Date** | **Change** | **By** |
|----------|------------|---------|
| 2025-11-17 | Initial deployment with maintenance mode | Claude AI |
| 2025-11-17 | Created operations manual | Claude AI |

---

*🔐 Keep this document secure and updated with any configuration changes*  
*📋 Review and update monthly or after major changes*