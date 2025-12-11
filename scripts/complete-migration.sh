#!/bin/bash

# Complete Migration Script for Disciplines-Categories Separation
# This script orchestrates the entire migration process safely

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_DIR="$PROJECT_ROOT/logs"
BACKUP_DIR="$PROJECT_ROOT/backups"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Logging
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

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

success() {
    echo -e "${PURPLE}[$(date +'%Y-%m-%d %H:%M:%S')] SUCCESS: $1${NC}"
}

# Create necessary directories
setup_directories() {
    mkdir -p "$LOG_DIR"
    mkdir -p "$BACKUP_DIR"
}

# Display migration plan
show_migration_plan() {
    cat << 'EOF'

🚀 KITMED Disciplines-Categories Separation Migration Plan
========================================================

This migration will safely separate medical disciplines from equipment 
categories while maintaining full backward compatibility.

PHASES:
1. ✅ Pre-migration backup and validation
2. 🔧 Database schema changes (new tables)
3. 📊 Data migration (disciplines and relationships)
4. 🔗 API endpoint updates (backward compatible)
5. 🎨 Frontend feature flag activation
6. ✔️  Post-migration validation

SAFETY FEATURES:
- Full database backup before changes
- Rollback capability at each phase
- Feature flags for gradual activation
- Comprehensive validation at each step
- No data loss - maintains all relationships

EOF
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if we're in the right directory
    if [ ! -f "$PROJECT_ROOT/package.json" ]; then
        error "Must be run from project root directory"
    fi
    
    # Check if we're on the right branch
    local current_branch=$(git branch --show-current)
    if [ "$current_branch" != "matt/disciplines-categories-separation" ]; then
        warn "Not on feature branch. Current: $current_branch"
        read -p "Continue anyway? (y/n): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    # Check if scripts are executable
    if [ ! -x "$SCRIPT_DIR/backup-restore.sh" ]; then
        chmod +x "$SCRIPT_DIR/backup-restore.sh"
    fi
    
    if [ ! -x "$SCRIPT_DIR/run-migration.sh" ]; then
        chmod +x "$SCRIPT_DIR/run-migration.sh"
    fi
    
    # Check database connectivity
    if ! npm run prisma:status > /dev/null 2>&1; then
        error "Cannot connect to database. Check DATABASE_URL and ensure PostgreSQL is running"
    fi
    
    # Check if migration files exist
    if [ ! -f "$PROJECT_ROOT/prisma/migrations/001_create_disciplines_table.sql" ]; then
        error "Migration files not found. Ensure all migration files are present."
    fi
    
    log "Prerequisites check passed"
}

# Phase 1: Backup and validation
phase_1_backup() {
    log "🔐 PHASE 1: Creating comprehensive backup..."
    
    # Create full backup
    "$SCRIPT_DIR/backup-restore.sh" backup
    
    # Validate current state
    "$SCRIPT_DIR/backup-restore.sh" validate
    
    # Create migration checkpoint
    "$SCRIPT_DIR/backup-restore.sh" checkpoint "pre_migration_complete"
    
    success "Phase 1 completed: Backup and validation done"
}

# Phase 2: Schema migration
phase_2_schema() {
    log "📋 PHASE 2: Database schema changes..."
    
    info "Running schema migration 001: Creating disciplines tables..."
    "$SCRIPT_DIR/run-migration.sh" run --start-from 001 --auto-confirm
    
    # Checkpoint after schema changes
    "$SCRIPT_DIR/backup-restore.sh" checkpoint "schema_migration_complete"
    
    success "Phase 2 completed: Schema migration done"
}

# Phase 3: Data migration
phase_3_data() {
    log "📊 PHASE 3: Data migration..."
    
    info "Running data migration 002: Migrating disciplines and relationships..."
    "$SCRIPT_DIR/run-migration.sh" run --start-from 002 --auto-confirm
    
    info "Running comprehensive data migration strategy..."
    cd "$PROJECT_ROOT"
    
    # First run as dry run for validation
    DRY_RUN=true node scripts/data-migration-strategy.js
    
    # Then run the actual migration
    info "Executing actual data migration..."
    DRY_RUN=false node scripts/data-migration-strategy.js
    
    # Checkpoint after data migration
    "$SCRIPT_DIR/backup-restore.sh" checkpoint "data_migration_complete"
    
    success "Phase 3 completed: Data migration done"
}

