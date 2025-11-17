# 🚨 Nginx Domain Isolation - Emergency Troubleshooting Guide
*Quick Fix Guide for When Domains Show Wrong Content*

## 🔍 **Problem Detection**

### **Symptoms:**
- ❌ Website A shows content from Website B
- ❌ All websites show the same content  
- ❌ New domain shows wrong website
- ❌ Undefined domains show content instead of error

### **Quick Diagnosis Commands:**
```bash
# Test specific domain routing
curl -H 'Host: problematic-domain.com' http://localhost -I

# Test undefined domain protection  
curl -H 'Host: random-undefined-domain.com' http://localhost -I
# Should return empty response (444) or connection closed

# Check which domains are configured
docker exec nginx-proxy nginx -T | grep server_name | sort

# Check default server configuration
docker exec nginx-proxy nginx -T | grep -A 5 "default_server"
```

## 🛠️ **Immediate Fix Steps**

### **Step 1: Emergency Assessment (2 minutes)**
```bash
# Check nginx container status
docker ps | grep nginx-proxy

# Check nginx error logs
docker logs nginx-proxy --tail 20

# Test all critical domains
curl -H 'Host: kitmed.ma' http://localhost -I
curl -H 'Host: airarom.ma' http://localhost -I  
curl -H 'Host: electroromanos.ma' http://localhost -I
curl -H 'Host: yvesmorel.ma' http://localhost -I
```

### **Step 2: Quick Restart (1 minute)**
```bash
# Often fixes temporary issues
docker restart nginx-proxy

# Wait 10 seconds
sleep 10

# Test again
curl -H 'Host: problematic-domain.com' http://localhost -I
```

### **Step 3: Configuration Check (3 minutes)**
```bash
# Check for syntax errors
docker exec nginx-proxy nginx -t

# If errors found, check recent changes
ls -la /root/nginx/conf.d/ | head -10

# Check if default server exists
cat /root/nginx/conf.d/000-default.conf
```

## 🔧 **Root Cause Fixes**

### **Fix 1: Missing Default Server Block**

**Problem**: No default server to catch undefined domains

**Solution**: Create default server configuration
```bash
cat > /root/nginx/conf.d/000-default.conf << 'EOF'
# Default server block to catch undefined domains
# This prevents domain bleeding between sites
server {
    listen 80 default_server;
    listen 443 ssl default_server;
    server_name _;

    # Use any available SSL certificate for HTTPS
    ssl_certificate /etc/letsencrypt/live/kitmed.ma/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/kitmed.ma/privkey.pem;

    # Return 444 (close connection) for undefined domains
    return 444;
}
EOF

# Test and reload
docker exec nginx-proxy nginx -t && docker exec nginx-proxy nginx -s reload
```

### **Fix 2: Wrong Configuration Directory Mounted**

**Problem**: nginx-proxy mounting wrong config directory

**Check Current Mount**:
```bash
docker inspect nginx-proxy | grep -A 10 "Mounts"
```

**If mounted to `/etc/nginx/conf.d` instead of `/root/nginx/conf.d`:**
```bash
# Copy KITMED config to correct location
cp /etc/nginx/conf.d/kitmed.conf /root/nginx/conf.d/

# Recreate nginx-proxy with correct mount
docker stop nginx-proxy && docker rm nginx-proxy

docker run -d --name nginx-proxy \
  --restart unless-stopped \
  --network root_wp-network \
  -p 80:80 -p 443:443 \
  -v /root/nginx/conf.d:/etc/nginx/conf.d:ro \
  -v /etc/letsencrypt:/etc/letsencrypt:ro \
  nginx:alpine
```

### **Fix 3: Container Network Issues**

**Problem**: Containers not on same network

**Check Network Connectivity**:
```bash
# Check which network nginx-proxy is on
docker inspect nginx-proxy | grep NetworkMode

# Check if containers are on wp-network  
docker network inspect root_wp-network | grep -A 5 "Containers"
```

**Fix Network Connections**:
```bash
# Connect containers to wp-network
docker network connect root_wp-network kitmed-prod
docker network connect root_wp-network kitmed-staging-container
docker network connect root_wp-network nginx-proxy

# Verify connections
docker network inspect root_wp-network | grep -E "(kitmed|nginx)"
```

### **Fix 4: Container Reference Issues**

