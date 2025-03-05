# TunedIn Production Deployment Guide

This guide explains how to deploy the TunedIn application to Google Cloud Platform using Terraform while staying within the free tier.

## Frontend Deployment

The frontend is deployed to Google Cloud Run using Terraform, which offers a generous free tier:
- 2 million requests per month
- 360,000 vCPU-seconds per month
- 180,000 GiB-seconds per month

## Configuration

All deployment configuration is centralized in a single file:

1. **Edit the configuration file**:
   - Open `config.prod.sh` and update the variables with your specific values:
   ```bash
   # Required
   export PROJECT_ID="your-gcp-project-id"  # Your GCP project ID
   export API_BASE_URL="https://your-backend-url.a.run.app/api"  # Your backend API URL
   
   # Optional (defaults provided)
   export REGION="us-central1"              # GCP region for deployment
   export DOMAIN_NAME=""                    # Custom domain (if any)
   export MEMORY="256Mi"                    # Memory per instance
   export MAX_INSTANCES="2"                 # Maximum number of instances
   ```

## Deployment Steps

1. **Set up your GCP project**:
   - Create a new GCP project or use an existing one
   - Enable the required APIs by running:
     ```
     ./setup-gcp-apis.sh
     ```

2. **Deploy the frontend**:
   - Run the deployment script:
     ```
     ./deploy-frontend.prod.sh
     ```
   - This will:
     - Generate the `.env.prod` file with your API URL
     - Build and push the Docker image
     - Deploy to Cloud Run using Terraform
     - Display the URL of your deployed frontend

3. **Access your application**:
   - The deployment script will output the URL of your deployed frontend
   - You can also find it in the Google Cloud Console under Cloud Run

## Free Tier Optimizations

The deployment is optimized to stay within the Google Cloud free tier:

- **Minimal resource usage**: 256MB memory per instance
- **Limited scaling**: Maximum of 2 instances
- **Scale to zero**: Instances scale down to zero when not in use
- **Local builds**: Builds happen on your local machine instead of using Cloud Build
- **Container Registry**: Uses Container Registry instead of Artifact Registry

## Customizing Resources

You can customize the resource allocation by editing the `config.prod.sh` file:

```bash
# Resource Configuration
export MEMORY="256Mi"        # Increase for more memory-intensive workloads
export CPU="1"               # CPU allocation per instance
export MIN_INSTANCES="0"     # Set to 1+ to avoid cold starts
export MAX_INSTANCES="2"     # Increase for higher traffic
```

## Monitoring and Costs

- Monitor your usage in the Google Cloud Console
- Set up budget alerts to avoid unexpected charges
- Remember that exceeding the free tier limits will incur charges

## Troubleshooting

If you encounter issues:

1. Check that all required APIs are enabled
2. Verify your GCP project ID is correct in `config.prod.sh`
3. Ensure your user account has the necessary permissions
4. Check Terraform logs with `terraform plan` to diagnose issues
5. Check the Cloud Run service logs for runtime errors

## Terraform Commands

Useful Terraform commands for managing your deployment:

- `terraform plan`: Preview changes before applying
- `terraform apply`: Apply changes to your infrastructure
- `terraform destroy`: Remove all resources created by Terraform
- `terraform output`: View outputs like your frontend URL 