#!/bin/bash
set -e

# SalonApp Restore Script
# Usage: ./restore.sh <backup_file.tar.gz>

if [ -z "$1" ]; then
    echo "Usage: ./restore.sh <backup_file.tar.gz>"
    exit 1
fi

BACKUP_FILE=$1
TEMP_DIR=$(mktemp -d)

echo "==================================="
echo "  SalonApp Restore Script"
echo "==================================="
echo ""
echo "Restoring from: ${BACKUP_FILE}"

# Check if backup file exists
if [ ! -f "${BACKUP_FILE}" ]; then
    echo "Error: Backup file not found: ${BACKUP_FILE}"
    exit 1
fi

# Extract backup
echo ""
echo "Extracting backup..."
tar -xzf "${BACKUP_FILE}" -C "${TEMP_DIR}"
BACKUP_DIR=$(ls "${TEMP_DIR}")

# Stop services
echo ""
echo "Stopping services..."
docker compose stop backend frontend

# Restore database
echo ""
echo "Restoring database..."
docker compose exec -T db psql -U salonapp -c "DROP DATABASE IF EXISTS salonapp_temp;" || true
docker compose exec -T db psql -U salonapp -c "CREATE DATABASE salonapp_temp;"
docker compose exec -T db psql -U salonapp salonapp_temp < "${TEMP_DIR}/${BACKUP_DIR}/database.sql"
docker compose exec -T db psql -U salonapp -c "DROP DATABASE salonapp;"
docker compose exec -T db psql -U salonapp -c "ALTER DATABASE salonapp_temp RENAME TO salonapp;"
echo "Database restored."

# Restore photos
echo ""
echo "Restoring photos..."
if [ -d "${TEMP_DIR}/${BACKUP_DIR}/photos" ]; then
    docker compose cp "${TEMP_DIR}/${BACKUP_DIR}/photos" backend:/app/data/
    echo "Photos restored."
else
    echo "No photos to restore."
fi

# Restore .env if requested
if [ -f "${TEMP_DIR}/${BACKUP_DIR}/.env" ]; then
    read -p "Do you want to restore the .env file? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cp "${TEMP_DIR}/${BACKUP_DIR}/.env" .env
        echo ".env file restored."
    fi
fi

# Cleanup
rm -rf "${TEMP_DIR}"

# Restart services
echo ""
echo "Restarting services..."
docker compose start backend frontend

echo ""
echo "==================================="
echo "  Restore Complete!"
echo "==================================="
echo ""
echo "Services have been restarted."
echo ""
