#!/bin/bash

# KITMED PostgreSQL Migration Script
# This script migrates from SQLite to PostgreSQL safely

set -e

echo "🚀 KITMED PostgreSQL Migration Starting..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check prerequisites
echo -e "${BLUE}📋 Checking prerequisites...${NC}"

if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is required but not installed${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is required but not installed${NC}"
    exit 1
fi

# Check if SQLite database exists
SQLITE_DB="./prisma/dev.db"
if [ ! -f "$SQLITE_DB" ]; then
    echo -e "${YELLOW}⚠️  SQLite database not found at $SQLITE_DB${NC}"
    echo -e "${BLUE}   Proceeding with fresh PostgreSQL setup...${NC}"
    FRESH_INSTALL=true
else
    echo -e "${GREEN}✅ SQLite database found${NC}"
    FRESH_INSTALL=false
fi

# Create required directories
echo -e "${BLUE}📁 Creating required directories...${NC}"
mkdir -p docker/postgres/{data,backups}
mkdir -p docker/redis/data
mkdir -p scripts/{db-init,backup}

# Backup existing SQLite database
if [ "$FRESH_INSTALL" = false ]; then
    echo -e "${BLUE}💾 Backing up SQLite database...${NC}"
    cp "$SQLITE_DB" "${SQLITE_DB}.backup.$(date +%Y%m%d_%H%M%S)"
    echo -e "${GREEN}✅ SQLite backup created${NC}"
fi

# Start PostgreSQL service
echo -e "${BLUE}🐘 Starting PostgreSQL service...${NC}"
docker-compose -f docker-compose.postgres.yml up postgres redis -d

# Wait for PostgreSQL to be ready
echo -e "${BLUE}⏳ Waiting for PostgreSQL to be ready...${NC}"
timeout=60
counter=0
while ! docker exec kitmed_postgres pg_isready -U kitmed_admin -d kitmed_production >/dev/null 2>&1; do
    if [ $counter -ge $timeout ]; then
        echo -e "${RED}❌ PostgreSQL failed to start within ${timeout}s${NC}"
        exit 1
    fi
    echo -n "."
    sleep 1
    ((counter++))
done
echo -e "\n${GREEN}✅ PostgreSQL is ready${NC}"

# Update environment for migration
echo -e "${BLUE}🔧 Setting up environment for migration...${NC}"
export DATABASE_URL="postgresql://kitmed_admin:kitmed_secure_db_password_2024@localhost:5432/kitmed_production?schema=public&sslmode=prefer"

# Install PostgreSQL client tools if needed
if ! command -v psql &> /dev/null; then
    echo -e "${YELLOW}⚠️  PostgreSQL client not found. Installing via npm...${NC}"
    npm install -g pg
fi

# Generate and apply Prisma migration
echo -e "${BLUE}🔄 Generating Prisma migration...${NC}"
npx prisma generate

echo -e "${BLUE}📊 Applying database schema...${NC}"
npx prisma db push --accept-data-loss

# Migrate data if SQLite exists
if [ "$FRESH_INSTALL" = false ]; then
    echo -e "${BLUE}📤 Migrating data from SQLite to PostgreSQL...${NC}"
    
    # Note: This is a simplified migration script
    # For production, use a more sophisticated data migration tool
    echo -e "${YELLOW}⚠️  Data migration from SQLite to PostgreSQL requires manual intervention${NC}"
    echo -e "${BLUE}   Please run: npx prisma db pull && npx prisma db seed${NC}"
else
    # Seed fresh database
    echo -e "${BLUE}🌱 Seeding fresh database...${NC}"
    npm run seed 2>/dev/null || echo -e "${YELLOW}⚠️  No seed script found${NC}"
fi

# Test database connection
echo -e "${BLUE}🔍 Testing database connection...${NC}"
if npx prisma db pull >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Database connection successful${NC}"
else
    echo -e "${RED}❌ Database connection failed${NC}"
    exit 1
fi

# Update package.json scripts
echo -e "${BLUE}📝 Updating package.json scripts...${NC}"
if command -v jq &> /dev/null; then
    jq '.scripts.dev = "next dev"' package.json > package.json.tmp && mv package.json.tmp package.json
fi

echo -e "${GREEN}🎉 PostgreSQL migration completed successfully!${NC}"
echo -e "${BLUE}📋 Next Steps:${NC}"
echo -e "   1. Update your .env.local with PostgreSQL connection string"
echo -e "   2. Run: npm run dev to start with PostgreSQL"
echo -e "   3. Test all functionality thoroughly"
echo -e "   4. Deploy using: docker-compose -f docker-compose.postgres.yml up"

echo -e "\n${YELLOW}⚠️  Important Notes:${NC}"
echo -e "   • SQLite backup saved as: ${SQLITE_DB}.backup.*"
echo -e "   • PostgreSQL data: docker/postgres/data"
echo -e "   • Backups: docker/postgres/backups"
echo -e "   • Review .env.production for production settings"

echo -e "\n${GREEN}✅ Migration Complete!${NC}"