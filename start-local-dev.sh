#!/bin/bash

# =====================================================
# SCRIPT TO START LOCAL DEVELOPMENT ENVIRONMENT
# =====================================================

echo "Starting TunedIn development environment..."

# Check if docker is running
if ! docker info > /dev/null 2>&1; then
  echo "Docker is not running. Please start Docker and try again."
  exit 1
fi

# Stop any existing containers to avoid conflicts
echo "Stopping any existing containers..."
docker compose -f docker-compose.local.yml down

# Start the local development environment
echo "Starting development environment..."
docker compose -f docker-compose.local.yml up -d

echo "Development environment started!"
echo "MongoDB: localhost:27017"
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:5137"
echo "Reverse Proxy: http://localhost:80"
echo ""
echo "To view logs: docker compose -f docker-compose.local.yml logs -f"
echo "To stop: ./stop-local-dev.sh" 