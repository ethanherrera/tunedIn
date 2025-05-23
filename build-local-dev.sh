#!/bin/bash

# =====================================================
# SCRIPT TO BUILD LOCAL DEVELOPMENT IMAGES
# Use this when you've made changes to Dockerfiles or dependencies
# =====================================================

echo "Building TunedIn development images..."

# Check if docker is running
if ! docker info > /dev/null 2>&1; then
  echo "Docker is not running. Please start Docker and try again."
  exit 1
fi

# Build all images
echo "Building development images..."
docker compose -f docker-compose.local.yml build

echo "Build complete!"
echo "Run ./start-local-dev.sh to start the environment" 