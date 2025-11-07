# KITMED Deployment Guide

## Table of Contents
1. [Deployment Overview](#deployment-overview)
2. [Environment Setup](#environment-setup)
3. [Database Deployment](#database-deployment)
4. [Application Deployment](#application-deployment)
5. [Infrastructure as Code](#infrastructure-as-code)
6. [CI/CD Pipeline](#cicd-pipeline)
7. [Production Monitoring](#production-monitoring)
8. [Backup & Recovery](#backup--recovery)
9. [Scaling Strategies](#scaling-strategies)
10. [Troubleshooting](#troubleshooting)

## Deployment Overview

### Deployment Phases

#### Phase 1: MVP Deployment (0-1K users)
- **Platform**: Vercel + Neon/PlanetScale
- **Features**: Core functionality, basic monitoring
- **Timeline**: 2-4 weeks

#### Phase 2: Growth Deployment (1K-10K users)
- **Platform**: AWS/GCP with managed services
- **Features**: Enhanced monitoring, CDN, caching
- **Timeline**: 4-6 weeks

#### Phase 3: Scale Deployment (10K+ users)
- **Platform**: Kubernetes cluster with auto-scaling
- **Features**: Multi-region, advanced monitoring, disaster recovery
- **Timeline**: 8-12 weeks

### Architecture Decision Matrix

| Component | Phase 1 | Phase 2 | Phase 3 |
|-----------|---------|---------|---------|
| **Hosting** | Vercel | Vercel Pro / AWS | Kubernetes |
| **Database** | Neon/PlanetScale | AWS RDS | RDS + Read Replicas |
| **Cache** | Next.js Cache | Redis Cloud | Redis Cluster |
| **Storage** | Vercel Blob | AWS S3 | S3 + CloudFront |
| **Monitoring** | Vercel Analytics | Sentry + DataDog | Full observability stack |

## Environment Setup

### Production Environment Variables

#### Core Configuration
```bash
# .env.production
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://kitmed.com
NEXT_PUBLIC_API_URL=https://api.kitmed.com

# Database
DATABASE_URL="postgresql://user:password@db.kitmed.com:5432/kitmed_prod"
DIRECT_URL="postgresql://user:password@db.kitmed.com:5432/kitmed_prod"
DATABASE_POOL_SIZE=20

# Authentication
NEXTAUTH_SECRET="prod-secret-key-here"
NEXTAUTH_URL="https://kitmed.com"
JWT_SECRET="jwt-secret-key-here"

# Encryption
ENCRYPTION_KEY="64-character-hex-key-for-aes-256-encryption"

# File Storage
AWS_ACCESS_KEY_ID="AKIA..."
AWS_SECRET_ACCESS_KEY="secret..."
AWS_REGION="us-east-1"
S3_BUCKET="kitmed-prod-assets"
CLOUDFRONT_URL="https://cdn.kitmed.com"

# External Services
RESEND_API_KEY="re_..."
UPLOADTHING_SECRET="sk_..."

# Monitoring
SENTRY_DSN="https://...@sentry.io/..."
SENTRY_ORG="kitmed"
SENTRY_PROJECT="kitmed-frontend"

# Feature Flags
FEATURE_ADVANCED_SEARCH=true
FEATURE_REAL_TIME_CHAT=false
FEATURE_AR_VIEWER=false
```

#### Security Configuration
```bash
# Security & Compliance
SECURITY_HEADERS_ENABLED=true
CSRF_SECRET="csrf-secret-key"
CORS_ALLOWED_ORIGINS="https://kitmed.com,https://admin.kitmed.com"

# Rate Limiting
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."
RATE_LIMIT_PUBLIC=100
RATE_LIMIT_ADMIN=500

# Audit & Compliance
AUDIT_LOG_RETENTION_DAYS=2555  # 7 years for medical compliance
GDPR_COMPLIANCE_MODE=true
```

### Environment Validation
```typescript
// lib/config/env.ts
import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']),
  DATABASE_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(32),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  SENTRY_DSN: z.string().url().optional(),
})

export const env = envSchema.parse(process.env)
```

## Database Deployment

### Phase 1: Managed Database (Neon/PlanetScale)

#### Neon Setup
```bash
# Install Neon CLI
npm install -g @neondatabase/cli

# Create production database
neon branches create --database-name kitmed_prod

# Configure connection pooling
neon pools create --database kitmed_prod --role owner --pool-size 20
```

#### Database Migration Strategy
```bash
# Production deployment script
#!/bin/bash
set -e

echo "🚀 Deploying database migrations..."

# Backup current database
pg_dump $DATABASE_URL > "backup-$(date +%Y%m%d-%H%M%S).sql"

# Run migrations
npx prisma migrate deploy

# Verify migration success
npx prisma db pull --print

echo "✅ Database deployment complete"
```

### Phase 2: AWS RDS Setup

#### RDS Configuration
```yaml
# terraform/rds.tf
resource "aws_db_instance" "kitmed_prod" {
  identifier = "kitmed-prod"
  engine     = "postgres"
  engine_version = "15.4"
  
  instance_class = "db.t3.medium"
  allocated_storage = 100
  max_allocated_storage = 1000
  storage_type = "gp3"
  storage_encrypted = true
  
  db_name  = "kitmed_prod"
  username = var.db_username
  password = var.db_password
  
  # High Availability
  multi_az = true
  
  # Backups
  backup_retention_period = 30
  backup_window = "03:00-04:00"
  maintenance_window = "sun:04:00-sun:05:00"
  
  # Security
  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name = aws_db_subnet_group.main.name
  
  # Monitoring
  monitoring_interval = 60
  monitoring_role_arn = aws_iam_role.rds_enhanced_monitoring.arn
  
  # Performance Insights
  performance_insights_enabled = true
  performance_insights_retention_period = 7
  
  tags = {
    Name = "KITMED Production Database"
    Environment = "production"
  }
}

# Read Replicas
resource "aws_db_instance" "kitmed_read_replica" {
  count = 2
  
  identifier = "kitmed-read-replica-${count.index + 1}"
  replicate_source_db = aws_db_instance.kitmed_prod.identifier
  
  instance_class = "db.t3.medium"
  
  # Different AZ for redundancy
  availability_zone = data.aws_availability_zones.available.names[count.index]
  
  tags = {
    Name = "KITMED Read Replica ${count.index + 1}"
    Environment = "production"
  }
}
```

### Database Security
```sql
-- Create application-specific user
CREATE USER kitmed_app WITH PASSWORD 'secure_app_password';

-- Grant minimal required permissions
GRANT CONNECT ON DATABASE kitmed_prod TO kitmed_app;
GRANT USAGE ON SCHEMA public TO kitmed_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO kitmed_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO kitmed_app;

-- Create read-only user for analytics
CREATE USER kitmed_readonly WITH PASSWORD 'secure_readonly_password';
GRANT CONNECT ON DATABASE kitmed_prod TO kitmed_readonly;
GRANT USAGE ON SCHEMA public TO kitmed_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO kitmed_readonly;
```

## Application Deployment

### Phase 1: Vercel Deployment

#### Vercel Configuration
```json
// vercel.json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "env": {
    "DATABASE_URL": "@database-url",
    "NEXTAUTH_SECRET": "@nextauth-secret",
    "ENCRYPTION_KEY": "@encryption-key"
  },
  "regions": ["iad1", "fra1"],
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "crons": [
    {
      "path": "/api/cron/cleanup-sessions",
      "schedule": "0 2 * * *"
    },
    {
      "path": "/api/cron/generate-sitemap",
      "schedule": "0 6 * * *"
    }
  ]
}
```

#### Deployment Script
```bash
#!/bin/bash
# scripts/deploy-vercel.sh
set -e

echo "🚀 Starting Vercel deployment..."

# Run pre-deployment checks
npm run type-check
npm run lint
npm run test

# Build and deploy
vercel --prod

# Run post-deployment verification
npm run test:e2e:production

echo "✅ Deployment complete!"
```

### Phase 2: AWS ECS Deployment

#### Docker Configuration
```dockerfile
# Dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --only=production

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build application
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

#### ECS Task Definition
```json
{
  "family": "kitmed-app",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "executionRoleArn": "arn:aws:iam::account:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::account:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "kitmed-app",
      "image": "your-registry/kitmed:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:kitmed/database-url"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/kitmed-app",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:3000/api/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3
      }
    }
  ]
}
```

### Phase 3: Kubernetes Deployment

#### Kubernetes Manifests
```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: kitmed-app
  labels:
    app: kitmed
spec:
  replicas: 3
  selector:
    matchLabels:
      app: kitmed
  template:
    metadata:
      labels:
        app: kitmed
    spec:
      containers:
      - name: kitmed-app
        image: your-registry/kitmed:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: kitmed-secrets
              key: database-url
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "2Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/health/ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: kitmed-service
spec:
  selector:
    app: kitmed
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: ClusterIP
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: kitmed-ingress
  annotations:
    kubernetes.io/ingress.class: "nginx"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
spec:
  tls:
  - hosts:
    - kitmed.com
    secretName: kitmed-tls
  rules:
  - host: kitmed.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: kitmed-service
            port:
              number: 80
```

## Infrastructure as Code

### Terraform Configuration

#### Main Infrastructure
```hcl
# terraform/main.tf
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  
  backend "s3" {
    bucket = "kitmed-terraform-state"
    key    = "production/terraform.tfstate"
    region = "us-east-1"
  }
}

provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Project     = "KITMED"
      Environment = "production"
      ManagedBy   = "terraform"
    }
  }
}

# VPC
module "vpc" {
  source = "terraform-aws-modules/vpc/aws"
  
  name = "kitmed-vpc"
  cidr = "10.0.0.0/16"
  
  azs             = ["us-east-1a", "us-east-1b", "us-east-1c"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]
  
  enable_nat_gateway = true
  enable_vpn_gateway = false
  
  enable_dns_hostnames = true
  enable_dns_support   = true
}

# Application Load Balancer
resource "aws_lb" "kitmed_alb" {
  name               = "kitmed-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets           = module.vpc.public_subnets
  
  enable_deletion_protection = true
  
  access_logs {
    bucket  = aws_s3_bucket.alb_logs.bucket
    prefix  = "alb"
    enabled = true
  }
}

# ECS Cluster
resource "aws_ecs_cluster" "kitmed" {
  name = "kitmed-cluster"
  
  capacity_providers = ["FARGATE", "FARGATE_SPOT"]
  
  default_capacity_provider_strategy {
    capacity_provider = "FARGATE"
    weight           = 1
  }
  
  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

# Auto Scaling
resource "aws_appautoscaling_target" "ecs_target" {
  max_capacity       = 10
  min_capacity       = 2
  resource_id        = "service/kitmed-cluster/kitmed-app"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "scale_up" {
  name               = "scale-up"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs_target.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs_target.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs_target.service_namespace
  
  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value = 70.0
  }
}
```

#### CDN Configuration
```hcl
# terraform/cloudfront.tf
resource "aws_cloudfront_distribution" "kitmed_cdn" {
  origin {
    domain_name = aws_lb.kitmed_alb.dns_name
    origin_id   = "ALB-kitmed"
    
    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }
  
  # S3 origin for static assets
  origin {
    domain_name = aws_s3_bucket.assets.bucket_regional_domain_name
    origin_id   = "S3-kitmed-assets"
    
    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.assets.cloudfront_access_identity_path
    }
  }
  
  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  
  aliases = ["kitmed.com", "www.kitmed.com"]
  
  default_cache_behavior {
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "ALB-kitmed"
    compress               = true
    viewer_protocol_policy = "redirect-to-https"
    
    forwarded_values {
      query_string = true
      headers      = ["Host", "Authorization"]
      
      cookies {
        forward = "none"
      }
    }
    
    min_ttl     = 0
    default_ttl = 86400
    max_ttl     = 31536000
  }
  
  # Cache behavior for static assets
  ordered_cache_behavior {
    path_pattern     = "/assets/*"
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-kitmed-assets"
    compress         = true
    
    viewer_protocol_policy = "redirect-to-https"
    
    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }
    
    min_ttl     = 31536000
    default_ttl = 31536000
    max_ttl     = 31536000
  }
  
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }
  
  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate.kitmed.arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }
  
  web_acl_id = aws_wafv2_web_acl.kitmed.arn
}
```

## CI/CD Pipeline

### GitHub Actions Workflow
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]
  workflow_dispatch:

env:
  AWS_REGION: us-east-1
  ECR_REPOSITORY: kitmed
  ECS_SERVICE: kitmed-app
  ECS_CLUSTER: kitmed-cluster
  ECS_TASK_DEFINITION: .aws/task-definition.json

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Type check
        run: npm run type-check
      
      - name: Lint
        run: npm run lint
      
      - name: Unit tests
        run: npm run test
      
      - name: E2E tests
        run: npm run test:e2e

  security:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          format: 'sarif'
          output: 'trivy-results.sarif'
      
      - name: Upload Trivy scan results
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'

  build-and-deploy:
    needs: [test, security]
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}
      
      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2
      
      - name: Build, tag, and push image to Amazon ECR
        id: build-image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
          echo "image=$ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG" >> $GITHUB_OUTPUT
      
      - name: Fill in the new image ID in the Amazon ECS task definition
        id: task-def
        uses: aws-actions/amazon-ecs-render-task-definition@v1
        with:
          task-definition: ${{ env.ECS_TASK_DEFINITION }}
          container-name: kitmed-app
          image: ${{ steps.build-image.outputs.image }}
      
      - name: Deploy Amazon ECS task definition
        uses: aws-actions/amazon-ecs-deploy-task-definition@v1
        with:
          task-definition: ${{ steps.task-def.outputs.task-definition }}
          service: ${{ env.ECS_SERVICE }}
          cluster: ${{ env.ECS_CLUSTER }}
          wait-for-service-stability: true
      
      - name: Run database migrations
        run: |
          npx prisma migrate deploy
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
      
      - name: Invalidate CloudFront cache
        run: |
          aws cloudfront create-invalidation \
            --distribution-id ${{ secrets.CLOUDFRONT_DISTRIBUTION_ID }} \
            --paths "/*"
      
      - name: Notify Slack
        if: always()
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          channel: '#deployments'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### Database Migration Pipeline
```yaml
# .github/workflows/db-migration.yml
name: Database Migration

