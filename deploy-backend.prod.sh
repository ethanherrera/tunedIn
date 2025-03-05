#!/bin/bash
# =====================================================
# BACKEND DEPLOYMENT SCRIPT FOR PRODUCTION
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

# Check for required environment variables
if [ -z "$MONGODB_URI" ] || [ -z "$SPOTIFY_CLIENT_ID" ] || [ -z "$SPOTIFY_CLIENT_SECRET" ]; then
  echo "Error: Required environment variables are not set."
  echo "Please set the following environment variables:"
  echo "  - MONGODB_URI"
  echo "  - SPOTIFY_CLIENT_ID"
  echo "  - SPOTIFY_CLIENT_SECRET"
  exit 1
fi

# Generate a tag based on git commit or timestamp if git is not available
if command -v git &> /dev/null && git rev-parse --is-inside-work-tree &> /dev/null; then
  TAG=$(git rev-parse --short HEAD)
else
  TAG=$(date +%Y%m%d%H%M%S)
fi

# Set backend-specific variables
BACKEND_IMAGE_NAME="tunedin-backend"
BACKEND_SERVICE_NAME="tunedin-backend-prod"
BACKEND_CPU="${BACKEND_CPU:-1}"
BACKEND_MEMORY="${BACKEND_MEMORY:-512Mi}"
BACKEND_MIN_INSTANCES="${BACKEND_MIN_INSTANCES:-0}"
BACKEND_MAX_INSTANCES="${BACKEND_MAX_INSTANCES:-1}"
API_DOMAIN_NAME="${API_DOMAIN_NAME:-api.tunedin.app}"

echo "=== TunedIn Backend Production Deployment ==="
echo "Project ID: $PROJECT_ID"
echo "Region: $REGION"
echo "Image: $BACKEND_IMAGE_NAME:$TAG"
echo "Service: $BACKEND_SERVICE_NAME"
echo "Resources: CPU=$BACKEND_CPU, Memory=$BACKEND_MEMORY, Instances=$BACKEND_MIN_INSTANCES-$BACKEND_MAX_INSTANCES"
echo "API Domain: $API_DOMAIN_NAME"

# Ensure gcloud is configured correctly
echo "=== Verifying gcloud configuration ==="
gcloud config set project $PROJECT_ID

# Build the Docker image locally with platform specified
echo "=== Building Docker image locally ==="
cd backend
docker build --platform linux/amd64 -t gcr.io/$PROJECT_ID/$BACKEND_IMAGE_NAME:$TAG -f Dockerfile.prod .

# Configure Docker to use gcloud as a credential helper
echo "=== Configuring Docker authentication ==="
gcloud auth configure-docker

# Push the image to Google Container Registry
echo "=== Pushing image to Container Registry ==="
docker push gcr.io/$PROJECT_ID/$BACKEND_IMAGE_NAME:$TAG

# Update the Terraform variables
echo "=== Updating Terraform variables ==="
cd ../terraform
cat > terraform.prod.tfvars << EOF
project_id = "$PROJECT_ID"
region = "$REGION"
environment = "prod"

# Frontend configuration
frontend_container_image = "gcr.io/$PROJECT_ID/tunedin-frontend:${FRONTEND_TAG:-latest}"
frontend_cpu = "$CPU"
frontend_memory = "$MEMORY"
frontend_min_instances = "$MIN_INSTANCES"
frontend_max_instances = "$MAX_INSTANCES"
domain_name = "$DOMAIN_NAME"

# Backend configuration
backend_container_image = "gcr.io/$PROJECT_ID/$BACKEND_IMAGE_NAME:$TAG"
backend_cpu = "$BACKEND_CPU"
backend_memory = "$BACKEND_MEMORY"
backend_min_instances = "$BACKEND_MIN_INSTANCES"
backend_max_instances = "$BACKEND_MAX_INSTANCES"
api_domain_name = "$API_DOMAIN_NAME"

# Database configuration
mongodb_uri = "$MONGODB_URI"

# Spotify API configuration
spotify_client_id = "$SPOTIFY_CLIENT_ID"
spotify_client_secret = "$SPOTIFY_CLIENT_SECRET"
EOF

# Initialize Terraform (using local state)
echo "=== Initializing Terraform with local state ==="
terraform init

# Apply Terraform configuration
echo "=== Applying Terraform configuration ==="
terraform apply -var-file=terraform.prod.tfvars -auto-approve

# Get the deployed URLs
FRONTEND_URL=$(terraform output -raw frontend_url)
BACKEND_URL=$(terraform output -raw backend_url)

echo "=== Deployment Complete ==="
echo "Frontend URL: $FRONTEND_URL"
echo "Backend URL: $BACKEND_URL"

# Update the frontend configuration with the new backend URL
echo "=== Updating frontend configuration with backend URL ==="
echo "To update the frontend with the new backend URL, run:"
echo "FRONTEND_TAG=<current-frontend-tag> API_BASE_URL=$BACKEND_URL/api ./deploy-frontend.prod.sh" 