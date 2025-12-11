#!/bin/bash

# Safe Migration Runner for Disciplines-Categories Separation
# This script runs migrations with comprehensive safety checks and rollback capabilities

set -e

# Configuration
MIGRATION_DIR="./prisma/migrations"
BACKUP_SCRIPT="./scripts/backup-restore.sh"
LOG_FILE="./logs/migration_$(date +%Y%m%d_%H%M%S).log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log() {
    local message="[$(date +'%Y-%m-%d %H:%M:%S')] $1"
    echo -e "${GREEN}${message}${NC}"
    echo "$message" >> "$LOG_FILE"
}

warn() {
    local message="[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1"
    echo -e "${YELLOW}${message}${NC}"
    echo "$message" >> "$LOG_FILE"
}

error() {
    local message="[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1"
    echo -e "${RED}${message}${NC}"
    echo "$message" >> "$LOG_FILE"
    exit 1
}

info() {
    local message="[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1"
    echo -e "${BLUE}${message}${NC}"
    echo "$message" >> "$LOG_FILE"
}

# Create logs directory
create_log_dir() {
    mkdir -p "./logs"
}

# Validate prerequisites
validate_prerequisites() {
    log "Validating prerequisites..."
    
    # Check if DATABASE_URL is set
    if [ -z "$DATABASE_URL" ]; then
        error "DATABASE_URL environment variable is not set"
    fi
    
    # Check if backup script exists
    if [ ! -f "$BACKUP_SCRIPT" ]; then
        error "Backup script not found: $BACKUP_SCRIPT"
    fi
    
    # Check if migration files exist
    if [ ! -d "$MIGRATION_DIR" ]; then
        error "Migration directory not found: $MIGRATION_DIR"
    fi
    
    # Test database connectivity
    log "Testing database connectivity..."
    if ! npx prisma db pull --force > /dev/null 2>&1; then
        error "Cannot connect to database. Please check DATABASE_URL and ensure PostgreSQL is running"
    fi
    
    log "Prerequisites validation completed successfully"
}

# Pre-migration checks
pre_migration_checks() {
    log "Performing pre-migration checks..."
    
    # Check database integrity
    $BACKUP_SCRIPT validate
    
    # Check for uncommitted changes
    if ! git diff-index --quiet HEAD --; then
        warn "You have uncommitted changes. Consider committing them before migration."
        read -p "Continue anyway? (yes/no): " -r
        if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
            error "Migration cancelled by user"
        fi
    fi
    
    # Check current branch
    local current_branch=$(git branch --show-current)
    if [ "$current_branch" != "matt/disciplines-categories-separation" ]; then
        warn "Not on feature branch. Current branch: $current_branch"
        read -p "Continue anyway? (yes/no): " -r
        if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
            error "Migration cancelled by user"
        fi
    fi
    
    log "Pre-migration checks completed"
}

# Create backup
create_backup() {
    log "Creating pre-migration backup..."
    $BACKUP_SCRIPT backup
    $BACKUP_SCRIPT checkpoint "pre_migration"
    log "Backup created successfully"
}

# Run specific migration
run_migration() {
    local migration_file=$1
    local migration_name=$(basename "$migration_file" .sql)
    
    log "Running migration: $migration_name"
    
    # Create checkpoint before this migration
    $BACKUP_SCRIPT checkpoint "before_$migration_name"
    
    # Run the migration
    if psql "$DATABASE_URL" -f "$migration_file" > "/tmp/migration_${migration_name}.log" 2>&1; then
        log "Migration $migration_name completed successfully"
        
        # Log migration in database
        psql "$DATABASE_URL" -c "
            INSERT INTO activity_logs (action, resource_type, resource_id, details, created_at)
            VALUES (
                'migration_executed',
                'database',
                '$migration_name',
                '{\"status\": \"success\", \"file\": \"$migration_file\"}',
                CURRENT_TIMESTAMP
            );" > /dev/null 2>&1 || true
    else
        error "Migration $migration_name failed. Check /tmp/migration_${migration_name}.log for details"
    fi
}

# Validate migration results
validate_migration() {
    local migration_name=$1
    
    log "Validating migration: $migration_name"
    
    case "$migration_name" in
        "001_create_disciplines_table")
            validate_schema_creation
            ;;
        "002_migrate_discipline_data")
            validate_data_migration
            ;;
        *)
            warn "No specific validation for migration: $migration_name"
            ;;
    esac
}

# Validate schema creation
validate_schema_creation() {
    log "Validating schema creation..."
    
    # Check if disciplines table exists
    local disciplines_exists=$(psql "$DATABASE_URL" -t -c "
        SELECT EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = 'disciplines'
        );" | xargs)
    
    if [ "$disciplines_exists" != "t" ]; then
        error "disciplines table was not created"
    fi
    
    # Check if discipline_translations table exists
    local translations_exists=$(psql "$DATABASE_URL" -t -c "
        SELECT EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = 'discipline_translations'
        );" | xargs)
    
    if [ "$translations_exists" != "t" ]; then
        error "discipline_translations table was not created"
    fi
    
    # Check if junction tables exist
    local product_disciplines_exists=$(psql "$DATABASE_URL" -t -c "
        SELECT EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = 'product_disciplines'
        );" | xargs)
    
    if [ "$product_disciplines_exists" != "t" ]; then
        error "product_disciplines table was not created"
    fi
    
    log "Schema creation validation passed"
}

