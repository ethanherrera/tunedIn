#!/bin/bash
# =====================================================
# FRONTEND DEPLOYMENT SCRIPT FOR PRODUCTION
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

# Generate a tag based on git commit or timestamp if git is not available
if command -v git &> /dev/null && git rev-parse --is-inside-work-tree &> /dev/null; then
  GIT_HASH=$(git rev-parse --short HEAD)
  # Always include a timestamp to ensure uniqueness for each deployment
  TAG="${GIT_HASH}-$(date +%Y%m%d%H%M%S)"
else
  TAG=$(date +%Y%m%d%H%M%S)
fi

echo "=== TunedIn Frontend Production Deployment ==="
echo "Project ID: $PROJECT_ID"
echo "Region: $REGION"
echo "Image: $IMAGE_NAME:$TAG"
echo "Service: $SERVICE_NAME"
echo "Resources: CPU=$CPU, Memory=$MEMORY, Instances=$MIN_INSTANCES-$MAX_INSTANCES"

# Ensure gcloud is configured correctly
echo "=== Verifying gcloud configuration ==="
gcloud config set project $PROJECT_ID

# Generate .env.prod file
echo "=== Generating .env.prod file ==="
echo "Using API URL: $VITE_API_BASE_URL"
cat > frontend/.env.prod << EOF
# Production environment variables for TunedIn frontend

# API Configuration
# For Cloud Run backend, this will be the URL provided after deployment
VITE_API_BASE_URL=$VITE_API_BASE_URL

# Build Configuration
# Disable source maps in production for better performance
VITE_BUILD_SOURCEMAP=false
EOF

# Build the Docker image locally with platform specified and no cache
echo "=== Building Docker image locally ==="
cd frontend
docker build --platform linux/amd64 --no-cache -t gcr.io/$PROJECT_ID/$IMAGE_NAME:$TAG -f Dockerfile.prod .

# Configure Docker to use gcloud as a credential helper
echo "=== Configuring Docker authentication ==="
gcloud auth configure-docker

# Push the image to Google Container Registry
echo "=== Pushing image to Container Registry ==="
docker push gcr.io/$PROJECT_ID/$IMAGE_NAME:$TAG

# Update the Terraform variables
echo "=== Updating Terraform variables ==="
cd ../terraform
cat > terraform.prod.tfvars << EOF
project_id = "$PROJECT_ID"
region = "$REGION"
frontend_container_image = "gcr.io/$PROJECT_ID/$IMAGE_NAME:$TAG"
domain_name = "$DOMAIN_NAME"
environment = "prod"
cpu = "$CPU"
memory = "$MEMORY"
min_instances = "$MIN_INSTANCES"
max_instances = "$MAX_INSTANCES"
# Force new revision of the Cloud Run service without affecting domain mappings
force_replace = true
EOF

# Initialize Terraform (using local state)
echo "=== Initializing Terraform with local state ==="
terraform init

# Apply Terraform configuration with force_replace=true
echo "=== Applying Terraform configuration with force replacement ==="
terraform apply -var-file=terraform.prod.tfvars -auto-approve

# Get the deployed URL
FRONTEND_URL=$(terraform output -raw frontend_url)
echo "=== Deployment Complete ==="
echo "Frontend URL: $FRONTEND_URL" 