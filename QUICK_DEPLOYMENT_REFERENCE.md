# KITMED - Quick Deployment Reference

## One-Time Setup

### Add GitHub Secrets
Go to: **Settings → Secrets and variables → Actions**

```
SSH_PRIVATE_KEY: [Your VPS SSH private key]
STAGING_HOST: 72.61.107.43
PRODUCTION_HOST: 72.61.107.43
STAGING_USER: root
PRODUCTION_USER: root
```

## Daily Deployment Commands

### Deploy to Staging
```bash
git checkout staging
# make changes...
git add .
git commit -m "your message"
git push origin staging
```
**Result**: Auto-deploys to staging.yourdomain.com

### Deploy to Production  
```bash
git checkout main
git merge staging
git push origin main
```
**Result**: Auto-deploys to yourdomain.com

## Emergency Commands

### Enable Maintenance Mode
```bash
# SSH to VPS
ssh root@72.61.107.43

# For production
cd /var/www/kitmed-production
sed -i 's/MAINTENANCE_MODE=false/MAINTENANCE_MODE=true/' .env
docker-compose restart

# For staging  
cd /var/www/kitmed-staging
sed -i 's/MAINTENANCE_MODE=false/MAINTENANCE_MODE=true/' .env
docker-compose restart
```

### Quick Health Check
```bash
curl https://yourdomain.com/api/health
curl https://staging.yourdomain.com/api/health
```

### View Deployment Status
- **GitHub Actions**: https://github.com/stntr660/kitmed/actions
- **Container logs**: `docker logs kitmed-production`

## Branch Strategy
- **staging** = Testing environment
- **main** = Production environment  
- Push to branch = Auto-deploy to environment

## What's Automated
✅ Docker build and deployment  
✅ Database creation and updates  
✅ Container management  
✅ Health monitoring  
✅ Rollback on failure