on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'Target environment'
        required: true
        default: 'staging'
        type: choice
        options:
          - staging
          - production

jobs:
  migrate:
    runs-on: ubuntu-latest
    environment: ${{ github.event.inputs.environment }}
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Create database backup
        run: |
          pg_dump ${{ secrets.DATABASE_URL }} > backup-$(date +%Y%m%d-%H%M%S).sql
          aws s3 cp backup-*.sql s3://kitmed-backups/migrations/
      
      - name: Run migrations
        run: npx prisma migrate deploy
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
      
      - name: Verify migration
        run: npx prisma db pull --print
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

## Production Monitoring

### Health Check Endpoints
```typescript
// app/api/health/route.ts
import { NextResponse } from 'next/server'
import { db } from '@/lib/database'

export async function GET() {
  try {
    // Check database connectivity
    await db.$queryRaw`SELECT 1`
    
    // Check external services
    const checks = {
      database: 'healthy',
      memory: process.memoryUsage(),
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    }
    
    return NextResponse.json({
      status: 'healthy',
      checks
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error.message
      },
      { status: 503 }
    )
  }
}
```

### Monitoring Stack
```yaml
# docker-compose.monitoring.yml
version: '3.8'
services:
  prometheus:
    image: prom/prometheus:latest
    container_name: prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--storage.tsdb.retention.time=200h'
      - '--web.enable-lifecycle'

  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana_data:/var/lib/grafana
      - ./monitoring/grafana/provisioning:/etc/grafana/provisioning

  node-exporter:
    image: prom/node-exporter:latest
    container_name: node-exporter
    ports:
      - "9100:9100"

volumes:
  prometheus_data:
  grafana_data:
```

