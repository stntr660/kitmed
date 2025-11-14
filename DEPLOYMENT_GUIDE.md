# KITMED Platform - Deployment Guide

## Overview

The KITMED platform uses GitHub Actions for automatic deployment with branch-based environments:
- **staging branch** → staging.yourdomain.com
- **main branch** → yourdomain.com

Everything is automated: code deployment, Docker containers, database setup, and updates.

## Deployment Architecture

```
Local Development → Git Push → GitHub Actions → VPS Deployment
     ↓                ↓            ↓              ↓
npm run dev      staging/main   Build Docker    Auto-deploy
localhost:3001      branch      SSH to VPS     Live website
```

## Branch Strategy

### Staging Branch
- **Purpose**: Testing and validation
- **Trigger**: `git push origin staging`
- **Deploys to**: staging.yourdomain.com
- **Database**: staging.db (isolated)

### Main Branch  
- **Purpose**: Production deployment
- **Trigger**: `git push origin main`
- **Deploys to**: yourdomain.com
- **Database**: production.db (live)

### Development Workflow
1. Develop locally with `npm run dev`
2. Push to staging for testing
3. Merge staging to main for production

## Automatic Deployment Process

### What Happens When You Push

**Step 1: GitHub Actions Triggered**
```bash
git push origin staging  # or main
```

**Step 2: Build Process**
- GitHub Actions detects branch push
- Builds optimized Docker image
- Runs security scans
- Pushes image to registry

**Step 3: VPS Deployment**
- SSH into your VPS (72.61.107.43)
- Pulls latest Docker image
- Stops old container gracefully
- Starts new container
- Runs health checks

**Step 4: Database Management**
- First deployment: Creates database automatically
- Updates: Preserves data, applies schema changes
- Runs `npx prisma db push` for migrations

**Step 5: Service Validation**
- Health check endpoint verification
- Container status monitoring
- Automatic rollback if deployment fails

## Database Handling

### Automatic Database Creation
```yaml
# First deployment creates database
Database: SQLite file in Docker volume
Location: /app/data/staging.db or /app/data/production.db
Persistence: Survives container restarts/updates
```

### Schema Updates
- Prisma automatically applies schema changes
- Data preservation during updates
- No manual database intervention needed

### Data Isolation
- Staging and production databases are separate
- No cross-environment data pollution
- Safe testing on staging without affecting production

## Setup Requirements (One-time)

### 1. GitHub Repository Secrets

Go to: **GitHub → Your Repo → Settings → Secrets and variables → Actions**

Add these secrets:
```
SSH_PRIVATE_KEY: [Your VPS SSH private key]
STAGING_HOST: 72.61.107.43
PRODUCTION_HOST: 72.61.107.43
STAGING_USER: root
PRODUCTION_USER: root
```

### 2. VPS Configuration

Your VPS (72.61.107.43) needs:
- Docker and Docker Compose installed
- Directory structure: `/var/www/kitmed-staging` and `/var/www/kitmed-production`
- SSH access configured
- Nginx proxy setup (optional)

### 3. Domain Configuration

Point your domains to VPS:
```
yourdomain.com → 72.61.107.43
staging.yourdomain.com → 72.61.107.43
```

## Deployment Commands

### Deploy to Staging
```bash
# Make changes locally
git checkout staging
# ... make changes ...
git add .
git commit -m "feat: add new feature"
git push origin staging

# Automatic deployment triggered
# Check: https://github.com/stntr660/kitmed/actions
```

### Deploy to Production
```bash
# Merge tested staging changes
git checkout main
git merge staging
git push origin main

# Production deployment triggered
# Check: https://github.com/stntr660/kitmed/actions
```

### Emergency Rollback
```bash
# Rollback to previous version
git checkout main
git reset --hard HEAD~1
git push origin main --force

# Or deploy specific commit
git push origin commit-hash:main
```

## Maintenance Mode

### Enable Maintenance Mode

**For Staging:**
```bash
# SSH to VPS
ssh root@72.61.107.43
cd /var/www/kitmed-staging
sed -i 's/MAINTENANCE_MODE=false/MAINTENANCE_MODE=true/' .env
docker-compose restart
```

**For Production:**
```bash
ssh root@72.61.107.43
cd /var/www/kitmed-production
sed -i 's/MAINTENANCE_MODE=false/MAINTENANCE_MODE=true/' .env
docker-compose restart
```

