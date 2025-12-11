#!/bin/bash

# PostgreSQL Backup Script for KITMED Platform
# This script creates daily backups with compression and retention management

set -e

# Configuration
POSTGRES_HOST="${POSTGRES_HOST:-postgres}"
POSTGRES_USER="${POSTGRES_USER:-kitmed_admin}"
POSTGRES_DB="${POSTGRES_DB:-kitmed_production}"
BACKUP_DIR="/backups"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"

# Generate timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="kitmed_backup_${TIMESTAMP}.sql.gz"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_FILE}"

# Create backup directory if it doesn't exist
mkdir -p "${BACKUP_DIR}"

echo "Starting PostgreSQL backup: ${BACKUP_FILE}"

# Perform backup with compression
PGPASSWORD="${POSTGRES_PASSWORD}" pg_dump \
    --host="${POSTGRES_HOST}" \
    --username="${POSTGRES_USER}" \
    --dbname="${POSTGRES_DB}" \
    --format=custom \
    --compress=9 \
    --verbose \
    --file="${BACKUP_PATH%.gz}"

# Compress the backup
gzip "${BACKUP_PATH%.gz}"

# Verify backup integrity
echo "Verifying backup integrity..."
if [ -f "${BACKUP_PATH}" ] && [ -s "${BACKUP_PATH}" ]; then
    echo "✅ Backup created successfully: ${BACKUP_FILE}"
    echo "📁 Size: $(du -h ${BACKUP_PATH} | cut -f1)"
else
    echo "❌ Backup failed or file is empty!"
    exit 1
fi

# Clean up old backups
echo "Cleaning up backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -name "kitmed_backup_*.sql.gz" -type f -mtime +${RETENTION_DAYS} -delete

# Log backup completion
echo "🎉 Backup completed successfully at $(date)"
echo "📊 Total backups: $(ls -1 ${BACKUP_DIR}/kitmed_backup_*.sql.gz 2>/dev/null | wc -l)"

# Optional: Send backup notification (uncomment if needed)
# curl -X POST "${WEBHOOK_URL}" -H 'Content-Type: application/json' \
#     -d "{\"text\":\"✅ KITMED Database backup completed: ${BACKUP_FILE}\"}"