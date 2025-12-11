# Kitmed Deployment Workflow

## Overview

Kitmed uses a staging -> production deployment workflow with Dokploy on VPS.

- **Production**: https://kitmed.ma (branch: `main`)
- **Staging**: https://kitmed-staging.zonemation.cloud (branch: `staging`)
- **VPS**: 72.61.107.43
- **Dokploy Dashboard**: https://dokploy.zonemation.cloud

---

## Architecture

```
Local Development
       |
       v
   Git (staging branch)
       |
       v
   Dokploy (auto-deploy)
       |
       v
   Staging Environment (test)
       |
       v
   Git (merge to main)
       |
       v
   Production Environment
```

---

## Database Setup

### Production Database
- Host: 10.0.1.22
- Database: kitmed_prod
- User: kitmed_user

### Staging Database
- Host: 10.0.1.3
- Database: kitmed_staging
- User: kitmed_staging_user
- Password: KitMed_Staging_2024_SecurePass

### Local Development
- Uses local PostgreSQL or SQLite
- DATABASE_URL in .env.local

---

## Deployment Files

### docker-compose-staging.yml
Used by Dokploy for staging deployment:
- Container: kitmed-staging
- Domain: kitmed-staging.zonemation.cloud
- MAINTENANCE_MODE: false (staging is not in maintenance)

### docker-compose.yml
Used by Dokploy for production deployment:
- Container: kitmed-app
- Domain: kitmed.ma, www.kitmed.ma

---

## Workflow: Adding New Products/Images Locally

### Step 1: Work Locally
```bash
# Start local dev server
cd /Users/mac/Documents/Zonemation/Transformation\ digital/Clients/KITMEDAPP
npm run dev
```

Add products via admin interface. Images are saved to `public/uploads/`.

### Step 2: Export Local Database Changes
```bash
# Export specific tables or full database
pg_dump -h localhost -U postgres kitmed_production > /tmp/kitmed_local_export.sql

# Or export only new data (products, media, etc.)
pg_dump -h localhost -U postgres -t products -t product_media -t product_translations --data-only kitmed_production > /tmp/new_products.sql
```

### Step 3: Push Code Changes to Staging
```bash
git add .
git commit -m "feat: add new products and images"
git push origin staging
```

### Step 4: Redeploy Staging in Dokploy
1. Go to https://dokploy.zonemation.cloud
2. Navigate to Kitmed Staging project
3. Click "Deploy" to rebuild with new code

### Step 5: Import Database to Staging
```bash
# Copy SQL file to VPS
scp -i ~/.ssh/claude_vps_key /tmp/new_products.sql root@72.61.107.43:/tmp/

# Import to staging database via postgres container
ssh -i ~/.ssh/claude_vps_key root@72.61.107.43 \
  "docker exec -i dokploy-postgres.1.efe2d9rrv4c8uvhcw6e5rp566 \
   psql -U kitmed_staging_user -d kitmed_staging < /tmp/new_products.sql"
```

### Step 6: Copy Uploads to Staging Container
```bash
# Compress local uploads
cd /Users/mac/Documents/Zonemation/Transformation\ digital/Clients/KITMEDAPP/public
tar -czf /tmp/kitmed_uploads.tar.gz uploads/

# Upload to VPS
scp -i ~/.ssh/claude_vps_key /tmp/kitmed_uploads.tar.gz root@72.61.107.43:/tmp/

# Extract into staging container
ssh -i ~/.ssh/claude_vps_key root@72.61.107.43 \
  "docker cp /tmp/kitmed_uploads.tar.gz kitmed-staging:/app/public/ && \
   docker exec kitmed-staging tar -xzf /app/public/kitmed_uploads.tar.gz -C /app/public/ && \
   docker exec kitmed-staging rm /app/public/kitmed_uploads.tar.gz"
```

### Step 7: Verify Staging
- Visit https://kitmed-staging.zonemation.cloud
- Check new products display correctly
- Verify images load

---

## Workflow: Promoting Staging to Production

### Step 1: Test Staging Thoroughly
- All features working
- Images displaying
- No console errors

### Step 2: Merge to Main
```bash
git checkout main
git merge staging
git push origin main
```

### Step 3: Redeploy Production in Dokploy
1. Go to Dokploy dashboard
2. Navigate to Kitmed Production project
3. Deploy