### Disable Maintenance Mode
```bash
# Change back to false and restart
sed -i 's/MAINTENANCE_MODE=true/MAINTENANCE_MODE=false/' .env
docker-compose restart
```

## Monitoring & Troubleshooting

### Health Checks
- **Staging**: https://staging.yourdomain.com/api/health
- **Production**: https://yourdomain.com/api/health

### View Deployment Logs
- **GitHub Actions**: https://github.com/stntr660/kitmed/actions
- **Container Logs**: `docker logs kitmed-staging` or `docker logs kitmed-production`

### Common Issues

**Deployment Failed:**
1. Check GitHub Actions logs
2. Verify SSH connection to VPS
3. Check Docker container status: `docker ps`
4. View container logs: `docker logs [container-name]`

**Database Issues:**
1. Check database file permissions
2. Verify Docker volume mounts
3. Check Prisma schema syntax

**Network Issues:**
1. Verify domain DNS settings
2. Check nginx configuration
3. Verify Docker port mappings

### Manual Deployment (Emergency)

If automatic deployment fails:
```bash
# SSH to VPS
ssh root@72.61.107.43

# Manual staging deployment
cd /var/www/kitmed-staging
git pull origin staging
docker-compose build
docker-compose up -d

# Manual production deployment  
cd /var/www/kitmed-production
git pull origin main
docker-compose build
docker-compose up -d
```

## Environment Variables

### Staging Environment
```bash
DATABASE_URL=file:/app/data/staging.db
NEXTAUTH_URL=https://staging.yourdomain.com
NEXTAUTH_SECRET=[staging-secret]
NODE_ENV=production
MAINTENANCE_MODE=false
```

### Production Environment
```bash
DATABASE_URL=file:/app/data/production.db
NEXTAUTH_URL=https://yourdomain.com  
NEXTAUTH_SECRET=[production-secret]
NODE_ENV=production
MAINTENANCE_MODE=false
```

## Security Considerations

### SSH Key Management
- Use dedicated SSH keys for deployment
- Rotate keys periodically
- Restrict SSH key permissions

### Secrets Management
- Never commit secrets to Git
- Use GitHub Secrets for sensitive data
- Generate strong NextAuth secrets

### Container Security
- Images built with security scanning
- Non-root user inside containers
- Regular security updates

## Performance Optimization

### Docker Optimization
- Multi-stage builds for smaller images
- Layer caching for faster builds
- Resource limits for containers

### Database Performance
- SQLite optimizations enabled
- Automatic vacuum and analyze
- Connection pooling configured

## Backup Strategy

### Database Backups
```bash
# Automatic daily backups
docker exec kitmed-production cp /app/data/production.db /app/data/backup-$(date +%Y%m%d).db

# Manual backup
docker cp kitmed-production:/app/data/production.db ./backup-$(date +%Y%m%d).db
```

### File Uploads Backup
```bash
# Backup uploads directory
docker cp kitmed-production:/app/uploads ./uploads-backup-$(date +%Y%m%d)
```

## Testing Deployment

### Test Staging Deployment
```bash
# 1. Make a small change
echo "# Test deployment" >> README.md
git add .
git commit -m "test: staging deployment"
git push origin staging

# 2. Monitor deployment
# GitHub Actions: https://github.com/stntr660/kitmed/actions

# 3. Verify deployment
curl https://staging.yourdomain.com/api/health
```

### Test Production Deployment
```bash
# 1. Merge tested staging
git checkout main
git merge staging
git push origin main

# 2. Verify production
curl https://yourdomain.com/api/health
```

## Development Workflow Summary

```bash
# Daily development
npm run dev  # localhost:3001

# Deploy to staging for testing
git push origin staging  # → staging.yourdomain.com

# Deploy to production when ready
git checkout main
git merge staging
git push origin main  # → yourdomain.com

# Monitor deployments
# GitHub Actions: https://github.com/stntr660/kitmed/actions
```

## Support & Troubleshooting

### Quick Diagnostics
```bash
# Check container status
docker ps

# Check application health
curl http://localhost:3000/api/health  # or 3001 for staging

# View recent logs
docker logs --tail 50 kitmed-production

# Check disk space
df -h

# Check memory usage
free -h
```

### Emergency Contacts
- **Repository**: https://github.com/stntr660/kitmed
- **Actions**: https://github.com/stntr660/kitmed/actions
- **VPS**: 72.61.107.43

This automated deployment system ensures reliable, consistent deployments with minimal manual intervention while maintaining data integrity and system security.