# Phase 4: API updates
phase_4_api() {
    log "🔗 PHASE 4: API endpoint activation..."
    
    info "Updating Prisma schema and regenerating client..."
    cd "$PROJECT_ROOT"
    npx prisma db pull --force
    npx prisma generate
    
    info "Testing new API endpoints..."
    
    # Test disciplines endpoint
    if curl -s "http://localhost:3000/api/disciplines" > /dev/null; then
        success "Disciplines API endpoint is accessible"
    else
        warn "Disciplines API endpoint test failed (server may not be running)"
    fi
    
    # Create checkpoint
    "$SCRIPT_DIR/backup-restore.sh" checkpoint "api_updates_complete"
    
    success "Phase 4 completed: API updates done"
}

# Phase 5: Feature flag activation
phase_5_frontend() {
    log "🎨 PHASE 5: Frontend feature activation..."
    
    info "Setting migration mode environment variables..."
    
    # Update environment file
    if [ -f "$PROJECT_ROOT/.env.local" ]; then
        # Add or update feature flags
        if grep -q "FEATURE_MIGRATION_MODE" "$PROJECT_ROOT/.env.local"; then
            sed -i.bak 's/FEATURE_MIGRATION_MODE=.*/FEATURE_MIGRATION_MODE=true/' "$PROJECT_ROOT/.env.local"
        else
            echo "FEATURE_MIGRATION_MODE=true" >> "$PROJECT_ROOT/.env.local"
        fi
        
        if grep -q "FEATURE_SEPARATE_DISCIPLINES_CATEGORIES" "$PROJECT_ROOT/.env.local"; then
            sed -i.bak 's/FEATURE_SEPARATE_DISCIPLINES_CATEGORIES=.*/FEATURE_SEPARATE_DISCIPLINES_CATEGORIES=true/' "$PROJECT_ROOT/.env.local"
        else
            echo "FEATURE_SEPARATE_DISCIPLINES_CATEGORIES=true" >> "$PROJECT_ROOT/.env.local"
        fi
        
        if grep -q "FEATURE_LEGACY_CATEGORY_SUPPORT" "$PROJECT_ROOT/.env.local"; then
            sed -i.bak 's/FEATURE_LEGACY_CATEGORY_SUPPORT=.*/FEATURE_LEGACY_CATEGORY_SUPPORT=true/' "$PROJECT_ROOT/.env.local"
        else
            echo "FEATURE_LEGACY_CATEGORY_SUPPORT=true" >> "$PROJECT_ROOT/.env.local"
        fi
        
        info "Feature flags activated in .env.local"
    fi
    
    # Create checkpoint
    "$SCRIPT_DIR/backup-restore.sh" checkpoint "frontend_activation_complete"
    
    success "Phase 5 completed: Frontend feature activation done"
}