### Application Metrics
```typescript
// lib/monitoring/metrics.ts
import { register, Counter, Histogram, Gauge } from 'prom-client'

// HTTP request metrics
export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.1, 0.5, 1, 2, 5]
})

export const httpRequestTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status']
})

// Business metrics
export const rfpSubmissions = new Counter({
  name: 'rfp_submissions_total',
  help: 'Total number of RFP submissions'
})

export const productViews = new Counter({
  name: 'product_views_total',
  help: 'Total number of product views',
  labelNames: ['category']
})

export const activeUsers = new Gauge({
  name: 'active_users',
  help: 'Number of active users'
})

// Database metrics
export const dbConnectionPool = new Gauge({
  name: 'db_connection_pool_size',
  help: 'Current database connection pool size'
})

export const dbQueryDuration = new Histogram({
  name: 'db_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2]
})

register.registerMetric(httpRequestDuration)
register.registerMetric(httpRequestTotal)
register.registerMetric(rfpSubmissions)
register.registerMetric(productViews)
register.registerMetric(activeUsers)
register.registerMetric(dbConnectionPool)
register.registerMetric(dbQueryDuration)
```

## Backup & Recovery

### Automated Backup Strategy
```bash
#!/bin/bash
# scripts/backup-database.sh

set -e

BACKUP_DIR="/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_NAME="kitmed_prod"
RETENTION_DAYS=30

echo "Starting database backup..."

# Create backup
pg_dump $DATABASE_URL > "$BACKUP_DIR/kitmed_backup_$TIMESTAMP.sql"

# Compress backup
gzip "$BACKUP_DIR/kitmed_backup_$TIMESTAMP.sql"

# Upload to S3
aws s3 cp "$BACKUP_DIR/kitmed_backup_$TIMESTAMP.sql.gz" \
  "s3://kitmed-backups/database/" \
  --storage-class STANDARD_IA

# Clean up local files older than retention period
find $BACKUP_DIR -name "kitmed_backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete

# Verify backup integrity
echo "Verifying backup integrity..."
gunzip -t "$BACKUP_DIR/kitmed_backup_$TIMESTAMP.sql.gz"

echo "Backup completed successfully: kitmed_backup_$TIMESTAMP.sql.gz"
```

