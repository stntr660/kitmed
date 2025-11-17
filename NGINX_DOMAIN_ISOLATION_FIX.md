# 🔧 Nginx Domain Isolation Fix - Issue Resolution
*Date: November 17, 2025*

## 🚨 **Problem Identified**

**Issue**: When adding new domains/sites to the server, other websites would sometimes display KITMED content instead of their own content.

**Root Cause**: Nginx configuration directory mismatch and lack of proper server block isolation.

## 🔍 **Investigation Findings**

### **Configuration Architecture Discovery**
1. **Two Nginx Config Directories**:
   - `/etc/nginx/conf.d/` - Where nginx-proxy was mounted (KITMED only)
   - `/root/nginx/conf.d/` - Where all other site configs were stored (WordPress sites)

2. **Container Network Issues**:
   - nginx-proxy was not connected to the same Docker network as WordPress containers
   - KITMED containers were not connected to the main wp-network

3. **Missing Default Server Block**:
   - No default server to catch undefined domains
   - First alphabetical server block was being used as fallback

## ✅ **Solution Implemented**

### **1. Fixed Nginx Configuration Mount**
```bash
# Stopped misconfigured nginx-proxy
docker stop nginx-proxy && docker rm nginx-proxy

# Started with correct mount point
docker run -d --name nginx-proxy \
  --restart unless-stopped \
  --network root_wp-network \
  -p 80:80 -p 443:443 \
  -v /root/nginx/conf.d:/etc/nginx/conf.d:ro \
  -v /etc/letsencrypt:/etc/letsencrypt:ro \
  nginx:alpine
```

### **2. Connected All Containers to Same Network**
```bash
# Connected KITMED containers to wp-network
docker network connect root_wp-network kitmed-prod
docker network connect root_wp-network kitmed-staging-container
```

### **3. Updated Container References**
```bash
# Changed from localhost IPs to container names
sed -i 's|http://172.17.0.1:3001|http://kitmed-prod:3000|g' /root/nginx/conf.d/kitmed.conf
sed -i 's|http://172.17.0.1:3002|http://kitmed-staging-container:3000|g' /root/nginx/conf.d/kitmed.conf
```

### **4. Added Default Server Block** 
```nginx
# Created /root/nginx/conf.d/000-default.conf
server {
    listen 80 default_server;
    listen 443 ssl default_server;
    server_name _;

    ssl_certificate /etc/letsencrypt/live/kitmed.ma/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/kitmed.ma/privkey.pem;

    # Return 444 (close connection) for any undefined domains
    return 444;
}
```

## 🧪 **Testing Results**

### **Domain Isolation Verified**
| Domain | Test Result | Status |
|--------|-------------|--------|
| kitmed.ma | ✅ Shows KITMED maintenance page | CORRECT |
| airarom.ma | ✅ Routes to airarom WordPress | CORRECT |
| electroromanos.ma | ✅ Routes to electroromanos WordPress | CORRECT |
| yvesmorel.ma | ✅ Routes to yvesmorel WordPress | CORRECT |
| undefined-domain.com | ✅ Returns 444 (blocked) | CORRECT |

### **Network Connectivity Verified**
```bash
# All containers can communicate
✅ nginx-proxy → kitmed-prod (3000)
✅ nginx-proxy → kitmed-staging-container (3000) 
✅ nginx-proxy → airarom-wp (80)
✅ nginx-proxy → electroromanos-wp (80)
✅ nginx-proxy → yvesmorel-wp (80)
```

## 🛡️ **Prevention Measures**

### **1. Configuration File Organization**
```
/root/nginx/conf.d/
├── 000-default.conf          # Default server (catches undefined domains)
├── default.conf               # WordPress sites configuration  
├── kitmed.conf                # KITMED production/staging
└── zonemation-ssl.conf        # n8n, Grafana, other services
```

### **2. Container Network Standards**
- **All web containers MUST be on**: `root_wp-network`
- **nginx-proxy MUST be connected to**: `root_wp-network`
- **Use container names in nginx configs**: Not IP addresses

### **3. Default Server Block Protection**
- **Always include default_server block** to catch undefined domains
- **Use 444 response code** to close connection for undefined domains
- **File naming**: Use `000-default.conf` to ensure it loads first

