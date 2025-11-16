# KITMED Platform - Complete Development & Deployment Workflow

## Overview

This guide covers the complete end-to-end workflow for developing and deploying the KITMED platform using the clean branch strategy with automated Docker deployments.

## Architecture Summary

```
Local Development → Git Push → GitHub Actions → Docker Deployment → Live Website

Your Computer          GitHub          VPS (72.61.107.43)
├── dev branch    →   ├── staging  →   ├── staging.yourdomain.com
└── feature work  →   └── main     →   └── yourdomain.com
```

## Branch Strategy

### **Local Branches (Your Computer)**
- **`dev`** - Your main development branch (daily work)
- **`staging`** - Local copy for deploying to staging (deployment only)
- **`main`** - Local copy for deploying to production (deployment only)

### **Remote Branches (GitHub)**
- **`staging`** - Triggers staging deployment
- **`main`** - Triggers production deployment

### **Deployment Targets**
- **staging.yourdomain.com** - Testing environment
- **yourdomain.com** - Production environment

## Complete Daily Workflow

### 1. **Start Your Day (Development Setup)**

```bash
# Navigate to project
cd "/Users/mac/Documents/Zonemation/Transformation digital/Clients/KITMEDAPP"

# Ensure you're on development branch
git checkout dev

# Start local development server
npm run dev

# Open in browser: http://localhost:3001
```

**Development Environment:**
- **Server**: Next.js development server (hot reload)
- **Database**: Local SQLite file
- **Speed**: Fast iteration and testing
- **Isolation**: Changes only on your computer

### 2. **Daily Development Work**

```bash
# Work on features (always on dev branch)
# Make changes to files...

# Check status
git status

# Stage changes
git add .

# Commit changes with descriptive message
git commit -m "feat: add user dashboard functionality"

# Continue development cycle
# Edit → Save → Test → Commit → Repeat
```

**Best Practices:**
- Commit frequently with clear messages
- Test features locally before deploying
- Use conventional commit format: `feat:`, `fix:`, `docs:`
- Keep commits atomic (one feature/fix per commit)

### 3. **Deploy to Staging for Testing**

When ready to test your changes on the staging server:

```bash
# Switch to staging branch
git checkout staging

# Merge your development work
git merge dev

# Push to trigger staging deployment
git push origin staging

# Switch back to development
git checkout dev

# Continue working while staging deploys
```

**What Happens Automatically:**

1. **GitHub Actions Triggered**
   - Detects push to staging branch
   - Starts automated deployment workflow

2. **Docker Build Process**
   ```yaml
   - Build optimized Docker image
   - Include all dependencies
   - Optimize for production performance
   - Security scanning
   ```

3. **VPS Deployment**
   ```bash
   - SSH to VPS (72.61.107.43)
   - Stop old staging container
   - Pull new Docker image
   - Start new staging container
   - Run database migrations
   - Health check verification
   ```

4. **Staging Environment Ready**
   - Available at: staging.yourdomain.com
   - Running in Docker container
   - Isolated staging database
   - Full production-like environment

### 4. **Test on Staging**

```bash
# Check deployment status
# Visit: https://github.com/stntr660/kitmed/actions

# Test staging environment
curl https://staging.yourdomain.com/api/health

# Manual testing
# Visit: https://staging.yourdomain.com
# Test all functionality
# Verify new features work
# Check for any issues
```

**Staging Testing Checklist:**
- [ ] Application loads correctly
- [ ] New features work as expected
- [ ] No broken existing functionality
- [ ] Database operations work
- [ ] File uploads function
- [ ] Admin panel accessible
- [ ] Performance is acceptable

### 5. **Deploy to Production**

When staging tests pass and you're confident:

```bash
# Switch to main branch
git checkout main

# Merge tested staging code
git merge staging

# Deploy to production
git push origin main

# Switch back to development
git checkout dev

# Continue development work
```

**What Happens Automatically:**

1. **GitHub Actions Triggered**
   - Detects push to main branch
   - Starts production deployment