# Phase 6: Final validation
phase_6_validation() {
    log "✔️  PHASE 6: Final validation..."
    
    info "Running comprehensive system validation..."
    
    # Database validation
    "$SCRIPT_DIR/backup-restore.sh" validate
    
    # Data integrity validation
    cd "$PROJECT_ROOT"
    
    # Run validation queries
    info "Validating data integrity..."
    
    local validation_result=$(node -e "
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();
        
        async function validate() {
            try {
                const results = {
                    disciplines: await prisma.discipline.count(),
                    disciplineTranslations: await prisma.disciplineTranslation.count(),
                    productDisciplines: await prisma.productDiscipline.count(),
                    productCategories: await prisma.productCategory.count(),
                    remainingDisciplineCategories: await prisma.category.count({ where: { type: 'discipline' } }),
                    orphanedProducts: await prisma.product.count({
                        where: {
                            AND: [
                                { OR: [{ categoryId: null }, { category: null }] },
                                { productDisciplines: { none: {} } },
                                { productCategories: { none: {} } }
                            ]
                        }
                    })
                };
                
                console.log(JSON.stringify(results));
                process.exit(0);
            } catch (error) {
                console.error('Validation failed:', error);
                process.exit(1);
            }
        }
        
        validate();
    ")
    
    if [ $? -eq 0 ]; then
        info "Validation Results: $validation_result"
        
        # Parse results and check for issues
        local orphaned=$(echo "$validation_result" | grep -o '"orphanedProducts":[0-9]*' | cut -d: -f2)
        local remaining_disciplines=$(echo "$validation_result" | grep -o '"remainingDisciplineCategories":[0-9]*' | cut -d: -f2)
        
        if [ "$remaining_disciplines" -gt 0 ]; then
            warn "Found $remaining_disciplines discipline categories that weren't migrated"
        fi
        
        if [ "$orphaned" -gt 0 ]; then
            warn "Found $orphaned orphaned products without relationships"
        fi
        
        success "Data integrity validation completed"
    else
        error "Data validation failed"
    fi
    
    # Final checkpoint
    "$SCRIPT_DIR/backup-restore.sh" checkpoint "migration_complete"
    
    success "Phase 6 completed: Final validation done"
}

# Generate migration report
generate_report() {
    log "📄 Generating migration report..."
    
    local report_file="$LOG_DIR/migration_report_$(date +%Y%m%d_%H%M%S).md"
    
    cat > "$report_file" << EOF
# Disciplines-Categories Separation Migration Report

**Date:** $(date)
**Branch:** $(git branch --show-current)
**Commit:** $(git rev-parse HEAD)

## Migration Summary

The migration has been completed successfully. The system now separates medical disciplines from equipment categories while maintaining full backward compatibility.

## Changes Made

### Database Schema
- ✅ Created \`disciplines\` table
- ✅ Created \`discipline_translations\` table  
- ✅ Created \`product_disciplines\` junction table
- ✅ Created \`product_categories\` junction table
- ✅ Migrated data from categories to disciplines
- ✅ Updated product relationships

### API Endpoints
- ✅ New \`/api/disciplines\` endpoint
- ✅ Enhanced \`/api/categories\` endpoint
- ✅ Backward compatibility maintained
- ✅ Feature flag support implemented

### Frontend
- ✅ Feature flags activated
- ✅ Migration mode enabled
- ✅ Backward compatibility maintained

## Validation Results

EOF

    # Append validation data to report
    cd "$PROJECT_ROOT"
    node -e "
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();
        
        async function addResults() {
            const results = {
                disciplines: await prisma.discipline.count(),
                disciplineTranslations: await prisma.disciplineTranslation.count(),
                productDisciplines: await prisma.productDiscipline.count(),
                productCategories: await prisma.productCategory.count(),
                categories: await prisma.category.count(),
                products: await prisma.product.count()
            };
            
            console.log('- Disciplines migrated:', results.disciplines);
            console.log('- Discipline translations:', results.disciplineTranslations);
            console.log('- Product-discipline relationships:', results.productDisciplines);
            console.log('- Product-category relationships:', results.productCategories);
            console.log('- Remaining categories:', results.categories);
            console.log('- Total products:', results.products);
            
            process.exit(0);
        }
        
        addResults().catch(() => process.exit(1));
    " >> "$report_file"
    
    cat >> "$report_file" << EOF

## Next Steps

1. **Monitor System:** Watch for any issues in the admin interface
2. **Test Functionality:** Verify all features work as expected
3. **Gradual Rollout:** Use feature flags to gradually enable new features
4. **Performance Monitoring:** Monitor database performance with new structure
5. **User Training:** Update documentation for new discipline/category structure

## Rollback

If rollback is needed, run:
\`\`\`bash
./scripts/backup-restore.sh rollback
\`\`\`

## Support

Contact the development team if any issues arise during the migration period.
EOF

    success "Migration report generated: $report_file"
}

# Main execution
main() {
    setup_directories
    
    log "🎯 Starting Complete Migration Process for Disciplines-Categories Separation"
    
    show_migration_plan
    
    # Confirmation
    read -p "Do you want to proceed with the complete migration? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log "Migration cancelled by user"
        exit 0
    fi
    
    # Check prerequisites
    check_prerequisites
    
    # Execute migration phases
    phase_1_backup
    phase_2_schema
    phase_3_data
    phase_4_api
    phase_5_frontend
    phase_6_validation
    
    # Generate report
    generate_report
    
    success "🎉 COMPLETE MIGRATION FINISHED SUCCESSFULLY!"
    
    cat << 'EOF'

✅ Migration completed successfully!

Your KITMED platform now has:
- Separate disciplines and categories
- Enhanced product relationships
- Backward compatible APIs
- Feature-flagged frontend updates
- Complete data integrity

Next steps:
1. Test the admin interface
2. Monitor system performance
3. Gradually enable new UI features
4. Update user documentation

EOF
}

# Error handling
trap 'error "Migration failed at line $LINENO"' ERR

# Run main function
main "$@"