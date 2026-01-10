#!/bin/bash
set -e

# SalonApp Deployment Script
# Usage: ./deploy.sh [--reset]

echo "==================================="
echo "  SalonApp Deployment Script"
echo "==================================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Error: Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker compose &> /dev/null; then
    echo "Error: Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cat > .env << EOF
# Database
DB_PASSWORD=$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 32)

# Security
SECRET_KEY=$(openssl rand -base64 64 | tr -dc 'a-zA-Z0-9' | head -c 64)

# Admin credentials
ADMIN_PASSWORD=admin123

# Domain (for SSL)
DOMAIN=localhost
EOF
    echo ".env file created. Please update DOMAIN and ADMIN_PASSWORD before production use."
fi

# Load environment variables
source .env

# Build and start services
echo ""
echo "Building and starting services..."
docker compose build
docker compose up -d

# Wait for backend to be ready
echo ""
echo "Waiting for backend to be ready..."
sleep 10

# Run database migrations
echo ""
echo "Running database migrations..."
docker compose exec -T backend alembic upgrade head || true

# Seed database if --reset flag is provided or first run
if [ "$1" == "--reset" ]; then
    echo ""
    echo "Resetting and seeding database..."
    docker compose exec -T backend python -m src.db.seed --reset
else
    echo ""
    echo "Seeding database (if needed)..."
    docker compose exec -T backend python -m src.db.seed || true
fi

echo ""
echo "==================================="
echo "  Deployment Complete!"
echo "==================================="
echo ""
echo "Access the application at:"
echo "  - http://localhost"
echo ""
echo "Default credentials:"
echo "  - Username: admin"
echo "  - Password: admin123 (or value in .env)"
echo ""
echo "To view logs: docker compose logs -f"
echo "To stop: docker compose down"
echo ""
