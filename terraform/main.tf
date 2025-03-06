terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }
  
  # No remote backend configuration - will use local state
}

provider "google" {
  project = var.project_id
  region  = var.region
}

provider "random" {}

# Backend module - deploy this first
module "backend" {
  source = "./modules/backend"
  
  project_id                = var.project_id
  region                    = var.region
  backend_container_image   = var.backend_container_image
  environment               = var.environment
  api_domain_name           = var.api_domain_name
  
  # Resource configuration
  cpu                       = var.backend_cpu
  memory                    = var.backend_memory
  min_instances             = var.backend_min_instances
  max_instances             = var.backend_max_instances
  
  # Database configuration
  mongodb_uri               = var.mongodb_uri
  
  # Spotify API configuration
  spotify_client_id         = var.spotify_client_id
  spotify_client_secret     = var.spotify_client_secret
  
  # Force replacement configuration
  force_replace             = var.force_replace
}

# Frontend module - deploy after backend
module "frontend" {
  source = "./modules/frontend"
  
  project_id                = var.project_id
  region                    = var.region
  frontend_container_image  = var.frontend_container_image
  domain_name               = var.domain_name
  environment               = var.environment
  
  # Pass the backend API URL to the frontend
  backend_api_url           = module.backend.backend_api_url
  
  # Resource configuration
  cpu                       = var.frontend_cpu
  memory                    = var.frontend_memory
  min_instances             = var.frontend_min_instances
  max_instances             = var.frontend_max_instances
  
  # Force replacement configuration
  force_replace             = var.force_replace
} 