# 🔒 KITMED Security Audit Checklist
*Security Assessment & Hardening Guide*

## 🚨 Current Security Status

| **Security Area** | **Status** | **Risk Level** | **Action Required** |
|------------------|------------|----------------|-------------------|
| SSH Security | 🟡 Basic | Medium | Change port, disable password auth |
| Firewall | 🔴 Not Configured | High | Configure UFW rules |
| SSL/TLS | 🟢 Active | Low | Add security headers |
| Container Security | 🟡 Basic | Medium | Harden Docker config |
| Backup Security | 🔴 No Encryption | High | Implement encrypted backups |
| Monitoring | 🔴 None | High | Deploy security monitoring |
| Access Control | 🟡 Basic | Medium | Implement proper audit logs |

---

## 🔥 Critical Security Issues (Fix Immediately)

### **1. SSH Hardening** ⏱️ ETA: 30 minutes
```bash
# Current Risk: SSH accessible on default port 22 with root access

# 🔧 Fix Steps:
# Step 1: Change SSH port
nano /etc/ssh/sshd_config
# Change: Port 22 → Port 2222
# Add: PasswordAuthentication no
# Add: PermitRootLogin prohibit-password

# Step 2: Restart SSH (CAUTION: Do this while connected)
systemctl restart sshd

# Step 3: Test new port before disconnecting
ssh -p 2222 root@72.61.107.43

# Step 4: Update SSH config locally
echo "Host vps
    HostName 72.61.107.43
    User root  
    Port 2222
    IdentityFile ~/.ssh/claude_vps_key
    StrictHostKeyChecking no" > ~/.ssh/config
```

### **2. Firewall Configuration** ⏱️ ETA: 15 minutes
```bash
# Current Risk: No firewall rules configured

# 🔧 Fix Steps:
ufw --force enable
ufw default deny incoming
ufw default allow outgoing

# Allow only necessary ports
ufw allow 80/tcp       # HTTP
ufw allow 443/tcp      # HTTPS
ufw allow 2222/tcp     # SSH (new port)

# Block old SSH port
ufw deny 22/tcp

# Verify rules
ufw status numbered
```

### **3. Container Security** ⏱️ ETA: 45 minutes
```bash
# Current Risk: Containers running with basic security

# 🔧 Fix Steps:

# 1. Create restricted network
docker network create --driver bridge kitmed-secure

# 2. Update container deployment with security options
docker stop kitmed-prod
docker rm kitmed-prod

docker run -d \
  --name kitmed-prod \
  --network kitmed-secure \
  --memory="512m" \
  --cpu-shares=512 \
  --read-only=true \
  --tmpfs /tmp:rw,noexec,nosuid \
  --tmpfs /var/tmp:rw,noexec,nosuid \
  -v /root/docker-volumes/kitmed-prod-data:/app/data \
  -v /root/docker-volumes/kitmed-prod-uploads:/app/uploads \
  -p 3001:3000 \
  --env-file /root/docker-volumes/kitmed-prod/.env.production.local \
  kitmed-prod:latest

# 3. Similar for staging container
```

---

## 🛡️ Security Hardening Tasks

### **Week 1: Critical Security**

#### **Day 1: Access Control**
- [ ] **SSH Port Change** (2222) ✅ Critical
- [ ] **Disable Password Authentication** ✅ Critical
- [ ] **Configure UFW Firewall** ✅ Critical
- [ ] **Install Fail2Ban** ✅ Critical

```bash
# Install and configure Fail2Ban
apt update && apt install fail2ban

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

systemctl enable fail2ban
systemctl start fail2ban
```

#### **Day 2-3: SSL/TLS Security**
- [ ] **Enable HSTS Headers** ✅ Important
- [ ] **Configure Strong Ciphersuites** ✅ Important  
- [ ] **Enable OCSP Stapling** ✅ Recommended

```bash
# Add to nginx SSL configuration
cat >> /etc/nginx/conf.d/ssl-security.conf << 'EOF'
# SSL Security Configuration
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384;
ssl_prefer_server_ciphers off;
ssl_dhparam /etc/nginx/dhparam.pem;

# Security Headers
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
add_header X-Frame-Options DENY always;
add_header X-Content-Type-Options nosniff always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;

# OCSP Stapling
ssl_stapling on;
ssl_stapling_verify on;
resolver 8.8.8.8 8.8.4.4 valid=300s;
EOF

# Generate strong DH parameters
openssl dhparam -out /etc/nginx/dhparam.pem 2048
nginx -t && systemctl reload nginx
```

### **Week 2: Monitoring & Backup Security**

#### **Day 4-5: Backup Security**
- [ ] **Implement Encrypted Backups** ✅ Critical
- [ ] **Secure Backup Storage** ✅ Important
- [ ] **Test Backup Restoration** ✅ Critical

