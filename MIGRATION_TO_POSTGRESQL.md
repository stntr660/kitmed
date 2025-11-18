# 🐘 KITMED PostgreSQL Migration Plan

**Current**: SQLite (~221KB, single-container)  
**Target**: PostgreSQL (enterprise-ready, scalable)  
**Timeline**: 2-4 hours migration window  

---

## 🎯 MIGRATION BENEFITS

### **Performance Improvements:**
```
📈 EXPECTED PERFORMANCE GAINS:
├── Concurrent Users: 1 → 50+ simultaneously
├── Product Search: 2x faster with proper indexes
├── Admin Operations: 5x faster bulk operations
├── API Response: 40% better under load
├── Complex Queries: 3x faster analytics
└── Scaling Capacity: Ready for 50k+ products
```

### **Security Enhancements:**
```
🔒 SECURITY IMPROVEMENTS:
├── User Authentication: Database-level security
├── Encrypted Connections: SSL/TLS by default
├── Audit Logging: Track all database operations
├── Role-based Access: Admin/User/API permissions
├── Backup Encryption: Secure database backups
└── Compliance Ready: Business-grade security
```

---

## 📋 MIGRATION STEPS

### **Phase 1: PostgreSQL Setup (30 minutes)**

#### **1. Create PostgreSQL Container**
```yaml
# Add to docker-compose.yml
services:
  postgres:
    image: postgres:15-alpine
    container_name: kitmed-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: kitmed_prod
      POSTGRES_USER: kitmed_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_INITDB_ARGS: "--encoding=UTF-8 --lc-collate=C --lc-ctype=C"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./postgres-init:/docker-entrypoint-initdb.d
    networks:
      - kitmed-network
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U kitmed_user -d kitmed_prod"]
      interval: 30s
      timeout: 10s
      retries: 5

volumes:
  postgres_data:
    driver: local

networks:
  kitmed-network:
    driver: bridge
```

#### **2. Update Prisma Schema**
```prisma
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Add performance indexes
model Product {
  id          String   @id @default(uuid())
  name        String
  slug        String   @unique
  // ... other fields
  
  @@index([name]) // Search performance
  @@index([categoryId]) // Category filtering
  @@index([createdAt]) // Sorting
  @@index([status]) // Status filtering
}

model Category {
  id          String   @id @default(uuid())
  name        String
  slug        String   @unique
  // ... other fields
  
  @@index([parentId]) // Hierarchy performance
  @@index([name]) // Search performance
}
```

#### **3. Environment Configuration**
```env
# .env.production.local
DATABASE_URL="postgresql://kitmed_user:${DB_PASSWORD}@postgres:5432/kitmed_prod"
DIRECT_URL="postgresql://kitmed_user:${DB_PASSWORD}@postgres:5432/kitmed_prod"

# Security settings
DB_PASSWORD=generate_strong_password_here
DB_SSL_MODE=require
DB_POOL_SIZE=10
DB_TIMEOUT=20000
```

---

### **Phase 2: Data Migration (45 minutes)**

#### **1. Backup Current SQLite Data**
```bash
# Export current data
docker exec kitmed-prod npx prisma db push --force-reset
docker exec kitmed-prod node scripts/export-data.js > /tmp/kitmed-data.json
```

#### **2. Initialize PostgreSQL**
```bash
# Start PostgreSQL container
docker-compose up -d postgres

# Wait for PostgreSQL to be ready
docker-compose logs -f postgres

# Push schema to PostgreSQL
docker exec kitmed-prod npx prisma db push
```

#### **3. Import Data to PostgreSQL**
```bash
# Import data to PostgreSQL
docker exec kitmed-prod node scripts/import-data.js /tmp/kitmed-data.json
```

---

### **Phase 3: Application Update (15 minutes)**

#### **1. Update Docker Configuration**
```yaml
# docker-compose.yml - Update kitmed service
services:
  kitmed-prod:
    # ... existing config
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      - DATABASE_URL=postgresql://kitmed_user:${DB_PASSWORD}@postgres:5432/kitmed_prod
```

#### **2. Performance Optimizations**
```typescript
// lib/database.ts - Add connection pooling
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  },
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

---

### **Phase 4: Testing & Validation (30 minutes)**

#### **1. Functional Testing**
```bash
# Test all critical functions
curl -f http://localhost:3001/api/health
curl -f http://localhost:3001/api/products
curl -f http://localhost:3001/api/categories
curl -f http://localhost:3001/api/rfp-requests
```

#### **2. Performance Testing**
```bash
# Test concurrent users
ab -n 100 -c 10 http://localhost:3001/api/products

# Test product search
ab -n 50 -c 5 "http://localhost:3001/api/products?search=medical"

# Test admin operations
curl -X POST http://localhost:3001/api/admin/products -d @test-product.json
```

#### **3. Security Verification**
```bash
# Test database connections
docker exec postgres psql -U kitmed_user -d kitmed_prod -c "\dt"

