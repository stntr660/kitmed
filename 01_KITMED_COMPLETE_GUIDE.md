# 🏥 KITMED Platform - Complete Documentation
*Medical Equipment Wholesale Platform - All-in-One Guide*

## 📍 Quick Navigation

### **Platform Management**
- [🚀 Production Status](#production-status)
- [🔧 Daily Operations](#daily-operations)
- [🛠️ Development Workflow](#development-workflow)
- [📊 Monitoring & Maintenance](#monitoring--maintenance)
- [🆘 Emergency Procedures](#emergency-procedures)

### **Development & Deployment**
- [🏗️ Architecture Overview](#architecture-overview)
- [💻 Development Setup](#development-setup)
- [🚢 Deployment Process](#deployment-process)
- [🧪 Testing Guide](#testing-guide)
- [📝 API Documentation](#api-documentation)

---

## 🚀 Production Status

### **Current Deployment**
| **Environment** | **Status** | **URL** | **Branch** | **Port** |
|----------------|------------|---------|-----------|----------|
| Production | 🟢 Live | https://kitmed.ma | main | 3001 |
| Staging | 🟢 Active | https://staging.kitmed.ma | staging | 3002 |
| Development | 💻 Local | localhost:3000 | dev | 3000 |

### **Infrastructure Details**
- **Server**: Hostinger VPS (72.61.107.43)
- **Containerization**: Docker with multi-stage builds
- **Reverse Proxy**: Nginx with SSL termination
- **Database**: SQLite with file-based storage
- **SSL**: Let's Encrypt certificates
- **Monitoring**: Custom health checks

### **Key Features Status**
- ✅ **Multi-language Support** (French/Arabic via next-intl)
- ✅ **Authentication System** (NextAuth.js)
- ✅ **Product Management** (CRUD operations)
- ✅ **User Management** (3 user types: suppliers, buyers, admin)
- ✅ **Quote Request System** (B2B functionality)
- ✅ **Admin Dashboard** (Complete management interface)
- ✅ **File Upload System** (Product images, documents)
- ✅ **Responsive Design** (Mobile-optimized UI)

---

## 🔧 Daily Operations

### **Server Access**
```bash
# SSH into server
ssh vps

# Alternative direct access
ssh root@72.61.107.43
```

### **Service Status Checks**
```bash
# Check all KITMED containers
docker ps | grep kitmed

# Check specific service logs
docker logs kitmed-prod
docker logs kitmed-staging-container

# Check nginx proxy status
docker logs nginx-proxy

# Quick health check
curl -I https://kitmed.ma
curl -I https://staging.kitmed.ma
```

### **Container Management**
```bash
# Restart production
docker restart kitmed-prod

# Restart staging
docker restart kitmed-staging-container

# Check resource usage
docker stats kitmed-prod kitmed-staging-container

# View real-time logs
docker logs -f kitmed-prod
```

### **Maintenance Mode**
```bash
# Enable maintenance mode
echo "MAINTENANCE_MODE=true" >> /root/docker-volumes/kitmed-prod/.env.production.local
docker restart kitmed-prod

# Disable maintenance mode
sed -i '/MAINTENANCE_MODE=true/d' /root/docker-volumes/kitmed-prod/.env.production.local
docker restart kitmed-prod

# Check maintenance status
curl -I https://kitmed.ma | grep middleware
```

---

## 🏗️ Architecture Overview

### **Application Stack**
```
Frontend: Next.js 14 + TypeScript + Tailwind CSS
├── Authentication: NextAuth.js
├── Internationalization: next-intl (French/Arabic)
├── UI Components: shadcn/ui + Radix UI
├── Forms: React Hook Form + Zod validation
├── File Handling: Multer + File system storage
└── Styling: Tailwind CSS + CSS Variables

Backend: Next.js API Routes + Server Actions
├── Database: Prisma ORM + SQLite
├── Authentication: NextAuth.js with credentials
├── File Upload: Multer middleware
├── Validation: Zod schemas
└── Error Handling: Custom error boundaries

Infrastructure: Docker + Nginx + SSL
├── Containerization: Multi-stage Docker builds
├── Reverse Proxy: Nginx with domain routing
├── SSL/TLS: Let's Encrypt certificates
├── Monitoring: Custom health checks
└── Backup: Automated daily backups
```

### **Database Schema**
```
Users (Multi-tenant with roles)
├── id, email, name, phone
├── role: 'supplier', 'buyer', 'admin'
├── tenantId: Organization isolation
├── profile: Company details
└── preferences: Language, notifications

Products (Supplier-owned inventory)
├── id, name, description, category
├── supplier: User relationship
├── pricing: List/wholesale prices
├── inventory: Stock levels
├── images: File system references
└── specifications: Technical details

Quote Requests (B2B transactions)
├── id, buyerId, status
├── products: Multi-product requests
├── quantity: Per product quantities
├── notes: Buyer requirements
├── responses: Supplier quotes
└── timeline: Created/updated timestamps
```

### **User Types & Permissions**
```
🏭 Suppliers (Product Providers)
├── Create/manage products
├── View/respond to quote requests
├── Access supplier dashboard
└── Manage company profile

🏥 Buyers (Healthcare Facilities)
├── Browse product catalog
├── Submit quote requests
├── Compare supplier responses
└── Manage purchase orders

👑 Admins (Platform Management)
├── Full system access
├── User management
├── Content moderation
├── Analytics & reporting
└── System configuration
```

---

## 💻 Development Setup

### **Local Development Environment**
```bash
# 1. Clone repository
git clone https://github.com/stntr660/kitmed.git
cd kitmed

# 2. Install dependencies
npm install

# 3. Setup environment
cp .env.example .env.local

# 4. Configure database
npx prisma generate
npx prisma db push

# 5. Start development server
npm run dev

# Access: http://localhost:3000
```

### **Environment Variables**
```bash
# .env.local (Development)
NODE_ENV=development
PORT=3000
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="development-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Upload configuration
UPLOAD_DIR="./public/uploads"
MAX_FILE_SIZE=5242880  # 5MB

# Internationalization
DEFAULT_LOCALE=fr
LOCALES=fr,ar
```

### **Development Workflow**
```bash
# 1. Create feature branch
git checkout -b feature/new-feature

# 2. Develop locally
npm run dev

# 3. Run tests
npm run test
npm run test:e2e

# 4. Lint and format
npm run lint
npm run format

# 5. Push to staging for testing
git push origin staging

# 6. Merge to main for production
git push origin main
```

---

## 🚢 Deployment Process

### **Branch Strategy**
- **`dev`**: Development branch for testing features
- **`staging`**: Pre-production testing environment
- **`main`**: Production-ready code

### **Automated Deployment**
```bash
# Staging deployment
git push origin staging
# → Triggers: Build → Deploy to staging.kitmed.ma

# Production deployment
git push origin main
# → Triggers: Build → Deploy to kitmed.ma
```

### **Manual Deployment**
```bash
# Update staging
cd /root/docker-volumes/kitmed-staging
git pull origin staging
docker build -t kitmed-staging:latest .
docker stop kitmed-staging-container && docker rm kitmed-staging-container
docker run -d --name kitmed-staging-container \
  --network root_wp-network \
  -p 3002:3000 \
  --env-file .env.local \
  kitmed-staging:latest

# Update production (after testing staging)
cd /root/docker-volumes/kitmed-prod
git pull origin main
docker build -t kitmed-prod:latest .
docker stop kitmed-prod && docker rm kitmed-prod
docker run -d --name kitmed-prod \
  --network root_wp-network \
  -p 3001:3000 \
  --env-file .env.production.local \
  kitmed-prod:latest
```

### **Rollback Procedure**
```bash
# Emergency rollback to previous version
docker stop kitmed-prod
docker run -d --name kitmed-prod \
  --network root_wp-network \
  -p 3001:3000 \
  --env-file .env.production.local \
  kitmed-prod:backup-YYYYMMDD-HHMMSS

# Or enable maintenance mode
echo "MAINTENANCE_MODE=true" >> /root/docker-volumes/kitmed-prod/.env.production.local
docker restart kitmed-prod
```

---

## 🧪 Testing Guide

### **Testing Stack**
- **Unit Tests**: Jest + React Testing Library
- **Integration Tests**: Jest with API testing
- **E2E Tests**: Playwright
- **Type Checking**: TypeScript + ESLint

### **Running Tests**
```bash
# Unit and integration tests
npm run test

# E2E tests
npm run test:e2e

# Type checking
npm run type-check

# Lint checking
npm run lint

# All tests
npm run test:all
```

### **Test Coverage**
```bash
# Generate coverage report
npm run test:coverage

# View coverage in browser
open coverage/lcov-report/index.html
```

### **Critical Test Areas**
- ✅ **Authentication Flow** (Login/logout, session management)
- ✅ **Product Management** (CRUD operations, file uploads)
- ✅ **Quote Request System** (Submission, response handling)
- ✅ **User Permissions** (Role-based access control)
- ✅ **Multi-language Support** (French/Arabic rendering)
- ✅ **Form Validation** (Input validation, error handling)
- ✅ **API Endpoints** (Data flow, error responses)

---

## 📊 Monitoring & Maintenance

### **Health Monitoring**
```bash
# Platform health check script
cat > /root/scripts/kitmed_health_check.sh << 'EOF'
#!/bin/bash
echo "=== KITMED Platform Health Check $(date) ==="

# Container status
echo "## Container Status"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep kitmed

# HTTP responses
echo -e "\n## HTTP Status"
prod_status=$(curl -s -o /dev/null -w "%{http_code}" https://kitmed.ma)
staging_status=$(curl -s -o /dev/null -w "%{http_code}" https://staging.kitmed.ma)
echo "Production: $prod_status"
echo "Staging: $staging_status"

# Database status
echo -e "\n## Database Status"
docker exec kitmed-prod ls -la /app/data/ | grep -E "\\.db$"
docker exec kitmed-staging-container ls -la /app/data/ | grep -E "\\.db$"

# Resource usage
echo -e "\n## Resource Usage"
docker stats --no-stream kitmed-prod kitmed-staging-container

# Recent errors
echo -e "\n## Recent Application Errors"
docker logs kitmed-prod 2>&1 | grep -i error | tail -3 || echo "No recent errors"

echo "=================================="
EOF

chmod +x /root/scripts/kitmed_health_check.sh
```

### **Backup Management**
```bash
# KITMED-specific backup script
cat > /root/scripts/kitmed_backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/root/backups/kitmed/$(date +%Y%m%d_%H%M%S)"
mkdir -p $BACKUP_DIR

echo "Starting KITMED backup: $(date)" >> /var/log/kitmed_backup.log

# Backup production database
docker exec kitmed-prod cp /app/data/production.db /tmp/
docker cp kitmed-prod:/tmp/production.db $BACKUP_DIR/

# Backup staging database
docker exec kitmed-staging-container cp /app/data/staging.db /tmp/
docker cp kitmed-staging-container:/tmp/staging.db $BACKUP_DIR/

# Backup uploads
docker exec kitmed-prod tar -czf /tmp/prod_uploads.tar.gz /app/uploads/
docker cp kitmed-prod:/tmp/prod_uploads.tar.gz $BACKUP_DIR/

docker exec kitmed-staging-container tar -czf /tmp/staging_uploads.tar.gz /app/uploads/
docker cp kitmed-staging-container:/tmp/staging_uploads.tar.gz $BACKUP_DIR/

# Backup environment files
cp /root/docker-volumes/kitmed-prod/.env.production.local $BACKUP_DIR/
cp /root/docker-volumes/kitmed-staging/.env.local $BACKUP_DIR/

# Backup source code snapshot
cd /root/docker-volumes/kitmed-prod && git rev-parse HEAD > $BACKUP_DIR/git_commit.txt
cd /root/docker-volumes/kitmed-staging && git rev-parse HEAD > $BACKUP_DIR/git_commit_staging.txt

# Cleanup old backups (keep 30 days)
find /root/backups/kitmed -type d -mtime +30 -exec rm -rf {} \; 2>/dev/null || true

echo "KITMED backup completed: $(date)" >> /var/log/kitmed_backup.log
echo "Backup location: $BACKUP_DIR" >> /var/log/kitmed_backup.log
EOF

chmod +x /root/scripts/kitmed_backup.sh

# Schedule daily backups
echo "0 2 * * * /root/scripts/kitmed_backup.sh" | crontab -l > mycron && echo "0 2 * * * /root/scripts/kitmed_backup.sh" >> mycron && crontab mycron && rm mycron
```

### **Performance Monitoring**
```bash
# KITMED performance metrics
cat > /root/scripts/kitmed_performance.sh << 'EOF'
#!/bin/bash

# Response time testing
prod_time=$(curl -o /dev/null -s -w "%{time_total}" https://kitmed.ma)
staging_time=$(curl -o /dev/null -s -w "%{time_total}" https://staging.kitmed.ma)

# Container resource usage
prod_memory=$(docker stats --no-stream --format "{{.MemUsage}}" kitmed-prod | awk '{print $1}')
staging_memory=$(docker stats --no-stream --format "{{.MemUsage}}" kitmed-staging-container | awk '{print $1}')

# Database size
prod_db_size=$(docker exec kitmed-prod du -h /app/data/production.db | cut -f1)
staging_db_size=$(docker exec kitmed-staging-container du -h /app/data/staging.db | cut -f1)

# Log metrics
echo "$(date),$prod_time,$staging_time,$prod_memory,$staging_memory,$prod_db_size,$staging_db_size" >> /var/log/kitmed_performance.log

echo "=== KITMED Performance $(date) ==="
echo "Production response time: ${prod_time}s"
echo "Staging response time: ${staging_time}s"
echo "Production memory: $prod_memory"
echo "Staging memory: $staging_memory"
echo "Production DB size: $prod_db_size"
echo "Staging DB size: $staging_db_size"
EOF

chmod +x /root/scripts/kitmed_performance.sh

# Run performance check every hour
echo "0 * * * * /root/scripts/kitmed_performance.sh" | crontab -l > mycron && echo "0 * * * * /root/scripts/kitmed_performance.sh" >> mycron && crontab mycron && rm mycron
```

---

## 🆘 Emergency Procedures

### **Platform Down Emergency**
```bash
# 1. Quick diagnosis
docker ps | grep kitmed
curl -I https://kitmed.ma

# 2. Container restart
docker restart kitmed-prod
sleep 10
curl -I https://kitmed.ma

# 3. If still down, redeploy
cd /root/docker-volumes/kitmed-prod
git log -1 --oneline  # Note current commit
docker build -t kitmed-prod:latest .
docker stop kitmed-prod && docker rm kitmed-prod
docker run -d --name kitmed-prod \
  --network root_wp-network \
  -p 3001:3000 \
  --env-file .env.production.local \
  kitmed-prod:latest

# 4. Enable maintenance if redeploy fails
echo "MAINTENANCE_MODE=true" >> /root/docker-volumes/kitmed-prod/.env.production.local
docker restart kitmed-prod
```

### **Database Corruption Recovery**
```bash
# 1. Stop application
docker stop kitmed-prod

# 2. Backup current state
docker cp kitmed-prod:/app/data/production.db /root/emergency_backup/corrupted_$(date +%Y%m%d_%H%M%S).db

# 3. Restore from latest backup
latest_backup=$(ls -t /root/backups/kitmed/*/production.db | head -1)
docker cp $latest_backup kitmed-prod:/app/data/production.db

# 4. Restart and verify
docker start kitmed-prod
sleep 15
curl -I https://kitmed.ma

# 5. Check application functionality
docker logs kitmed-prod | grep -i error
```

### **SSL Certificate Emergency**
```bash
# If SSL expires unexpectedly
# 1. Quick temporary certificate
openssl req -x509 -nodes -days 7 -newkey rsa:2048 \
    -keyout /etc/ssl/private/kitmed_temp.key \
    -out /etc/ssl/certs/kitmed_temp.crt \
    -subj "/CN=kitmed.ma"

# 2. Update nginx temporarily
sed -i 's|/etc/letsencrypt/live/kitmed.ma/fullchain.pem|/etc/ssl/certs/kitmed_temp.crt|' /root/nginx/conf.d/kitmed.conf
sed -i 's|/etc/letsencrypt/live/kitmed.ma/privkey.pem|/etc/ssl/private/kitmed_temp.key|' /root/nginx/conf.d/kitmed.conf

# 3. Reload nginx
docker exec nginx-proxy nginx -s reload

# 4. Fix Let's Encrypt and restore
```

### **Performance Emergency**
```bash
# If platform becomes slow
# 1. Check container resources
docker stats kitmed-prod

# 2. Check database size
docker exec kitmed-prod du -h /app/data/

# 3. Clear temporary files
docker exec kitmed-prod find /app/uploads/temp -type f -mtime +1 -delete

# 4. Restart with resource limits
docker stop kitmed-prod && docker rm kitmed-prod
docker run -d --name kitmed-prod \
  --network root_wp-network \
  --memory="1g" \
  --cpu-shares=1024 \
  -p 3001:3000 \
  --env-file .env.production.local \
  kitmed-prod:latest

# 5. Monitor improvement
docker stats kitmed-prod
```

---

## 📝 API Documentation

### **Authentication Endpoints**
```bash
POST /api/auth/signin
# Body: { email, password }
# Response: { user, token }

POST /api/auth/signup
# Body: { email, password, name, role }
# Response: { user, message }

POST /api/auth/signout
# Response: { success: true }
```

### **Product Management**
```bash
GET /api/products
# Query: { category?, supplier?, search? }
# Response: { products: [...] }

POST /api/products
# Body: { name, description, category, price, ... }
# Response: { product, message }

PUT /api/products/[id]
# Body: { name, description, ... }
# Response: { product, message }

DELETE /api/products/[id]
# Response: { success: true }
```

### **Quote Requests**
```bash
GET /api/rfp-requests
# Query: { status?, buyerId?, supplierId? }
# Response: { requests: [...] }

POST /api/rfp-requests
# Body: { products: [...], notes, urgency }
# Response: { request, message }

PUT /api/rfp-requests/[id]
# Body: { status?, response? }
# Response: { request, message }
```

### **File Upload**
```bash
POST /api/upload
# Content-Type: multipart/form-data
# Body: { file, type: 'product'|'document' }
# Response: { url, filename, message }
```

---

## 🎯 Login Credentials & Access

### **Admin Access**
```
Email: admin@kitmed.ma
Password: admin123
Role: Administrator
Access: Full platform management
```

### **Demo Accounts**
```
Supplier Demo:
Email: supplier@demo.com
Password: supplier123

Buyer Demo:
Email: buyer@demo.com
Password: buyer123
```

### **Development Accounts** (Local/Staging)
```
Test Admin:
Email: test@admin.com
Password: test123

Test Supplier:
Email: test@supplier.com
Password: test123

Test Buyer:
Email: test@buyer.com
Password: test123
```

---

## 🐛 Troubleshooting

### **Logo Size Issue (Staging vs Dev)**
**Problem**: Logo appears larger on staging than on dev branch

**Root Cause**: Commit `551896d` added `p-2` padding to logo component:
```tsx
// Before
<div className={cn('flex items-center', className)}>

// After  
<div className={cn('flex items-center p-2', className)}>
```

**Solution**: 
```bash
# If unwanted, remove padding
git checkout staging
# Edit src/components/ui/logo.tsx
# Remove p-2 from line 37
# Commit and push
```

### **Common Issues**

#### **Container Won't Start**
```bash
# Check logs for errors
docker logs kitmed-prod

# Check port conflicts
netstat -tuln | grep :3001

# Check environment file
cat /root/docker-volumes/kitmed-prod/.env.production.local

# Rebuild if needed
cd /root/docker-volumes/kitmed-prod
docker build -t kitmed-prod:latest .
```

#### **Database Connection Issues**
```bash
# Check database file exists
docker exec kitmed-prod ls -la /app/data/

# Check file permissions
docker exec kitmed-prod ls -la /app/data/production.db

# Reset database if corrupted
docker exec kitmed-prod rm /app/data/production.db
docker restart kitmed-prod
# Database will be recreated on startup
```

#### **File Upload Problems**
```bash
# Check upload directory
docker exec kitmed-prod ls -la /app/uploads/

# Check disk space
docker exec kitmed-prod df -h

# Check upload permissions
docker exec kitmed-prod ls -la /app/uploads/
```

---

## 📋 Maintenance Checklists

### **Daily KITMED Checks**
- [ ] Platform accessible: `curl -I https://kitmed.ma`
- [ ] Staging functional: `curl -I https://staging.kitmed.ma`
- [ ] Containers running: `docker ps | grep kitmed`
- [ ] No error logs: `docker logs kitmed-prod | grep -i error`
- [ ] Admin panel accessible: https://kitmed.ma/admin

### **Weekly KITMED Tasks**
- [ ] Run full health check: `/root/scripts/kitmed_health_check.sh`
- [ ] Check performance metrics: `tail -20 /var/log/kitmed_performance.log`
- [ ] Verify backup completion: `ls -la /root/backups/kitmed/`
- [ ] Test quote request flow (end-to-end)
- [ ] Review user activity and new registrations

### **Monthly KITMED Reviews**
- [ ] Update dependencies: `npm audit` and fix issues
- [ ] Review and optimize database: Analyze query performance
- [ ] Security audit: Check user permissions and access logs
- [ ] Performance optimization: Analyze response times and resource usage
- [ ] Documentation updates: Keep guides current with platform changes

---

## 📞 Support & Contact

### **Platform URLs**
- **Production**: https://kitmed.ma
- **Staging**: https://staging.kitmed.ma  
- **Admin Panel**: https://kitmed.ma/admin
- **API Documentation**: https://kitmed.ma/api-docs

### **Server Access**
- **SSH**: `ssh vps` or `ssh root@72.61.107.43`
- **Server IP**: 72.61.107.43
- **Provider**: Hostinger VPS

### **Repository**
- **GitHub**: https://github.com/stntr660/kitmed
- **Branches**: main (production), staging (testing), dev (development)

### **Monitoring Files**
- **Health Logs**: `/var/log/kitmed_backup.log`
- **Performance Logs**: `/var/log/kitmed_performance.log`  
- **Backup Location**: `/root/backups/kitmed/`

---

**🏥 KITMED Platform - Your Medical Equipment Wholesale Solution**  
**📅 Last updated: November 17, 2025**  
**🔄 Keep this documentation updated with platform changes**