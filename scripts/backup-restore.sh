#!/bin/bash

# Database Backup and Restore Strategy for Disciplines-Categories Separation
# This script provides safe database operations with rollback capabilities

set -e

# Configuration
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DB_FILE="./prisma/prisma/dev.db"
BACKUP_FILE="${BACKUP_DIR}/pre_migration_${TIMESTAMP}.db"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

# Create backup directory if it doesn't exist
create_backup_dir() {
    if [ ! -d "$BACKUP_DIR" ]; then
        mkdir -p "$BACKUP_DIR"
        log "Created backup directory: $BACKUP_DIR"
    fi
}

# Backup current database
backup_database() {
    if [ ! -f "$DB_FILE" ]; then
        error "Database file not found: $DB_FILE"
    fi
    
    log "Creating database backup..."
    cp "$DB_FILE" "$BACKUP_FILE"
    log "Database backed up to: $BACKUP_FILE"
    
    # Also create a JSON export using Prisma
    log "Creating JSON export of current data..."
    npx prisma db pull
    npx prisma generate
    node -e "
        const { PrismaClient } = require('@prisma/client');
        const fs = require('fs');
        const prisma = new PrismaClient();
        
        async function exportData() {
            const categories = await prisma.category.findMany({
                include: {
                    translations: true,
                    products: {
                        include: {
                            translations: true,
                            attributes: true,
                            media: true,
                            productFiles: true
                        }
                    }
                }
            });
            
            fs.writeFileSync('${BACKUP_DIR}/data_export_${TIMESTAMP}.json', 
                JSON.stringify({categories, timestamp: '${TIMESTAMP}'}, null, 2));
            console.log('Data exported successfully');
            process.exit(0);
        }
        
        exportData().catch(console.error);
    "
    log "JSON export completed: ${BACKUP_DIR}/data_export_${TIMESTAMP}.json"
}

# Restore database from backup
restore_database() {
    local backup_file=$1
    
    if [ -z "$backup_file" ]; then
        error "Please specify backup file to restore from"
    fi
    
    if [ ! -f "$backup_file" ]; then
        error "Backup file not found: $backup_file"
    fi
    
    warn "This will overwrite the current database!"
    read -p "Are you sure you want to restore from $backup_file? (yes/no): " -r
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        log "Restore cancelled"
        exit 0
    fi
    
    log "Restoring database from: $backup_file"
    cp "$backup_file" "$DB_FILE"
    log "Database restored successfully"
    
    # Reset Prisma client
    npx prisma generate
    log "Prisma client regenerated"
}

# List available backups
list_backups() {
    log "Available backups:"
    if [ -d "$BACKUP_DIR" ]; then
        ls -la "$BACKUP_DIR"/*.db 2>/dev/null || log "No backup files found"
    else
        log "No backup directory found"
    fi
}

# Validate database integrity
validate_database() {
    log "Validating database integrity..."
    
    # Check if database file exists and is readable
    if [ ! -r "$DB_FILE" ]; then
        error "Database file is not readable: $DB_FILE"
    fi
    
    # Use SQLite3 to check database integrity
    if command -v sqlite3 &> /dev/null; then
        local integrity_check=$(sqlite3 "$DB_FILE" "PRAGMA integrity_check;")
        if [ "$integrity_check" = "ok" ]; then
            log "Database integrity check: OK"
        else
            error "Database integrity check failed: $integrity_check"
        fi
    else
        warn "sqlite3 not found, skipping integrity check"
    fi
    
    # Test Prisma connection
    log "Testing Prisma connection..."
    npx prisma db pull --force || error "Prisma connection test failed"
    log "Database validation completed successfully"
}

# Create migration checkpoint
create_checkpoint() {
    local phase=$1
    if [ -z "$phase" ]; then
        phase="checkpoint"
    fi
    
    local checkpoint_file="${BACKUP_DIR}/${phase}_${TIMESTAMP}.db"
    cp "$DB_FILE" "$checkpoint_file"
    log "Checkpoint created: $checkpoint_file"
    echo "$checkpoint_file" > "${BACKUP_DIR}/latest_checkpoint.txt"
}

# Rollback to latest checkpoint
rollback_to_checkpoint() {
    local checkpoint_file
    if [ -f "${BACKUP_DIR}/latest_checkpoint.txt" ]; then
        checkpoint_file=$(cat "${BACKUP_DIR}/latest_checkpoint.txt")
        restore_database "$checkpoint_file"
    else
        error "No checkpoint found to rollback to"
    fi
}

# Main script logic
case "$1" in
    backup)
        create_backup_dir
        backup_database
        ;;
    restore)
        restore_database "$2"
        ;;
    list)
        list_backups
        ;;
    validate)
        validate_database
        ;;
    checkpoint)
        create_backup_dir
        create_checkpoint "$2"
        ;;
    rollback)
        rollback_to_checkpoint
        ;;
    *)
        echo "Usage: $0 {backup|restore|list|validate|checkpoint|rollback}"
        echo ""
        echo "Commands:"
        echo "  backup                    - Create full database backup"
        echo "  restore <backup_file>     - Restore from specific backup"
        echo "  list                      - List available backups"
        echo "  validate                  - Check database integrity"
        echo "  checkpoint [phase]        - Create migration checkpoint"
        echo "  rollback                  - Rollback to latest checkpoint"
        echo ""
        echo "Examples:"
        echo "  $0 backup"
        echo "  $0 restore ./backups/pre_migration_20241125_143022.db"
        echo "  $0 checkpoint schema_changes"
        exit 1
        ;;
esac

log "Operation completed successfully"