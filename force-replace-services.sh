#!/bin/bash
# =====================================================
# FORCE REPLACEMENT SCRIPT FOR CLOUD RUN SERVICES
# This script will force replacement of Cloud Run services
# without affecting domain mappings
# =====================================================

set -e

# Source configuration variables
if [ -f "config.prod.sh" ]; then
  source config.prod.sh
  echo "=== Configuration loaded from config.prod.sh ==="
else
  echo "Error: config.prod.sh not found. Please create this file with your configuration."
  exit 1
fi

# Set service names
BACKEND_SERVICE_NAME="tunedin-backend-prod"
FRONTEND_SERVICE_NAME="tunedin-frontend-prod"

echo "=== TunedIn Force Replacement Script ==="
echo "Project ID: $PROJECT_ID"
echo "Region: $REGION"
echo "Backend Service: $BACKEND_SERVICE_NAME"
echo "Frontend Service: $FRONTEND_SERVICE_NAME"

# Ensure gcloud is configured correctly
echo "=== Verifying gcloud configuration ==="
gcloud config set project $PROJECT_ID

# Get the current backend image
echo "=== Getting current backend image ==="
BACKEND_IMAGE=$(gcloud run services describe $BACKEND_SERVICE_NAME --region $REGION --format="value(spec.template.spec.containers[0].image)")
echo "Current backend image: $BACKEND_IMAGE"

# Get the current frontend image
echo "=== Getting current frontend image ==="
FRONTEND_IMAGE=$(gcloud run services describe $FRONTEND_SERVICE_NAME --region $REGION --format="value(spec.template.spec.containers[0].image)")
echo "Current frontend image: $FRONTEND_IMAGE"

# Generate a timestamp for the new revision
TIMESTAMP=$(date +%Y%m%d%H%M%S)

# Update the backend service with a new revision
echo "=== Updating backend service with a new revision ==="
gcloud run services update $BACKEND_SERVICE_NAME \
  --region $REGION \
  --revision-suffix $TIMESTAMP \
  --image $BACKEND_IMAGE

# Update the frontend service with a new revision
echo "=== Updating frontend service with a new revision ==="
gcloud run services update $FRONTEND_SERVICE_NAME \
  --region $REGION \
  --revision-suffix $TIMESTAMP \
  --image $FRONTEND_IMAGE

echo "=== Force replacement completed successfully! ==="
echo "New backend revision: $BACKEND_SERVICE_NAME-$TIMESTAMP"
echo "New frontend revision: $FRONTEND_SERVICE_NAME-$TIMESTAMP" 