2. **Production Docker Build**
   ```yaml
   - Build production Docker image
   - Enhanced security scanning
   - Performance optimization
   - Resource management
   ```

3. **Production Deployment**
   ```bash
   - SSH to VPS (72.61.107.43)
   - Stop old production container gracefully
   - Pull new Docker image
   - Start new production container
   - Run database migrations
   - Health check verification
   - Rollback if deployment fails
   ```

4. **Production Environment Ready**
   - Available at: yourdomain.com
   - Running in Docker container
   - Production database
   - Full monitoring and logging

### 6. **Monitor Deployment**

```bash
# Check GitHub Actions status
# Visit: https://github.com/stntr660/kitmed/actions

# Verify production health
curl https://yourdomain.com/api/health

# Check application
# Visit: https://yourdomain.com
```

## Docker Containerization Details

### **Local Development (No Docker)**
```bash
npm run dev
# - Fast hot reload
# - Direct file system access
# - Quick iteration
# - Easy debugging
```

### **Staging Environment (Docker)**
```yaml
Container Configuration:
  - Image: Node.js 18 Alpine
  - Port: 3001
  - Database: SQLite in volume
  - Environment: Production-like
  - Monitoring: Health checks
  - Resources: Optimized allocation
```

### **Production Environment (Docker)**
```yaml
Container Configuration:
  - Image: Node.js 18 Alpine (hardened)
  - Port: 3000
  - Database: SQLite in volume
  - Environment: Production
  - Monitoring: Full health checks
  - Resources: Production allocation
  - Security: Enhanced scanning
```

## Database Management

### **Local Development Database**
- **Location**: `prisma/dev.db`
- **Type**: SQLite file
- **Management**: Manual with Prisma Studio
- **Data**: Development/test data

### **Staging Database**
- **Location**: Docker volume `/app/data/staging.db`
- **Type**: SQLite in container
- **Management**: Automated via Prisma
- **Data**: Staging test data
- **Persistence**: Survives container restarts

### **Production Database**
- **Location**: Docker volume `/app/data/production.db`
- **Type**: SQLite in container
- **Management**: Automated via Prisma
- **Data**: Live production data
- **Persistence**: Survives deployments
- **Backups**: Automated daily backups

## Environment Variables

### **Local Development (.env.local)**
```bash
DATABASE_URL=file:./prisma/dev.db
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=local-dev-secret
NODE_ENV=development
MAINTENANCE_MODE=false
```

### **Staging Environment**
```bash
DATABASE_URL=file:/app/data/staging.db
NEXTAUTH_URL=https://staging.yourdomain.com
NEXTAUTH_SECRET=staging-secret-key
NODE_ENV=production
MAINTENANCE_MODE=false
```

### **Production Environment**
```bash
DATABASE_URL=file:/app/data/production.db
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=production-secret-key
NODE_ENV=production
MAINTENANCE_MODE=false
```

## Maintenance Mode

### **Enable Maintenance Mode**

For emergency maintenance or major updates:

```bash
# SSH to VPS
ssh root@72.61.107.43

# Enable maintenance on staging
cd /var/www/kitmed-staging
sed -i 's/MAINTENANCE_MODE=false/MAINTENANCE_MODE=true/' .env
docker-compose restart

# Enable maintenance on production
cd /var/www/kitmed-production
sed -i 's/MAINTENANCE_MODE=false/MAINTENANCE_MODE=true/' .env
docker-compose restart
```

**What happens:**
- All routes show professional maintenance page
- URLs stay clean (no /maintenance in address)
- API routes return 503 Service Unavailable
- Health check endpoint remains active

### **Disable Maintenance Mode**
```bash
# Change MAINTENANCE_MODE back to false
sed -i 's/MAINTENANCE_MODE=true/MAINTENANCE_MODE=false/' .env
docker-compose restart
```

## Troubleshooting Workflows

### **Deployment Failed**

1. **Check GitHub Actions**
   ```bash
   # Visit: https://github.com/stntr660/kitmed/actions
   # Click on failed workflow
   # Read error logs
   ```

