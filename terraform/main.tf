terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
  
  # No remote backend configuration - will use local state
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# Frontend module
module "frontend" {
  source = "./modules/frontend"
  
  project_id                = var.project_id
  region                    = var.region
  frontend_container_image  = var.frontend_container_image
  domain_name               = var.domain_name
  environment               = var.environment
  
  # Resource configuration
  cpu                       = var.frontend_cpu
  memory                    = var.frontend_memory
  min_instances             = var.frontend_min_instances
  max_instances             = var.frontend_max_instances
}

# Backend module - commented out until implementation
# module "backend" {
#   source = "./modules/backend"
#   
#   project_id                = var.project_id
#   region                    = var.region
#   backend_container_image   = var.backend_container_image
#   environment               = var.environment
#   
#   # Resource configuration
#   cpu                       = var.backend_cpu
#   memory                    = var.backend_memory
#   min_instances             = var.backend_min_instances
#   max_instances             = var.backend_max_instances
# } 