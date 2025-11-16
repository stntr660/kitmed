# KITMED Workflow - Quick Cheat Sheet

## Daily Commands

### **Start Development**
```bash
git checkout dev
npm run dev  # localhost:3001
```

### **Deploy to Staging**
```bash
git checkout staging
git merge dev
git push origin staging
git checkout dev
```

### **Deploy to Production**
```bash
git checkout main
git merge staging
git push origin main
git checkout dev
```

## Branch Rules

- **`dev`** = Your daily work (code here)
- **`staging`** = Deploy to staging.yourdomain.com
- **`main`** = Deploy to yourdomain.com

## What's Automated

✅ Docker builds on git push  
✅ VPS deployment  
✅ Database setup/migrations  
✅ Health monitoring  
✅ Container management  

## Emergency Commands

### **Enable Maintenance Mode**
```bash
ssh root@72.61.107.43
cd /var/www/kitmed-production
sed -i 's/MAINTENANCE_MODE=false/MAINTENANCE_MODE=true/' .env
docker-compose restart
```

### **Quick Rollback**
```bash
git checkout main
git reset --hard HEAD~1
git push origin main --force
```

### **Check Health**
```bash
curl https://yourdomain.com/api/health
curl https://staging.yourdomain.com/api/health
```

## Monitor Deployments
- **GitHub Actions**: https://github.com/stntr660/kitmed/actions
- **Staging**: https://staging.yourdomain.com
- **Production**: https://yourdomain.com

## Workflow Summary
**Code locally → Push to staging → Test → Push to production → Live**

Everything else is automated with Docker + GitHub Actions!