2. **Common Issues & Solutions**
   ```bash
   # SSH connection failed
   - Check VPS is running
   - Verify SSH keys in GitHub secrets
   
   # Docker build failed  
   - Check Dockerfile syntax
   - Verify package.json dependencies
   
   # Container won't start
   - Check application logs
   - Verify environment variables
   ```

3. **Manual Deployment (Emergency)**
   ```bash
   ssh root@72.61.107.43
   cd /var/www/kitmed-staging  # or kitmed-production
   git pull origin staging     # or main
   docker-compose build
   docker-compose up -d
   ```

### **Application Issues**

1. **Local Development Problems**
   ```bash
   # Kill development server
   # Ctrl+C or pkill -f "npm run dev"
   
   # Clear Next.js cache
   rm -rf .next
   
   # Reinstall dependencies
   rm -rf node_modules
   npm install
   
   # Restart development
   npm run dev
   ```

2. **Database Issues**
   ```bash
   # Local database reset
   rm prisma/dev.db
   npx prisma db push
   
   # Production database check
   ssh root@72.61.107.43
   docker exec kitmed-production ls -la /app/data/
   ```

3. **Container Issues**
   ```bash
   # Check container status
   ssh root@72.61.107.43
   docker ps
   
   # View container logs
   docker logs kitmed-production --tail 50
   
   # Restart containers
   docker-compose restart
   ```

## Performance Optimization

### **Local Development**
- Use `npm run dev` for fastest iteration
- Enable hot reload for instant feedback
- Use browser dev tools for debugging

### **Staging Testing**
- Test with production-like data volumes
- Verify performance with realistic load
- Check mobile responsiveness

### **Production Monitoring**
- Monitor response times
- Check resource usage
- Set up alerts for downtime

## Security Considerations

### **Local Development**
- Use development secrets only
- Don't commit sensitive data
- Use `.env.local` for local config

### **Staging Environment**
- Use staging-specific secrets
- Limit access to authorized testers
- Regular security updates

### **Production Environment**
- Strong production secrets
- Regular security patches
- Monitor for vulnerabilities
- Backup sensitive data

## Backup Strategy

### **Local Development**
```bash
# Backup project
cp -r "KITMEDAPP" "KITMEDAPP-backup-$(date +%Y%m%d)"

# Git backup
git bundle create kitmed-backup.bundle --all
```

### **Production Backup**
```bash
# Automated daily database backup
ssh root@72.61.107.43
docker exec kitmed-production cp /app/data/production.db /app/data/backup-$(date +%Y%m%d).db

# Download backup
scp root@72.61.107.43:/var/www/kitmed-production/data/backup-*.db ./
```

## Emergency Procedures

### **Rollback Deployment**
```bash
# Rollback to previous version
git checkout main
git reset --hard HEAD~1  # Go back one commit
git push origin main --force

# This triggers automatic deployment of previous version
```

### **Complete Environment Reset**
```bash
# Local reset
git checkout dev
git reset --hard origin/staging  # Reset to last good state

# Production reset
git checkout main  
git reset --hard [commit-hash]   # Reset to specific good commit
git push origin main --force
```

## Quick Reference Commands

### **Daily Development**
```bash
git checkout dev                    # Start development
npm run dev                        # Start local server
git add . && git commit -m "..."   # Commit changes
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

### **Monitor Deployments**
```bash
# GitHub Actions
open https://github.com/stntr660/kitmed/actions

# Health checks
curl https://staging.yourdomain.com/api/health
curl https://yourdomain.com/api/health
```

## Success Metrics

### **Development Workflow Success**
- ✅ Code changes deploy automatically
- ✅ Staging environment mirrors production  
- ✅ Database migrations work seamlessly
- ✅ Zero-downtime deployments
- ✅ Quick rollback capability

### **Application Success**
- ✅ Sub-second page load times
- ✅ 99.9% uptime
- ✅ Successful file uploads
- ✅ Database operations complete quickly
- ✅ Mobile responsive design

This workflow ensures reliable, automated deployments while maintaining fast local development cycles and comprehensive testing capabilities.