### Disaster Recovery Plan
```bash
#!/bin/bash
# scripts/disaster-recovery.sh

set -e

BACKUP_S3_LOCATION="s3://kitmed-backups/database/"
RECOVERY_DB_URL="postgresql://user:pass@recovery-db:5432/kitmed_recovery"

echo "🚨 Starting disaster recovery procedure..."

# 1. Download latest backup from S3
echo "📥 Downloading latest backup..."
aws s3 sync $BACKUP_S3_LOCATION ./recovery/ --exclude "*" --include "kitmed_backup_*.sql.gz"

# Get most recent backup
LATEST_BACKUP=$(ls -t ./recovery/kitmed_backup_*.sql.gz | head -n1)
echo "Using backup: $LATEST_BACKUP"

# 2. Restore database
echo "🗄️ Restoring database..."
gunzip -c "$LATEST_BACKUP" | psql $RECOVERY_DB_URL

# 3. Verify data integrity
echo "✅ Verifying data integrity..."
psql $RECOVERY_DB_URL -c "
  SELECT 
    (SELECT COUNT(*) FROM products) as product_count,
    (SELECT COUNT(*) FROM categories) as category_count,
    (SELECT COUNT(*) FROM rfps) as rfp_count;
"

# 4. Update DNS to point to recovery instance
echo "🌐 Updating DNS records..."
aws route53 change-resource-record-sets \
  --hosted-zone-id $HOSTED_ZONE_ID \
  --change-batch file://./recovery/dns-failover.json

echo "✅ Disaster recovery completed successfully!"
```

