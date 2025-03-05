#!/bin/bash

# =====================================================
# SCRIPT TO STOP DEVELOPMENT ENVIRONMENT
# =====================================================

echo "Stopping TunedIn development environment..."

# Stop the development environment
docker compose -f docker-compose.local.yml down

echo "Development environment stopped!" 