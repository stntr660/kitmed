# Domain Configuration Guide

## Overview

To connect your domain to your VPS (72.61.107.43), you need to configure DNS records at your domain registrar.

## DNS Configuration Required

### A Records to Create:
```
yourdomain.com          → 72.61.107.43
staging.yourdomain.com  → 72.61.107.43
www.yourdomain.com      → 72.61.107.43 (optional)
```

## Step-by-Step for Common Registrars

### 1. **Namecheap**
1. Log in to Namecheap account
2. Go to "Domain List" → Click "Manage" next to your domain
3. Click "Advanced DNS" tab
4. Add these records:

```
Type    Host        Value           TTL
A       @          72.61.107.43    Automatic
A       staging    72.61.107.43    Automatic  
A       www        72.61.107.43    Automatic
```

### 2. **GoDaddy**
1. Log in to GoDaddy account
2. Go to "My Products" → "DNS"
3. Click domain name → "Manage DNS"
4. Add these records:

```
Type    Name        Value           TTL
A       @          72.61.107.43    600
A       staging    72.61.107.43    600
A       www        72.61.107.43    600
```

### 3. **Cloudflare**
1. Log in to Cloudflare
2. Select your domain
3. Go to "DNS" → "Records"
4. Add these records:

```
Type    Name            Content         Proxy Status
A       yourdomain.com  72.61.107.43    DNS only (gray)
A       staging         72.61.107.43    DNS only (gray)
A       www             72.61.107.43    DNS only (gray)
```

**Important**: Set proxy status to "DNS only" (gray cloud) initially.

### 4. **Google Domains**
1. Log in to Google Domains
2. Click your domain → "DNS" 
3. Scroll to "Custom resource records"
4. Add these records:

```
Name        Type    TTL     Data
@           A       3600    72.61.107.43
staging     A       3600    72.61.107.43
www         A       3600    72.61.107.43
```

### 5. **Route 53 (AWS)**
1. Log in to AWS Console → Route 53
2. Go to "Hosted zones" → Click your domain
3. Create these records:

```
Name                    Type    Value           TTL
yourdomain.com          A       72.61.107.43    300
staging.yourdomain.com  A       72.61.107.43    300
www.yourdomain.com      A       72.61.107.43    300
```

## DNS Record Explanation

### Root Domain (@)
- **Points**: yourdomain.com → 72.61.107.43
- **Purpose**: Main production website

### Staging Subdomain
- **Points**: staging.yourdomain.com → 72.61.107.43
- **Purpose**: Testing environment

### WWW Subdomain (Optional)
- **Points**: www.yourdomain.com → 72.61.107.43
- **Purpose**: Redirect www traffic to main site

## Verification Steps

### 1. Check DNS Propagation
Use online tools to verify DNS changes:
- **dig**: `dig yourdomain.com`
- **nslookup**: `nslookup yourdomain.com`
- **Online tools**: whatsmydns.net, dnschecker.org

### 2. Command Line Check
```bash
# Check main domain
dig yourdomain.com +short

# Check staging subdomain  
dig staging.yourdomain.com +short

# Should both return: 72.61.107.43
```

### 3. Browser Test
After DNS propagates (5-60 minutes):
- Visit: http://yourdomain.com
- Visit: http://staging.yourdomain.com
- Should see your KITMED app

## Troubleshooting

### DNS Not Propagating
**Problem**: Domain still shows old IP or "site not found"
**Solutions**:
- Wait longer (can take up to 48 hours)
- Check TTL settings (lower = faster updates)
- Flush DNS cache: `ipconfig /flushdns` (Windows) or `sudo dscacheutil -flushcache` (Mac)

### Mixed Content Warnings
**Problem**: Site loads but some resources fail
**Solution**: Will be resolved when SSL is configured

### Site Not Loading
**Problem**: DNS resolves but site doesn't load
**Check**:
```bash
# Test if VPS is responding
curl -I http://72.61.107.43

# Check nginx is running on VPS
ssh root@72.61.107.43 "systemctl status nginx"
```

## SSL Configuration (After DNS Works)

Once DNS is working, set up SSL certificates:

### 1. SSH to VPS
```bash
ssh root@72.61.107.43
```

### 2. Install Certbot
```bash
apt update
apt install certbot python3-certbot-nginx -y
```

### 3. Get SSL Certificates
```bash
# For both domains at once
certbot --nginx -d yourdomain.com -d staging.yourdomain.com -d www.yourdomain.com

# Follow prompts:
# - Enter email for notifications
# - Agree to terms
# - Choose redirect option (recommended)
```

### 4. Test SSL
- Visit: https://yourdomain.com
- Visit: https://staging.yourdomain.com
- Should show secure lock icon

## Domain Registrar Specific Notes

### **Namecheap**
- Changes take 5-30 minutes
- Use "Advanced DNS" not "Basic DNS"
- Remove default parking page records

### **GoDaddy**
- Can take up to 1 hour
- Remove default "forwarding" if enabled
- Check "DNS Management" not "Forwarding"

### **Cloudflare**
- Very fast propagation (1-5 minutes)
- Start with "DNS only" mode
- Can enable proxy after testing

### **Google Domains**
- Usually 10-60 minutes
- Very reliable propagation
- Good for beginners

## Complete Configuration Checklist

### ✅ DNS Configuration
- [ ] A record for root domain (@) → 72.61.107.43
- [ ] A record for staging subdomain → 72.61.107.43  
- [ ] A record for www subdomain → 72.61.107.43
- [ ] Wait for DNS propagation
- [ ] Test with dig/nslookup commands

### ✅ VPS Configuration  
- [ ] Nginx configured for your domains
- [ ] Docker containers running
- [ ] Firewall allows HTTP/HTTPS (ports 80/443)

### ✅ SSL Setup
- [ ] Certbot installed
- [ ] SSL certificates obtained
- [ ] HTTPS redirect configured
- [ ] Test HTTPS access

### ✅ Application Test
- [ ] Production site loads: https://yourdomain.com
- [ ] Staging site loads: https://staging.yourdomain.com
- [ ] Admin panel works: https://yourdomain.com/fr/admin
- [ ] Health check works: https://yourdomain.com/api/health

## Common DNS Record Formats

Different registrars use slightly different formats:

### Namecheap Format
```
Type: A Record
Host: @ (for root domain)
Host: staging (for subdomain)  
Value: 72.61.107.43
TTL: Automatic
```

### GoDaddy Format
```
Type: A
Name: @ (for root domain)
Name: staging (for subdomain)
Value: 72.61.107.43
TTL: 600
```

### Cloudflare Format
```
Type: A
Name: yourdomain.com (for root)
Name: staging (for subdomain)
Content: 72.61.107.43
TTL: Auto
```

## Timeline Expectations

**DNS Propagation**: 5 minutes - 1 hour (usually)
**SSL Certificate**: 2-5 minutes after DNS works  
**Full Setup**: 1-2 hours total

## Need Help?

### Check These Resources:
- Your registrar's help documentation
- DNS propagation checker: dnschecker.org
- SSL test: ssllabs.com/ssltest/

### Common Issues:
1. **Wrong record type**: Use A records, not CNAME for root domain
2. **Typo in IP**: Double-check 72.61.107.43
3. **Old records**: Remove conflicting records
4. **Cache**: Clear browser/DNS cache

Your domain will be live once DNS propagates and points to your VPS!