**Problem**: Using IP addresses instead of container names

**Check Current Configuration**:
```bash
grep -r "172.17.0.1\|localhost:" /root/nginx/conf.d/
```

**Fix IP References**:
```bash
# Update KITMED configurations to use container names
sed -i 's|http://172.17.0.1:3001|http://kitmed-prod:3000|g' /root/nginx/conf.d/kitmed.conf
sed -i 's|http://172.17.0.1:3002|http://kitmed-staging-container:3000|g' /root/nginx/conf.d/kitmed.conf

# Test and reload
docker exec nginx-proxy nginx -t && docker exec nginx-proxy nginx -s reload
```

## 🔍 **Advanced Diagnostics**

### **Check Configuration Load Order**
```bash
# See which configs are loaded and in what order
docker exec nginx-proxy nginx -T | grep "# configuration file" | sort

# Check for duplicate server_name entries
docker exec nginx-proxy nginx -T | grep server_name | sort | uniq -d
```

### **Test Individual Domain Routing**
```bash
# Test each domain specifically
for domain in kitmed.ma airarom.ma electroromanos.ma yvesmorel.ma; do
  echo "Testing $domain:"
  response=$(curl -s -H "Host: $domain" http://localhost | head -1)
  echo "Response: $response"
  echo "---"
done
```

### **Check for Configuration Conflicts**
```bash
# Look for server blocks with same server_name
docker exec nginx-proxy nginx -T | grep -B 2 -A 2 server_name | grep -E "(server_name|server \{)"

# Check for port conflicts
docker exec nginx-proxy nginx -T | grep -E "listen (80|443)" | sort | uniq -c
```

## 🚀 **Complete Recovery Procedure**

### **Nuclear Option: Full Reset**
```bash
# 1. Backup current configuration
tar -czf /root/backup/nginx-emergency-$(date +%Y%m%d_%H%M%S).tar.gz /root/nginx/conf.d/

# 2. Stop and remove nginx-proxy
docker stop nginx-proxy && docker rm nginx-proxy

# 3. Recreate with known good configuration
docker run -d --name nginx-proxy \
  --restart unless-stopped \
  --network root_wp-network \
  -p 80:80 -p 443:443 \
  -v /root/nginx/conf.d:/etc/nginx/conf.d:ro \
  -v /etc/letsencrypt:/etc/letsencrypt:ro \
  nginx:alpine

# 4. Wait for startup
sleep 10

# 5. Test all critical services
curl -H 'Host: kitmed.ma' https://localhost -I
curl -H 'Host: airarom.ma' https://localhost -I
curl -H 'Host: n8n.zonemation.cloud' https://localhost -I
```

### **Restore from Backup**
```bash
# If you have a known good backup
tar -xzf /root/backup/nginx-working-config.tar.gz -C /

# Restart nginx
docker restart nginx-proxy

# Test functionality
./test-all-domains.sh
```

## 📋 **Post-Fix Verification**

### **Domain Isolation Test Script**
```bash
#!/bin/bash
# File: /root/scripts/test-domain-isolation.sh

DOMAINS=("kitmed.ma" "airarom.ma" "electroromanos.ma" "yvesmorel.ma")
EXPECTED_CONTENT=("KITMED" "airarom" "electroromanos" "yvesmorel")

echo "=== Domain Isolation Test ==="
for i in "${!DOMAINS[@]}"; do
  domain="${DOMAINS[$i]}"
  expected="${EXPECTED_CONTENT[$i]}"
  
  echo "Testing $domain..."
  response=$(curl -s -H "Host: $domain" http://localhost)
  
  if [[ $response == *"$expected"* ]]; then
    echo "✅ $domain: CORRECT content"
  else
    echo "❌ $domain: WRONG content detected!"
    echo "Expected: $expected"
    echo "Got: $(echo $response | head -c 100)..."
  fi
done

# Test undefined domain protection
echo "Testing undefined domain protection..."
response=$(curl -s -H "Host: undefined-domain.com" http://localhost 2>&1)
if [[ $? -ne 0 ]] || [[ -z "$response" ]]; then
  echo "✅ Undefined domains: BLOCKED correctly"
else
  echo "❌ Undefined domains: NOT BLOCKED - SECURITY ISSUE!"
fi

echo "=== Test Complete ==="
```

