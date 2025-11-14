# KITMED Docker Deployment Guide

## 🐳 Overview

The KITMED platform has been fully dockerized for easy deployment and development. This guide covers everything you need to know about running the application with Docker.

## 📋 Prerequisites

- Docker Desktop installed and running
- At least 4GB of available RAM
- 2GB of free disk space

## 🏗️ Architecture

The Docker setup includes:

- **Multi-stage builds** for optimized production images
- **Separate environments** for development and production
- **Persistent volumes** for data and file uploads
- **Nginx reverse proxy** for production (optional)
- **Health checks** for monitoring
- **Security hardening** with non-root user

## 🚀 Quick Start

### Development Environment

```bash
# 1. Create necessary directories
mkdir -p docker/data public/uploads

# 2. Start development environment
docker-compose -f docker-compose.dev.yml up

# 3. Access the application
# - App: http://localhost:3000
# - Database will be created automatically
```

### Production Environment

```bash
# 1. Build and run production
docker-compose up

# 2. Initialize database (first time only)
docker-compose exec kitmed-app npx prisma db push

# 3. Access the application
# - App: http://localhost:3000
```

### With Nginx Proxy (Recommended for Production)

```bash
# 1. Start with nginx proxy
docker-compose --profile production up

# 2. Access through proxy
# - App: http://localhost (port 80)
```

## 📁 File Structure

```
KITMEDAPP/
├── Dockerfile              # Production image
├── Dockerfile.dev          # Development image
├── docker-compose.yml      # Production compose
├── docker-compose.dev.yml  # Development compose
├── .dockerignore           # Ignored files
├── docker/
│   ├── data/              # Database storage
│   ├── nginx.conf         # Nginx configuration
│   └── ssl/               # SSL certificates (if needed)
├── scripts/
│   └── docker-test.sh     # Testing script
└── public/uploads/        # File uploads
```

## 🔧 Configuration

### Environment Variables

The following environment variables can be configured:

**Database:**
- `DATABASE_URL` - SQLite database path

**Authentication:**
- `NEXTAUTH_URL` - Application URL
- `NEXTAUTH_SECRET` - Secret key for NextAuth

**File Uploads:**
- `UPLOAD_DIR` - Upload directory path
- `MAX_FILE_SIZE` - Maximum file size (default: 20MB)

### Volume Mounts

**Production:**
- `kitmed_data:/app/data` - Database storage
- `kitmed_uploads:/app/uploads` - File uploads

**Development:**
- `.:/app` - Source code (hot reload)
- `./docker/data:/app/data` - Database
- `./public/uploads:/app/public/uploads` - Uploads

## 🛠️ Development Workflow

### 1. Start Development Environment

```bash
# Start with hot reload
docker-compose -f docker-compose.dev.yml up

# Start in background
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f
```

### 2. Database Operations

```bash
# Access database with Prisma Studio
docker-compose -f docker-compose.dev.yml --profile tools up prisma-studio

# Run database migrations
docker-compose -f docker-compose.dev.yml exec kitmed-dev npx prisma db push

# Reset database
docker-compose -f docker-compose.dev.yml exec kitmed-dev npx prisma db reset
```

### 3. Access Container Shell

```bash
# Development container
docker-compose -f docker-compose.dev.yml exec kitmed-dev sh

# Production container
docker-compose exec kitmed-app sh
```

## 🚀 Production Deployment

### 1. Server Setup

```bash
# Clone repository
git clone <your-repo> kitmed
cd kitmed

# Create production environment file
cp .env.example .env.production

# Edit environment variables
nano .env.production
```

### 2. Deploy Application

```bash
# Build and start
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f

# Initialize database (first time)
docker-compose exec kitmed-app npx prisma db push
```

### 3. SSL Setup (Optional)

```bash
# Create SSL directory
mkdir -p docker/ssl

# Add your SSL certificates
# - docker/ssl/fullchain.pem
# - docker/ssl/privkey.pem

# Update nginx configuration for HTTPS
# Start with SSL
docker-compose --profile production up -d
```

## 🔍 Monitoring & Troubleshooting

### Health Checks

```bash
# Check container health
docker-compose ps

# View health check logs
docker inspect kitmed-web --format='{{.State.Health}}'

# Manual health check
curl http://localhost:3000/api/health
```

### Common Issues

**Container won't start:**
```bash
# Check logs
docker-compose logs kitmed-app

# Rebuild image
docker-compose build --no-cache kitmed-app
```

**Database issues:**
```bash
# Reset database
docker-compose exec kitmed-app npx prisma db reset

# Check database file permissions
docker-compose exec kitmed-app ls -la /app/data/
```

**File upload issues:**
```bash
# Check upload directory permissions
docker-compose exec kitmed-app ls -la /app/uploads/

# Fix permissions
docker-compose exec kitmed-app chown -R nextjs:nodejs /app/uploads/
```

### Performance Tuning

**Resource Limits:**
```yaml
# Add to docker-compose.yml under kitmed-app service
deploy:
  resources:
    limits:
      memory: 1G
      cpus: '0.5'
    reservations:
      memory: 512M
      cpus: '0.25'
```

**Database Optimization:**
```bash
# Vacuum SQLite database
docker-compose exec kitmed-app sqlite3 /app/data/production.db "VACUUM;"

# Analyze database
docker-compose exec kitmed-app sqlite3 /app/data/production.db "ANALYZE;"
```

## 📊 Backup & Recovery

### Database Backup

```bash
# Backup database
docker-compose exec kitmed-app cp /app/data/production.db /app/data/backup-$(date +%Y%m%d).db

# Copy backup to host
docker cp kitmed-web:/app/data/backup-$(date +%Y%m%d).db ./
```

### Full Backup

```bash
# Backup volumes
docker run --rm -v kitmed_data:/backup-data -v kitmed_uploads:/backup-uploads -v $(pwd):/host alpine sh -c "
  tar czf /host/kitmed-backup-$(date +%Y%m%d).tar.gz /backup-data /backup-uploads
"
```

### Restore

```bash
# Stop application
docker-compose down

# Restore volumes
tar xzf kitmed-backup-YYYYMMDD.tar.gz

# Start application
docker-compose up -d
```

## 🔐 Security Considerations

1. **Change default secrets** in production
2. **Use HTTPS** with proper SSL certificates
3. **Regularly update** Docker images and dependencies
4. **Monitor logs** for suspicious activity
5. **Backup data** regularly
6. **Limit network access** with firewall rules

## 📞 Support

If you encounter issues:

1. Check the logs: `docker-compose logs`
2. Verify health status: `docker-compose ps`
3. Run test script: `./scripts/docker-test.sh`
4. Consult this documentation
5. Check Docker and system resources

## 🎯 Next Steps

1. Set up automated backups
2. Configure monitoring and alerting
3. Set up CI/CD pipeline
4. Implement log aggregation
5. Scale with Docker Swarm or Kubernetes (if needed)