## Scaling Strategies

### Horizontal Scaling Configuration
```yaml
# k8s/hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: kitmed-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: kitmed-app
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 50
        periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
      - type: Percent
        value: 100
        periodSeconds: 15
```

### Database Read Replicas
```typescript
// lib/database/read-replica.ts
import { PrismaClient } from '@prisma/client'

class DatabaseManager {
  private writeClient: PrismaClient
  private readClients: PrismaClient[]
  private currentReadIndex = 0

  constructor() {
    this.writeClient = new PrismaClient({
      datasources: {
        db: { url: process.env.DATABASE_WRITE_URL }
      }
    })

    this.readClients = [
      new PrismaClient({
        datasources: {
          db: { url: process.env.DATABASE_READ_URL_1 }
        }
      }),
      new PrismaClient({
        datasources: {
          db: { url: process.env.DATABASE_READ_URL_2 }
        }
      }),
    ]
  }

  getWriteClient(): PrismaClient {
    return this.writeClient
  }

  getReadClient(): PrismaClient {
    // Round-robin load balancing
    const client = this.readClients[this.currentReadIndex]
    this.currentReadIndex = (this.currentReadIndex + 1) % this.readClients.length
    return client
  }
}

export const db = new DatabaseManager()
```

## Troubleshooting