### **Make Test Script Executable**
```bash
chmod +x /root/scripts/test-domain-isolation.sh
```

## 🛡️ **Prevention Checklist**

### **Before Making Any Changes:**
- [ ] Backup current nginx configuration
- [ ] Test new config syntax: `docker exec nginx-proxy nginx -t`
- [ ] Run domain isolation test
- [ ] Document what you're changing and why

### **After Making Changes:**
- [ ] Test nginx syntax again
- [ ] Reload nginx: `docker exec nginx-proxy nginx -s reload`
- [ ] Run domain isolation test script
- [ ] Test all critical domains manually
- [ ] Monitor logs for errors: `docker logs nginx-proxy --tail 20`

### **Required Configuration Files:**
- [ ] `/root/nginx/conf.d/000-default.conf` (default server)
- [ ] `/root/nginx/conf.d/kitmed.conf` (KITMED config)
- [ ] `/root/nginx/conf.d/default.conf` (WordPress sites)
- [ ] `/root/nginx/conf.d/zonemation-ssl.conf` (monitoring services)

## 📞 **Emergency Contacts & Resources**

### **Critical File Locations:**
```
Configuration: /root/nginx/conf.d/
Backups: /root/backup/
Test Scripts: /root/scripts/
SSL Certificates: /etc/letsencrypt/live/
```

### **Key Commands Summary:**
```bash
# Test config: docker exec nginx-proxy nginx -t
# Reload config: docker exec nginx-proxy nginx -s reload  
# Restart nginx: docker restart nginx-proxy
# Check logs: docker logs nginx-proxy --tail 20
# Test domain: curl -H 'Host: domain.com' http://localhost -I
```

### **Common Error Messages & Fixes:**

**Error**: `nginx: [emerg] host not found in upstream`
**Fix**: Container not on same network
```bash
docker network connect root_wp-network <container-name>
```

**Error**: `nginx: [emerg] bind() failed (98: Address already in use)`
**Fix**: Port conflict - another process using ports 80/443
```bash
netstat -tulpn | grep -E ":(80|443)"
```

**Error**: `nginx: [emerg] could not open error log file`
**Fix**: Permission or mount issue
```bash
docker exec nginx-proxy ls -la /var/log/nginx/
```

## 🔄 **Monitoring & Maintenance**

### **Daily Health Check Script:**
```bash
#!/bin/bash
# File: /root/scripts/daily-health-check.sh

echo "=== Daily Nginx Health Check $(date) ===" >> /var/log/nginx-health.log

# Test all domains
/root/scripts/test-domain-isolation.sh >> /var/log/nginx-health.log

# Check nginx error logs
echo "Recent nginx errors:" >> /var/log/nginx-health.log
docker logs nginx-proxy --tail 5 2>&1 | grep -i error >> /var/log/nginx-health.log || echo "No errors found" >> /var/log/nginx-health.log

echo "=========================" >> /var/log/nginx-health.log
```

### **Setup Automated Monitoring:**
```bash
# Add to crontab
echo "0 8 * * * /root/scripts/daily-health-check.sh" | crontab -

# Setup log rotation
echo "/var/log/nginx-health.log {
    daily
    rotate 30
    compress
    missingok
    notifempty
}" > /etc/logrotate.d/nginx-health
```

---

## 🎯 **Quick Reference Card**

### **Emergency Commands:**
| Problem | Command |
|---------|---------|
| Restart nginx | `docker restart nginx-proxy` |
| Test config | `docker exec nginx-proxy nginx -t` |
| Reload config | `docker exec nginx-proxy nginx -s reload` |
| Check logs | `docker logs nginx-proxy --tail 20` |
| Test domain | `curl -H 'Host: domain.com' localhost -I` |
| Test all domains | `/root/scripts/test-domain-isolation.sh` |

### **File Checklist:**
- ✅ `/root/nginx/conf.d/000-default.conf` - Default server block
- ✅ `/root/scripts/test-domain-isolation.sh` - Test script  
- ✅ Configuration backup before changes
- ✅ All containers on `root_wp-network`

**Remember**: Test first, change second, verify third! 🛡️

---

*📝 Document created: November 17, 2025*  
*🔄 Last updated: After domain isolation fix*  
*📧 Contact: Technical Team*  
*⚠️ Print this guide and keep it handy for emergencies!*