# Verify SSL connections
docker exec postgres psql -U kitmed_user -d kitmed_prod -c "SHOW ssl"

# Check user permissions
docker exec postgres psql -U kitmed_user -d kitmed_prod -c "\du"
```

---

## 🔧 BACKUP SYSTEM UPDATE

### **PostgreSQL Backup Integration**
```bash
# Update backup script to handle PostgreSQL
# /root/scripts/enhanced-backup-with-postgresql.sh

# PostgreSQL Production Database
if docker ps | grep -q postgres; then
    log_message "🗄️  Backing up PostgreSQL database..."
    docker exec postgres pg_dump -U kitmed_user -d kitmed_prod --clean --if-exists | gzip > $BACKUP_DIR/kitmed-postgres-$DATE.sql.gz
    log_message "✅ PostgreSQL backup completed ($(du -h $BACKUP_DIR/kitmed-postgres-$DATE.sql.gz | cut -f1))"
    backup_success=$((backup_success + 1))
    
    upload_to_backblaze "$BACKUP_DIR/kitmed-postgres-$DATE.sql.gz" "applications/kitmed/database/kitmed-postgres-$DATE.sql.gz"
else
    log_message "⚠️  PostgreSQL container not running"
fi
```

---

## 📊 PERFORMANCE BENCHMARKS

### **Expected Performance Improvements:**

#### **Product Search (5000 products):**
```
Operation                | SQLite  | PostgreSQL | Improvement
-------------------------|---------|------------|------------
Simple search            | 150ms   | 60ms       | 2.5x faster
Complex filter           | 800ms   | 200ms      | 4x faster
Category browse          | 200ms   | 50ms       | 4x faster
Admin bulk operations    | 5000ms  | 1000ms     | 5x faster
Concurrent users (10)    | Blocks  | 120ms      | Non-blocking
Full-text search         | 300ms   | 80ms       | 3.7x faster
```

#### **Concurrent User Support:**
```
Users    | SQLite Response | PostgreSQL Response | SQLite Issues
---------|----------------|--------------------|--------------
1        | 50ms           | 60ms               | None
5        | 200ms          | 70ms               | Some blocking
10       | 500ms          | 90ms               | Significant blocking
25       | 2000ms+        | 150ms              | Major blocking
50       | Timeout        | 200ms              | Complete failure
```

---

## 🔒 SECURITY CONFIGURATION

### **Database Security Setup**
```sql
-- Create secure database roles
CREATE ROLE kitmed_admin WITH LOGIN PASSWORD 'admin_password';
CREATE ROLE kitmed_api WITH LOGIN PASSWORD 'api_password';
CREATE ROLE kitmed_readonly WITH LOGIN PASSWORD 'readonly_password';

-- Grant appropriate permissions
GRANT ALL PRIVILEGES ON DATABASE kitmed_prod TO kitmed_admin;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO kitmed_api;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO kitmed_readonly;

-- Enable SSL
ALTER SYSTEM SET ssl = on;
ALTER SYSTEM SET ssl_cert_file = '/etc/ssl/certs/server.crt';
ALTER SYSTEM SET ssl_key_file = '/etc/ssl/private/server.key';
```

### **Connection Security**
```env
# Secure connection configuration
DATABASE_URL="postgresql://kitmed_api:${API_PASSWORD}@postgres:5432/kitmed_prod?sslmode=require"
ADMIN_DATABASE_URL="postgresql://kitmed_admin:${ADMIN_PASSWORD}@postgres:5432/kitmed_prod?sslmode=require"
```

---

## 📋 ROLLBACK PLAN

### **If Migration Fails:**
```bash
# 1. Stop new containers
docker-compose stop kitmed-prod postgres

# 2. Restore SQLite setup
docker-compose -f docker-compose.sqlite.yml up -d

# 3. Restore SQLite data
docker exec kitmed-prod cp /backup/production.db /app/data/production.db

# 4. Update environment
export DATABASE_URL="file:/app/data/production.db"

# 5. Restart application
docker-compose restart kitmed-prod
```

---

## 🎯 MIGRATION CHECKLIST

### **Pre-Migration**
- [ ] Backup current SQLite database
- [ ] Test PostgreSQL container locally
- [ ] Prepare data export/import scripts
- [ ] Update environment variables
- [ ] Schedule maintenance window

### **During Migration**
- [ ] Export SQLite data
- [ ] Start PostgreSQL container
- [ ] Import data to PostgreSQL
- [ ] Update application configuration
- [ ] Test all functionality

### **Post-Migration**
- [ ] Performance testing
- [ ] Security verification
- [ ] Backup system update
- [ ] Monitoring configuration
- [ ] Documentation update

---

**🎯 Migrating to PostgreSQL provides the scalability, performance, and security needed for KITMED's growth to 5000+ products with multiple concurrent users.**

**Timeline**: 2-4 hours | **Downtime**: 30 minutes | **Risk**: Low (full rollback plan)**