# Validate data migration
validate_data_migration() {
    log "Validating data migration..."
    
    # Check if disciplines were migrated
    local disciplines_count=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM disciplines;" | xargs)
    local original_disciplines_count=$(psql "$DATABASE_URL" -t -c "
        SELECT COUNT(*) FROM categories WHERE type = 'discipline';" | xargs)
    
    if [ "$disciplines_count" != "$original_disciplines_count" ]; then
        error "Discipline count mismatch. Original: $original_disciplines_count, Migrated: $disciplines_count"
    fi
    
    # Check if all products have relationships
    local orphaned_products=$(psql "$DATABASE_URL" -t -c "
        SELECT COUNT(*) FROM products p
        WHERE NOT EXISTS (
            SELECT 1 FROM product_disciplines pd WHERE pd.product_id = p.id
            UNION
            SELECT 1 FROM product_categories pc WHERE pc.product_id = p.id
        );" | xargs)
    
    if [ "$orphaned_products" != "0" ]; then
        error "Found $orphaned_products products without relationships after migration"
    fi
    
    log "Data migration validation passed"
}

# Post-migration tasks
post_migration_tasks() {
    log "Performing post-migration tasks..."
    
    # Regenerate Prisma client
    log "Regenerating Prisma client..."
    npx prisma generate
    
    # Update schema file if needed
    log "Pulling updated schema..."
    npx prisma db pull --force
    
    log "Post-migration tasks completed"
}

# Rollback migration
rollback_migration() {
    warn "Rolling back migration..."
    $BACKUP_SCRIPT rollback
    log "Rollback completed"
}

# Main migration function
run_migrations() {
    local start_from=${1:-"001"}
    
    log "Starting migrations from: $start_from"
    
    # List of migrations in order
    local migrations=(
        "001_create_disciplines_table.sql"
        "002_migrate_discipline_data.sql"
    )
    
    local start_index=0
    
    # Find starting index
    for i in "${!migrations[@]}"; do
        if [[ "${migrations[$i]}" == "${start_from}"* ]]; then
            start_index=$i
            break
        fi
    done
    
    # Run migrations from starting point
    for ((i=start_index; i<${#migrations[@]}; i++)); do
        local migration_file="$MIGRATION_DIR/${migrations[$i]}"
        
        if [ ! -f "$migration_file" ]; then
            error "Migration file not found: $migration_file"
        fi
        
        # Confirmation for each migration
        local migration_name=$(basename "${migrations[$i]}" .sql)
        info "About to run migration: $migration_name"
        echo -e "${YELLOW}Migration file: $migration_file${NC}"
        
        if [ "$AUTO_CONFIRM" != "yes" ]; then
            read -p "Proceed with this migration? (yes/no/skip): " -r
            case $REPLY in
                [Yy][Ee][Ss])
                    ;;
                [Ss][Kk][Ii][Pp])
                    warn "Skipping migration: $migration_name"
                    continue
                    ;;
                *)
                    error "Migration cancelled by user"
                    ;;
            esac
        fi
        
        # Run the migration
        run_migration "$migration_file"
        
        # Validate the migration
        validate_migration "$migration_name"
        
        # Success checkpoint
        log "Migration $migration_name completed and validated successfully"
        
        # Create checkpoint after successful migration
        $BACKUP_SCRIPT checkpoint "after_$migration_name"
    done
}

# Help function
show_help() {
    echo "Usage: $0 [OPTIONS] [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  run [migration]     Run migrations (optionally starting from specific migration)"
    echo "  rollback           Rollback to latest checkpoint"
    echo "  validate           Validate current database state"
    echo "  help              Show this help message"
    echo ""
    echo "Options:"
    echo "  --auto-confirm     Skip confirmation prompts"
    echo "  --start-from NUM   Start from specific migration number (e.g., 001, 002)"
    echo ""
    echo "Examples:"
    echo "  $0 run                    # Run all migrations"
    echo "  $0 run --start-from 002   # Start from migration 002"
    echo "  $0 --auto-confirm run     # Run all migrations without prompts"
    echo "  $0 rollback               # Rollback to previous state"
}

# Parse command line arguments
AUTO_CONFIRM="no"
START_FROM="001"

while [[ $# -gt 0 ]]; do
    case $1 in
        --auto-confirm)
            AUTO_CONFIRM="yes"
            shift
            ;;
        --start-from)
            START_FROM="$2"
            shift 2
            ;;
        run)
            COMMAND="run"
            shift
            ;;
        rollback)
            COMMAND="rollback"
            shift
            ;;
        validate)
            COMMAND="validate"
            shift
            ;;
        help|--help|-h)
            COMMAND="help"
            shift
            ;;
        *)
            error "Unknown option: $1"
            ;;
    esac
done

# Main script execution
main() {
    create_log_dir
    
    case "${COMMAND:-run}" in
        run)
            log "=== Starting Disciplines-Categories Separation Migration ==="
            validate_prerequisites
            pre_migration_checks
            create_backup
            run_migrations "$START_FROM"
            post_migration_tasks
            log "=== Migration completed successfully ==="
            ;;
        rollback)
            rollback_migration
            ;;
        validate)
            validate_prerequisites
            $BACKUP_SCRIPT validate
            log "Database validation completed"
            ;;
        help)
            show_help
            ;;
        *)
            error "Unknown command: ${COMMAND}"
            ;;
    esac
}

# Trap for cleanup on exit
cleanup() {
    if [ $? -ne 0 ]; then
        error "Migration failed. Check $LOG_FILE for details."
        warn "Use '$0 rollback' to restore previous state if needed."
    fi
}

trap cleanup EXIT

# Run main function
main "$@"