```bash
# Create encrypted backup script
cat > /root/scripts/secure_backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/root/backups/encrypted/$(date +%Y%m%d)"
ENCRYPTION_KEY="/root/.backup_key"
mkdir -p $BACKUP_DIR

# Generate encryption key if not exists
if [ ! -f "$ENCRYPTION_KEY" ]; then
    openssl rand -base64 32 > $ENCRYPTION_KEY
    chmod 600 $ENCRYPTION_KEY
fi

# Create encrypted database backup
docker exec kitmed-prod cp /app/data/production.db /tmp/
docker cp kitmed-prod:/tmp/production.db /tmp/prod_backup.db
gpg --cipher-algo AES256 --compress-algo 1 \
    --symmetric --passphrase-file $ENCRYPTION_KEY \
    --output $BACKUP_DIR/production.db.gpg \
    /tmp/prod_backup.db

# Clean unencrypted files
rm /tmp/prod_backup.db

# Upload to secure remote storage (implement later)
echo "Backup completed: $BACKUP_DIR"
EOF

chmod +x /root/scripts/secure_backup.sh
```

#### **Day 6-7: Security Monitoring**
- [ ] **Install Security Monitoring** ✅ Important
- [ ] **Configure Log Analysis** ✅ Important
- [ ] **Set Up Intrusion Detection** ✅ Recommended

```bash
# Install basic security monitoring
apt install logwatch chkrootkit

# Configure logwatch
echo "Detail = High
Service = All  
Range = Today
Output = mail
Format = text
MailTo = admin@kitmed.ma" > /etc/logwatch/conf/logwatch.conf

# Daily security scan
echo "0 2 * * * /usr/sbin/chkrootkit | mail -s 'Security Scan Report' admin@kitmed.ma" | crontab -
```

### **Week 3-4: Advanced Security**

#### **Application Security**
- [ ] **Implement Rate Limiting** ✅ Important
- [ ] **Add Security Headers to App** ✅ Important
- [ ] **Configure CORS Properly** ✅ Important

```bash
# Add rate limiting to nginx
cat >> /etc/nginx/conf.d/rate-limit.conf << 'EOF'
# Rate limiting
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/m;
limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;

# Apply limits in server blocks
location /api/ {
    limit_req zone=api burst=20 nodelay;
}

location /admin/login {
    limit_req zone=login burst=3 nodelay;
}
EOF
```

---

## 🔍 Security Audit Procedures

### **Daily Security Checks**
```bash
#!/bin/bash
# Daily security audit script

echo "=== KITMED Daily Security Audit $(date) ==="

# 1. Check for failed login attempts
echo "Failed SSH attempts:"
grep "Failed password" /var/log/auth.log | tail -5

# 2. Check running processes
echo -e "\nUnexpected processes:"
ps aux | grep -E "(bitcoin|mining|crypto)" || echo "None found"

# 3. Check network connections
echo -e "\nActive network connections:"
netstat -tuln | grep LISTEN

# 4. Check file permissions on critical files
echo -e "\nCritical file permissions:"
ls -la /etc/ssh/sshd_config
ls -la /root/docker-volumes/*/.env*

# 5. Check SSL certificate expiry
echo -e "\nSSL certificate status:"
echo | openssl s_client -connect kitmed-main.zonemation.cloud:443 2>/dev/null | \
  openssl x509 -noout -dates

# 6. Check for rootkit
echo -e "\nRootkit check:"
chkrootkit | grep INFECTED || echo "No infections found"

# 7. Check disk usage
echo -e "\nDisk usage:"
df -h / | tail -1

echo "=================================="
```

### **Weekly Security Review**
```bash
#!/bin/bash
# Weekly comprehensive security review

# 1. Update system packages
apt update && apt list --upgradable

# 2. Review fail2ban logs
fail2ban-client status sshd

# 3. Check for unusual file modifications
find /etc -name "*.conf" -mtime -7 -ls

# 4. Review nginx access logs for suspicious patterns
awk '{print $1}' /var/log/nginx/access.log | sort | uniq -c | sort -nr | head -10

# 5. Check Docker security
docker run --rm --pid host --userns host --cap-add audit_control \
    -e DOCKER_CONTENT_TRUST=$DOCKER_CONTENT_TRUST \
    -v /var/lib:/var/lib \
    -v /var/run/docker.sock:/var/run/docker.sock \
    -v /usr/lib/systemd:/usr/lib/systemd \
    -v /etc:/etc --label docker_bench_security \
    docker/docker-bench-security || echo "Docker bench not available"
```

### **Monthly Security Assessment**

#### **Vulnerability Scanning**
```bash
# Install and run vulnerability scanner
apt install lynis

# Run comprehensive scan
lynis audit system

# Review report
cat /var/log/lynis.log
```

#### **Security Configuration Review**
- [ ] Review user accounts and permissions
- [ ] Audit SSH keys and access logs
- [ ] Check SSL/TLS configuration with SSL Labs
- [ ] Review firewall rules and logs
- [ ] Verify backup encryption and test restoration
- [ ] Update security documentation
- [ ] Review incident response procedures

