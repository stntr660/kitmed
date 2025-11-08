# KITMED Deployment and Scaling Strategy

## Deployment Architecture

### Phase 1: MVP Deployment (0-1K users)
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Vercel        │    │   Neon/PlanetScale│    │   Vercel Blob   │
│   (Next.js App) │────│   (PostgreSQL)    │    │   (File Storage)│
│   - Edge Network│    │   - Auto-scaling  │    │   - CDN         │
│   - SSR/SSG     │    │   - Backups       │    │   - Global Edge │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Phase 2: Growth Deployment (1K-10K users)
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Vercel Pro    │    │   AWS RDS        │    │   AWS S3        │
│   - Multiple    │    │   - Read Replicas│    │   - CloudFront  │
│     Regions     │    │   - Connection   │    │   - Multi-region│
│   - Edge Cache  │    │     Pooling      │    │   - Versioning  │
│   - Analytics   │    └──────────────────┘    └─────────────────┘
└─────────────────┘              │
         │                       │
         │              ┌──────────────────┐
         └──────────────│   Redis          │
                        │   - Session      │
                        │   - Cache        │
                        │   - Rate Limiting│
                        └──────────────────┘
```

### Phase 3: Scale Deployment (10K+ users)
```
┌─────────────────────────────────────────────────────────────┐
│                    Load Balancer (AWS ALB)                  │
└─────────────────────┬───────────────────┬───────────────────┘
┌─────────────────────┴─┐  ┌─────────────────┴─┐  ┌─────────────┴─┐
│   Docker Containers   │  │   Docker Containers│  │   CDN Edge    │
│   - Next.js App      │  │   - API Services   │  │   - Static    │
│   - Auto-scaling     │  │   - Background Jobs│  │     Assets    │
│   - Health Checks    │  │   - File Processing│  │   - Images    │
└───────────────────────┘  └─────────────────────┘  └───────────────┘
         │                           │                        
┌─────────────────────┐  ┌─────────────────────┐          
│   Primary DB        │  │   Read Replicas     │          
│   - Master Write    │  │   - Regional        │          
│   - Automated       │  │   - Load Balanced   │          
│     Backups         │  │   - Failover        │          
└─────────────────────┘  └─────────────────────┘          
```

## Scaling Strategies

### Database Scaling

#### Vertical Scaling (Phase 1-2)
```typescript
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
  previewFeatures = ["tracing"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_URL") // For migrations
}
```

#### Horizontal Scaling (Phase 3)
```typescript
// lib/database.ts
import { PrismaClient } from '@prisma/client'

class DatabaseManager {
  private writeClient: PrismaClient
  private readClients: PrismaClient[]
  
  constructor() {
    this.writeClient = new PrismaClient({
      datasources: { db: { url: process.env.WRITE_DATABASE_URL } }
    })
    
    this.readClients = [
      new PrismaClient({
        datasources: { db: { url: process.env.READ_DATABASE_URL_1 } }
      }),
      new PrismaClient({
        datasources: { db: { url: process.env.READ_DATABASE_URL_2 } }
      })
    ]
  }
  
  getWriteClient() {
    return this.writeClient
  }
  
  getReadClient() {
    // Round-robin or health-based selection
    return this.readClients[Math.floor(Math.random() * this.readClients.length)]
  }
}

export const db = new DatabaseManager()
```

### Caching Strategy

#### Level 1: Next.js Built-in Caching
```typescript
// app/products/[discipline]/page.tsx
export const revalidate = 3600 // 1 hour

export async function generateStaticParams() {
  const disciplines = await getDisciplines()
  return disciplines.map((discipline) => ({
    discipline: discipline.slug,
  }))
}

// Incremental Static Regeneration
export default async function DisciplinePage({ params }) {
  const products = await getProductsByDiscipline(params.discipline)
  return <ProductGrid products={products} />
}
```

#### Level 2: Redis Caching
```typescript
// lib/cache.ts
import Redis from 'ioredis'

const redis = new Redis(process.env.REDIS_URL)

export class CacheService {
  async get<T>(key: string): Promise<T | null> {
    const cached = await redis.get(key)
    return cached ? JSON.parse(cached) : null
  }
  
  async set(key: string, value: any, ttl: number = 3600) {
    await redis.setex(key, ttl, JSON.stringify(value))
  }
  
  async invalidate(pattern: string) {
    const keys = await redis.keys(pattern)
    if (keys.length > 0) {
      await redis.del(...keys)
    }
  }
}

// Usage in services
export class ProductService {
  private cache = new CacheService()
  
  async getProduct(sku: string) {
    const cacheKey = `product:${sku}`
    let product = await this.cache.get(cacheKey)
    
    if (!product) {
      product = await this.repository.findBySku(sku)
      await this.cache.set(cacheKey, product, 3600)
    }
    
    return product
  }
  
  async updateProduct(sku: string, data: any) {
    const product = await this.repository.update(sku, data)
    await this.cache.invalidate(`product:${sku}`)
    await this.cache.invalidate('products:*')
    return product
  }
}
```

### File Storage Scaling

#### Phase 1: Vercel Blob
```typescript
// lib/storage.ts
import { put, del } from '@vercel/blob'

