# TunedIn Frontend Production Deployment

This document outlines the process for deploying the TunedIn frontend application to Google Cloud Run using Docker, Terraform, and the Google Cloud SDK, optimized to stay within the Google Cloud free tier.

## Prerequisites

Before deploying, ensure you have the following:

1. Google Cloud Platform (GCP) account with a project set up
2. Google Cloud SDK installed and configured
3. Docker installed
4. Git installed
5. Terraform installed (version 1.0.0 or later)

## Configuration Files

The following files are used for production deployment:

- `Dockerfile.prod`: Multi-stage Docker build for production
- `nginx.conf`: Nginx configuration for serving the frontend
- `.env.prod`: Production environment variables
- Terraform files in the `terraform/` directory

## Deployment Process

The deployment process uses Terraform to manage your infrastructure as code:

1. Update the `.env.prod` file with your production settings
2. Edit the `deploy-frontend.prod.sh` script with your GCP project ID
3. Run the deployment script:

```bash
./deploy-frontend.prod.sh
```

This script will:
- Build the Docker image locally
- Push it to Google Container Registry
- Update Terraform variables with your image details
- Apply the Terraform configuration to deploy to Cloud Run
- Display the URL of your deployed frontend

## Free Tier Optimizations

This deployment is optimized to stay within the Google Cloud free tier:

- Uses minimal container resources (256MB memory)
- Limits maximum instances to 2
- Scales to zero when not in use
- Builds and deploys from your local machine instead of using Cloud Build
- Uses Container Registry instead of Artifact Registry

## Infrastructure as Code Benefits

Using Terraform for deployment provides several advantages:

- **Version Control**: Infrastructure changes can be tracked in Git
- **Consistency**: Ensures the same environment every time
- **Documentation**: The Terraform files serve as documentation
- **Scalability**: Easy to expand as your infrastructure needs grow

## Infrastructure

The frontend is deployed as a containerized application on Google Cloud Run with the following features:

- Automatic scaling (0-2 instances)
- 1 CPU and 256MB memory per instance
- HTTPS endpoint
- Custom domain (if configured)
- Nginx serving static assets

## Monitoring and Logging

Monitoring and logging are available through Google Cloud Console:

- Cloud Run service metrics
- Cloud Logging for application logs
- Error Reporting for tracking issues

## Troubleshooting

If you encounter issues during deployment:

1. Check the Docker build logs for build errors
2. Verify your GCP project has the necessary APIs enabled (Cloud Run, Container Registry)
3. Ensure your user account has the required permissions
4. Check the Terraform logs for infrastructure errors
5. Check the Cloud Run service logs for runtime errors

## Security Considerations

The production deployment includes:

- HTTPS-only access
- Security headers in Nginx configuration
- Minimal container image (nginx:alpine)
- Content Security Policy
- No direct access to backend services 