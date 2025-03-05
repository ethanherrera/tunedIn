#!/bin/bash
# =====================================================
# COMPLETE DEPLOYMENT SCRIPT FOR PRODUCTION
# Deploys both backend and frontend in one go
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

# Set common variables
BACKEND_IMAGE_NAME="tunedin-backend"
FRONTEND_IMAGE_NAME="tunedin-frontend"
BACKEND_SERVICE_NAME="tunedin-backend-prod"
FRONTEND_SERVICE_NAME="tunedin-frontend-prod"
API_DOMAIN_NAME="${API_DOMAIN_NAME:-api.tunedin.app}"
DOMAIN_NAME="${DOMAIN_NAME:-tunedin.app}"

echo "=== TunedIn Full Production Deployment ==="
echo "Project ID: $PROJECT_ID"
echo "Region: $REGION"
echo "Backend Image: $BACKEND_IMAGE_NAME:$TAG"
echo "Frontend Image: $FRONTEND_IMAGE_NAME:$TAG"
echo "API Domain: $API_DOMAIN_NAME"
echo "Frontend Domain: $DOMAIN_NAME"

# Ensure gcloud is configured correctly
echo "=== Verifying gcloud configuration ==="
gcloud config set project $PROJECT_ID

# =====================================================
# BACKEND DEPLOYMENT
# =====================================================
echo "=== Starting Backend Deployment ==="

# Build the backend Docker image
echo "=== Building Backend Docker image ==="
cd backend
docker build --platform linux/amd64 -t gcr.io/$PROJECT_ID/$BACKEND_IMAGE_NAME:$TAG -f Dockerfile.prod .

# Configure Docker to use gcloud as a credential helper
echo "=== Configuring Docker authentication ==="
gcloud auth configure-docker

# Push the backend image to Google Container Registry
echo "=== Pushing Backend image to Container Registry ==="
docker push gcr.io/$PROJECT_ID/$BACKEND_IMAGE_NAME:$TAG

cd ..

# =====================================================
# FRONTEND DEPLOYMENT
# =====================================================
echo "=== Starting Frontend Deployment ==="

# Build the frontend Docker image
echo "=== Building Frontend Docker image ==="
cd frontend
docker build --platform linux/amd64 -t gcr.io/$PROJECT_ID/$FRONTEND_IMAGE_NAME:$TAG -f Dockerfile.prod .

# Push the frontend image to Google Container Registry
echo "=== Pushing Frontend image to Container Registry ==="
docker push gcr.io/$PROJECT_ID/$FRONTEND_IMAGE_NAME:$TAG

cd ..

# =====================================================
# TERRAFORM DEPLOYMENT
# =====================================================
echo "=== Updating Terraform variables ==="
cd terraform
cat > terraform.prod.tfvars << EOF
project_id = "$PROJECT_ID"
region = "$REGION"
environment = "prod"

# Frontend configuration
frontend_container_image = "gcr.io/$PROJECT_ID/$FRONTEND_IMAGE_NAME:$TAG"
frontend_cpu = "${FRONTEND_CPU:-1}"
frontend_memory = "${FRONTEND_MEMORY:-512Mi}"
frontend_min_instances = "${FRONTEND_MIN_INSTANCES:-0}"
frontend_max_instances = "${FRONTEND_MAX_INSTANCES:-1}"
domain_name = "$DOMAIN_NAME"

# Backend configuration
backend_container_image = "gcr.io/$PROJECT_ID/$BACKEND_IMAGE_NAME:$TAG"
backend_cpu = "${BACKEND_CPU:-1}"
backend_memory = "${BACKEND_MEMORY:-512Mi}"
backend_min_instances = "${BACKEND_MIN_INSTANCES:-0}"
backend_max_instances = "${BACKEND_MAX_INSTANCES:-1}"
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
echo "Custom Frontend Domain: $DOMAIN_NAME"
echo "Custom API Domain: $API_DOMAIN_NAME"

# Return to the root directory
cd ..

echo "=== Full deployment completed successfully! ===" 