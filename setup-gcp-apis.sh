#!/bin/bash
# =====================================================
# SCRIPT TO ENABLE REQUIRED GCP APIS
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

echo "=== Enabling required GCP APIs for TunedIn deployment ==="
echo "Project ID: $PROJECT_ID"
echo "Region: $REGION"

# Ensure gcloud is configured correctly
echo "=== Verifying gcloud configuration ==="
gcloud config set project $PROJECT_ID

# Enable required APIs
echo "=== Enabling Cloud Run API ==="
gcloud services enable run.googleapis.com

echo "=== Enabling Container Registry API ==="
gcloud services enable containerregistry.googleapis.com

echo "=== Enabling Cloud Resource Manager API ==="
gcloud services enable cloudresourcemanager.googleapis.com

echo "=== Enabling IAM API ==="
gcloud services enable iam.googleapis.com

echo "=== Enabling Cloud Logging API ==="
gcloud services enable logging.googleapis.com

echo "=== Enabling Cloud Monitoring API ==="
gcloud services enable monitoring.googleapis.com

echo "=== API setup complete ==="
echo "You can now deploy your frontend to Cloud Run using Terraform with:"
echo "./deploy-frontend.prod.sh" 