export class StorageService {
  async uploadFile(file: File, path: string) {
    const blob = await put(path, file, {
      access: 'public',
      addRandomSuffix: true,
    })
    return blob.url
  }
  
  async deleteFile(url: string) {
    await del(url)
  }
}
```

#### Phase 2-3: AWS S3 with CloudFront
```typescript
// lib/storage.ts
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3"

export class S3StorageService {
  private s3: S3Client
  private bucket: string
  private cloudFrontUrl: string
  
  constructor() {
    this.s3 = new S3Client({ region: process.env.AWS_REGION })
    this.bucket = process.env.S3_BUCKET!
    this.cloudFrontUrl = process.env.CLOUDFRONT_URL!
  }
  
  async uploadFile(file: File, path: string) {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: path,
      Body: Buffer.from(await file.arrayBuffer()),
      ContentType: file.type,
    })
    
    await this.s3.send(command)
    return `${this.cloudFrontUrl}/${path}`
  }
  
  async deleteFile(path: string) {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: path,
    })
    
    await this.s3.send(command)
  }
}
```

## Monitoring and Observability

### Application Monitoring
```typescript
// lib/monitoring.ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
})

// Performance monitoring
export function trackPageView(page: string) {
  if (typeof window !== 'undefined') {
    // Track with Vercel Analytics
    window.va?.track('page_view', { page })
  }
}

export function trackRFPSubmission(rfpId: string) {
  Sentry.addBreadcrumb({
    message: 'RFP submitted',
    category: 'user_action',
    data: { rfpId },
  })
}
```

### Database Monitoring
```typescript
// lib/database.ts
import { PrismaClient } from '@prisma/client'

export const db = new PrismaClient({
  log: [
    { level: 'query', emit: 'event' },
    { level: 'error', emit: 'stdout' },
    { level: 'warn', emit: 'stdout' },
  ],
})

// Monitor slow queries
db.$on('query', (e) => {
  if (e.duration > 1000) { // Queries taking more than 1s
    console.warn('Slow query detected:', {
      query: e.query,
      duration: e.duration,
      params: e.params,
    })
  }
})
```

## Multi-tenancy Preparation

### Database Design for Multi-tenancy
```sql
-- Add tenant support to core tables
ALTER TABLE disciplines ADD COLUMN tenant_id VARCHAR(50) DEFAULT 'kitmed';
ALTER TABLE categories ADD COLUMN tenant_id VARCHAR(50) DEFAULT 'kitmed';
ALTER TABLE products ADD COLUMN tenant_id VARCHAR(50) DEFAULT 'kitmed';
ALTER TABLE companies ADD COLUMN tenant_id VARCHAR(50) DEFAULT 'kitmed';
ALTER TABLE rfps ADD COLUMN tenant_id VARCHAR(50) DEFAULT 'kitmed';

-- Create tenant management
CREATE TABLE tenants (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255) UNIQUE,
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Update indexes for tenant-aware queries
CREATE INDEX idx_products_tenant_category ON products(tenant_id, category_id);
CREATE INDEX idx_rfps_tenant_status ON rfps(tenant_id, status);
```

### Application-level Tenant Isolation
```typescript
// lib/tenant.ts
export class TenantService {
  static getTenantFromDomain(domain: string): string {
    // Extract tenant from subdomain: tenant.kitmed.com
    const subdomain = domain.split('.')[0]
    return subdomain === 'www' ? 'kitmed' : subdomain
  }
  
  static getTenantFromHeaders(headers: Headers): string {
    const host = headers.get('host') || ''
    return this.getTenantFromDomain(host)
  }
}

// middleware.ts
export function middleware(request: NextRequest) {
  const tenant = TenantService.getTenantFromHeaders(request.headers)
  
  // Add tenant to request headers
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-tenant-id', tenant)
  
  return NextResponse.next({
    request: { headers: requestHeaders }
  })
}
```

## Disaster Recovery

### Backup Strategy
```yaml
# AWS RDS automated backups
BackupRetentionPeriod: 30 # days
BackupWindow: "03:00-04:00" # UTC
PreferredMaintenanceWindow: "sun:04:00-sun:05:00"

# Point-in-time recovery
PointInTimeRecoveryEnabled: true

# Cross-region backup replication
DestinationRegion: "us-west-2"
KmsKeyId: "arn:aws:kms:us-west-2:123456789012:key/..."
```

### File Storage Backup
```typescript
// scripts/backup-files.ts
import { S3Client, ListObjectsV2Command, CopyObjectCommand } from "@aws-sdk/client-s3"

export async function backupToSecondaryRegion() {
  const sourceS3 = new S3Client({ region: 'us-east-1' })
  const targetS3 = new S3Client({ region: 'us-west-2' })
  
  // List and copy all objects
  const listCommand = new ListObjectsV2Command({
    Bucket: process.env.S3_BUCKET,
  })
  
  const objects = await sourceS3.send(listCommand)
  
  for (const object of objects.Contents || []) {
    const copyCommand = new CopyObjectCommand({
      Bucket: process.env.S3_BACKUP_BUCKET,
      Key: object.Key,
      CopySource: `${process.env.S3_BUCKET}/${object.Key}`,
    })
    
    await targetS3.send(copyCommand)
  }
}
```