## 📋 **Standard Operating Procedures**

### **Adding New Website/Domain**
1. **Create configuration in**: `/root/nginx/conf.d/newsite.conf`
2. **Ensure container is on network**: `docker network connect root_wp-network <container>`
3. **Use container name in proxy_pass**: `http://container-name:port`
4. **Test configuration**: `docker exec nginx-proxy nginx -t`
5. **Reload nginx**: `docker exec nginx-proxy nginx -s reload`

### **Adding New Container Service**
1. **Start container on network**: `docker run --network root_wp-network ...`
2. **OR connect existing**: `docker network connect root_wp-network <container>`
3. **Add to nginx config**: Use container name, not IP
4. **Test and reload nginx**

### **Troubleshooting Domain Issues**
```bash
# Check which config files are loaded
docker exec nginx-proxy nginx -T | grep server_name

# Test specific domain routing
curl -H 'Host: domain.com' http://localhost -I

# Check container network connectivity
docker network inspect root_wp-network

# Verify container can reach nginx
docker exec <container> curl nginx-proxy -I
```

## 🔧 **Configuration Backup**

### **Current Working Configuration**
All configuration files are stored in:
- **Main configs**: `/root/nginx/conf.d/`
- **Backup location**: `/root/nginx/conf.d/*.backup`

### **Quick Restore Commands**
```bash
# If issues arise, restart nginx with working config
docker restart nginx-proxy

# If total failure, recreate from scratch
docker stop nginx-proxy && docker rm nginx-proxy
docker run -d --name nginx-proxy --restart unless-stopped \
  --network root_wp-network -p 80:80 -p 443:443 \
  -v /root/nginx/conf.d:/etc/nginx/conf.d:ro \
  -v /etc/letsencrypt:/etc/letsencrypt:ro nginx:alpine
```

## 📊 **System Status After Fix**

### **Current Architecture**
```
Internet → nginx-proxy (ports 80/443)
    ├── kitmed.ma → kitmed-prod:3000
    ├── kitmed-staging.zonemation.cloud → kitmed-staging-container:3000  
    ├── airarom.ma → airarom-wp:80
    ├── electroromanos.ma → electroromanos-wp:80
    ├── yvesmorel.ma → yvesmorel-wp:80
    ├── n8n.zonemation.cloud → n8n-automation:5678
    ├── grafana.zonemation.cloud → grafana-monitoring:3000
    └── undefined domains → 444 (blocked)
```

### **Network Topology**
```
root_wp-network:
├── nginx-proxy (reverse proxy)
├── kitmed-prod (Next.js app)
├── kitmed-staging-container (Next.js app) 
├── airarom-wp (WordPress)
├── electroromanos-wp (WordPress)
├── yvesmorel-wp (WordPress)
├── mysql-server (database)
├── redis-cache (caching)
├── n8n-automation (automation)
└── grafana-monitoring (monitoring)
```

## ✅ **Issue Resolution Confirmed**

- ✅ **Domain isolation**: Each domain shows correct content
- ✅ **No cross-contamination**: KITMED no longer appears on other sites  
- ✅ **Proper routing**: All websites function correctly
- ✅ **Security**: Undefined domains are blocked
- ✅ **Future-proof**: New sites can be added safely

## 🚀 **Maintenance Commands**

```bash
# Check nginx status
docker logs nginx-proxy --tail 20

# Reload configuration after changes  
docker exec nginx-proxy nginx -s reload

# Test configuration syntax
docker exec nginx-proxy nginx -t

# View loaded configurations
docker exec nginx-proxy nginx -T | grep -E "(server_name|proxy_pass)"

# Monitor access logs (if needed)
docker exec nginx-proxy tail -f /var/log/nginx/access.log
```

---

**✅ Problem Resolved**: All websites now properly isolated and functioning correctly.  
**🛡️ Prevention Implemented**: Default server block prevents future domain bleeding.  
**📚 Documentation Complete**: SOPs established for future site additions.

*Fix implemented by: Claude AI Assistant*  
*Tested and verified: November 17, 2025*