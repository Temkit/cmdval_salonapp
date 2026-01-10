#!/bin/bash
set -e

# SalonApp Backup Script
# Usage: ./backup.sh [backup_dir]

BACKUP_DIR=${1:-"./backups"}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="salonapp_backup_${TIMESTAMP}"

echo "==================================="
echo "  SalonApp Backup Script"
echo "==================================="
echo ""
echo "Backup directory: ${BACKUP_DIR}/${BACKUP_NAME}"

# Create backup directory
mkdir -p "${BACKUP_DIR}/${BACKUP_NAME}"

# Load environment variables
if [ -f .env ]; then
    source .env
fi

# Backup database
echo ""
echo "Backing up database..."
docker compose exec -T db pg_dump -U salonapp salonapp > "${BACKUP_DIR}/${BACKUP_NAME}/database.sql"
echo "Database backup complete."

# Backup photos
echo ""
echo "Backing up photos..."
docker compose cp backend:/app/data/photos "${BACKUP_DIR}/${BACKUP_NAME}/photos" 2>/dev/null || mkdir -p "${BACKUP_DIR}/${BACKUP_NAME}/photos"
echo "Photos backup complete."

# Backup .env file
echo ""
echo "Backing up configuration..."
cp .env "${BACKUP_DIR}/${BACKUP_NAME}/.env" 2>/dev/null || echo "No .env file found"

# Create compressed archive
echo ""
echo "Creating compressed archive..."
cd "${BACKUP_DIR}"
tar -czf "${BACKUP_NAME}.tar.gz" "${BACKUP_NAME}"
rm -rf "${BACKUP_NAME}"

echo ""
echo "==================================="
echo "  Backup Complete!"
echo "==================================="
echo ""
echo "Backup saved to: ${BACKUP_DIR}/${BACKUP_NAME}.tar.gz"
echo ""
echo "To restore, use: ./restore.sh ${BACKUP_DIR}/${BACKUP_NAME}.tar.gz"
echo ""