### Step 4: Sync Database to Production
```bash
# Export from staging
ssh -i ~/.ssh/claude_vps_key root@72.61.107.43 \
  "docker exec dokploy-postgres.1.efe2d9rrv4c8uvhcw6e5rp566 \
   pg_dump -U kitmed_staging_user kitmed_staging > /tmp/staging_export.sql"

# Import to production (CAREFUL - backup first!)
ssh -i ~/.ssh/claude_vps_key root@72.61.107.43 \
  "docker exec -i dokploy-postgres.1.efe2d9rrv4c8uvhcw6e5rp566 \
   psql -U kitmed_user -d kitmed_prod < /tmp/staging_export.sql"
```

### Step 5: Copy Uploads to Production
```bash
ssh -i ~/.ssh/claude_vps_key root@72.61.107.43 \
  "docker cp /tmp/kitmed_uploads.tar.gz kitmed-app:/app/public/ && \
   docker exec kitmed-app tar -xzf /app/public/kitmed_uploads.tar.gz -C /app/public/ && \
   docker exec kitmed-app rm /app/public/kitmed_uploads.tar.gz"
```

---

## Important Notes

### Uploads Are NOT Persistent
- Container restarts/redeployments WIPE the uploads folder
- Always keep uploads backed up on VPS at `/tmp/kitmed_uploads.tar.gz`
- Re-copy uploads after every deployment

### Future Improvement: Persistent Volume
To make uploads persist across deployments, add to docker-compose:
```yaml
volumes:
  - kitmed-uploads:/app/public/uploads

volumes:
  kitmed-uploads:
```

### The Uploads API Route
File: `src/app/uploads/[[...path]]/route.ts`
- Serves files from `public/uploads/` directory
- Required because Next.js standalone mode doesn't serve public folder automatically
- Includes path traversal protection and caching headers

---

## Quick Reference Commands

### Check staging container
```bash
ssh -i ~/.ssh/claude_vps_key root@72.61.107.43 "docker ps -f name=kitmed-staging"
```

### View staging logs
```bash
ssh -i ~/.ssh/claude_vps_key root@72.61.107.43 "docker logs -f kitmed-staging"
```

### Check if uploads exist in container
```bash
ssh -i ~/.ssh/claude_vps_key root@72.61.107.43 \
  "docker exec kitmed-staging ls /app/public/uploads/products/ | wc -l"
```

### Test image URL
```bash
curl -s -o /dev/null -w '%{http_code}' \
  "https://kitmed-staging.zonemation.cloud/uploads/products/9601-primary.jpg"
```

### Connect to staging database
```bash
ssh -i ~/.ssh/claude_vps_key root@72.61.107.43 \
  "docker exec -it dokploy-postgres.1.efe2d9rrv4c8uvhcw6e5rp566 \
   psql -U kitmed_staging_user -d kitmed_staging"
```

---

## Environment Variables

### Staging (set in Dokploy)
```
NODE_ENV=production
DATABASE_URL=postgresql://kitmed_staging_user:KitMed_Staging_2024_SecurePass@10.0.1.3:5432/kitmed_staging
NEXTAUTH_URL=https://kitmed-staging.zonemation.cloud
NEXTAUTH_SECRET=KitMed_Staging_NextAuth_Secret_2024_SecureKey
JWT_SECRET=KitMed_Staging_JWT_Secret_2024_SecureKey
MAINTENANCE_MODE=false
```

### Production (set in Dokploy)
```
NODE_ENV=production
DATABASE_URL=postgresql://kitmed_user:***@10.0.1.22:5432/kitmed_prod
NEXTAUTH_URL=https://kitmed.ma
NEXTAUTH_SECRET=***
JWT_SECRET=***
MAINTENANCE_MODE=true (or false when ready)
```

---

## Troubleshooting

### Images not displaying (404)
1. Check uploads exist: `docker exec kitmed-staging ls /app/public/uploads/products/`
2. If empty, re-copy uploads from VPS backup
3. Verify the uploads route exists in build

### Database connection issues
1. Check container can reach database: `docker exec kitmed-staging nc -z 10.0.1.3 5432`
2. Verify DATABASE_URL is correct in Dokploy env vars

### Container not starting
1. Check logs: `docker logs kitmed-staging`
2. Check Dokploy build logs in dashboard

---

Last Updated: December 11, 2025
