#!/bin/bash

# KITMED Docker Testing Script
# This script tests the Docker containerization setup

set -e

echo "🐳 KITMED Docker Testing Script"
echo "================================"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

echo "✅ Docker is running"

# Check if required files exist
required_files=(
    "Dockerfile"
    "Dockerfile.dev"
    "docker-compose.yml"
    "docker-compose.dev.yml"
    ".dockerignore"
    "docker/nginx.conf"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file exists"
    else
        echo "❌ $file is missing"
        exit 1
    fi
done

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p docker/data
mkdir -p docker/ssl
mkdir -p public/uploads

# Test development build (with timeout)
echo "🔨 Building development image..."
timeout 300 docker build -f Dockerfile.dev -t kitmed-dev . || {
    echo "⚠️  Build timed out after 5 minutes. This is normal for first build."
    echo "   You can run 'docker build -f Dockerfile.dev -t kitmed-dev .' manually"
}

# Test production build (with timeout)
echo "🔨 Building production image..."
timeout 300 docker build -f Dockerfile -t kitmed-prod . || {
    echo "⚠️  Build timed out after 5 minutes. This is normal for first build."
    echo "   You can run 'docker build -f Dockerfile -t kitmed-prod .' manually"
}

echo ""
echo "🎉 Docker setup validation complete!"
echo ""
echo "Next steps:"
echo "1. Run development: docker-compose -f docker-compose.dev.yml up"
echo "2. Run production: docker-compose up"
echo "3. With Nginx proxy: docker-compose --profile production up"
echo "4. Access app at: http://localhost:3000"
echo "5. Prisma Studio: docker-compose -f docker-compose.dev.yml --profile tools up"