---

## 🚨 Incident Response Plan

### **Security Incident Classification**

#### **🔴 Critical (Act Immediately)**
- Unauthorized root access
- Data breach indicators
- Service completely compromised
- Malware/ransomware detected

#### **🟡 High (Act Within 1 Hour)**
- Multiple failed login attempts
- Suspicious network activity  
- Application vulnerabilities exploited
- SSL certificate compromised

#### **🟢 Medium (Act Within 24 Hours)**
- Single failed login attempts
- Minor configuration issues
- Non-critical log anomalies

### **Response Procedures**

#### **Immediate Response (First 15 Minutes)**
```bash
# 1. Isolate affected systems
# If production is compromised, enable maintenance mode immediately
echo "MAINTENANCE_MODE=true" >> /root/docker-volumes/kitmed-prod/.env.production.local
docker restart kitmed-prod

# 2. Preserve evidence
INCIDENT_DIR="/root/security/incident_$(date +%Y%m%d_%H%M%S)"
mkdir -p $INCIDENT_DIR

# Copy logs
cp /var/log/auth.log $INCIDENT_DIR/
cp /var/log/nginx/*.log $INCIDENT_DIR/
docker logs kitmed-prod > $INCIDENT_DIR/prod_logs.txt
docker logs kitmed-staging-container > $INCIDENT_DIR/staging_logs.txt

# 3. Check for persistence
ps aux > $INCIDENT_DIR/processes.txt
netstat -tuln > $INCIDENT_DIR/network.txt
ls -la /tmp /var/tmp > $INCIDENT_DIR/temp_files.txt
```

#### **Investigation Phase (Next 45 Minutes)**
```bash
# 1. Analyze logs for attack vectors
grep -i "attack\|hack\|exploit\|malware" /var/log/* > $INCIDENT_DIR/security_events.txt

# 2. Check file integrity
find /etc -name "*.conf" -newer /root/security/last_check > $INCIDENT_DIR/modified_configs.txt

# 3. Network analysis  
netstat -an | grep :22 > $INCIDENT_DIR/ssh_connections.txt
ss -tuln > $INCIDENT_DIR/listening_ports.txt
```

#### **Recovery Phase**
```bash
# 1. Remove threats
# Kill suspicious processes
# Remove malicious files
# Reset compromised passwords

# 2. Patch vulnerabilities
# Update system packages
# Apply security patches
# Reconfigure compromised services

# 3. Restore services
# Bring systems back online
# Verify functionality
# Monitor for recurrence

# 4. Update security measures
# Change SSH keys
# Update firewall rules
# Strengthen monitoring
```

---

## 📊 Security Metrics & KPIs

### **Security Monitoring Dashboard**

#### **Daily Metrics**
- Failed login attempts: < 10/day
- Suspicious IP addresses: Track and block
- SSL certificate expiry: > 30 days remaining
- System uptime: > 99.9%
- Security scan results: No critical issues

#### **Weekly Metrics**
- Security patches applied: Within 7 days of release
- Backup verification: 100% successful
- Firewall rule review: Completed
- Log analysis: Reviewed for anomalies

#### **Monthly Metrics**
- Penetration testing: Completed
- Security training: Up to date
- Incident response testing: Practiced
- Documentation review: Current

### **Security Alerts Configuration**

#### **Critical Alerts** (Immediate notification)
- Multiple failed SSH attempts (>5 in 10 minutes)
- New user account creation
- Root login detected
- SSL certificate expiring in <7 days
- Disk space >90% full
- Service downtime >5 minutes

#### **Warning Alerts** (1-hour notification)
- Single failed SSH attempt
- High CPU/memory usage >80%
- Unusual network traffic
- Log file size anomalies

---

## 🎯 Security Improvement Roadmap

### **Next 30 Days**
1. **Complete Critical Security Setup**
   - SSH hardening
   - Firewall configuration
   - Fail2Ban installation
   - Encrypted backups

2. **Implement Monitoring**
   - Security log analysis
   - Intrusion detection
   - Performance monitoring
   - Automated alerts

3. **Documentation & Training**
   - Security procedures documentation
   - Incident response testing
   - Recovery procedure validation

### **Next 90 Days**
1. **Advanced Security Features**
   - Web Application Firewall (WAF)
   - DDoS protection
   - Security scanner integration
   - Vulnerability management

2. **Compliance & Auditing**
   - Security compliance framework
   - Regular penetration testing
   - Third-party security audit
   - Data protection compliance

3. **Business Continuity**
   - Disaster recovery plan
   - High availability setup
   - Backup site configuration
   - Emergency response procedures

---

*🔒 This security checklist should be reviewed and updated monthly*  
*📅 Last updated: November 17, 2025*  
*🔄 Next review: December 17, 2025*