### Common Deployment Issues

#### Issue: Database Migration Failures
```bash
# Solution: Manual migration rollback
echo "Rolling back last migration..."

# Get migration history
npx prisma migrate status

# Reset to specific migration
npx prisma migrate reset --skip-seed

# Apply migrations up to working point
npx prisma migrate deploy
```

#### Issue: Memory Leaks in Production
```typescript
// Solution: Memory monitoring and cleanup
import { performance, PerformanceObserver } from 'perf_hooks'

const memoryMonitor = new PerformanceObserver((list) => {
  const entries = list.getEntries()
  entries.forEach((entry) => {
    if (entry.name === 'memory-usage') {
      console.log('Memory usage:', entry.detail)
      
      // Alert if memory usage is high
      const memoryUsage = process.memoryUsage()
      if (memoryUsage.heapUsed > 1024 * 1024 * 1024) { // 1GB
        console.error('High memory usage detected:', memoryUsage)
      }
    }
  })
})

memoryMonitor.observe({ entryTypes: ['measure'] })

// Monitor memory every 30 seconds
setInterval(() => {
  const memoryUsage = process.memoryUsage()
  performance.mark('memory-check')
  performance.measure('memory-usage', 'memory-check')
}, 30000)
```

#### Issue: SSL Certificate Problems
```bash
# Solution: Certificate renewal
# For Let's Encrypt with cert-manager
kubectl get certificates
kubectl describe certificate kitmed-tls

# Force renewal
kubectl delete certificate kitmed-tls
kubectl apply -f k8s/certificate.yaml
```

### Performance Troubleshooting
```typescript
// lib/monitoring/performance.ts
export class PerformanceMonitor {
  static measureApiResponse(apiName: string, duration: number) {
    if (duration > 1000) {
      console.warn(`Slow API response: ${apiName} took ${duration}ms`)
    }
    
    // Record metric
    httpRequestDuration.observe(
      { route: apiName },
      duration / 1000
    )
  }
  
  static measureDatabaseQuery(query: string, duration: number) {
    if (duration > 500) {
      console.warn(`Slow database query: ${query} took ${duration}ms`)
    }
    
    dbQueryDuration.observe(
      { operation: query },
      duration / 1000
    )
  }
}
```

This deployment guide provides comprehensive instructions for deploying and maintaining the KITMED platform across different environments and scales. Each phase is designed to grow with your user base while maintaining security, performance, and reliability standards.