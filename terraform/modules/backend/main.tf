# Backend infrastructure module
# This file will contain the backend infrastructure resources when implemented

# Placeholder for backend Cloud Run service

# Placeholder for backend database resources

# Placeholder for backend storage resources

# Placeholder for backend networking resources

# Placeholder for backend security resources

# Generate a random ID for the revision suffix
resource "random_id" "revision_suffix" {
  byte_length = 4
  keepers = {
    # Generate a new ID when the image changes or force_replace is true
    image = var.backend_container_image
    force_replace = var.force_replace ? timestamp() : "static"
  }
}

# Output placeholders

resource "google_cloud_run_service" "backend" {
  name     = "tunedin-backend-${var.environment}"
  location = var.region

  # Add a random suffix to force replacement when force_replace is true
  template {
    metadata {
      annotations = {
        "autoscaling.knative.dev/minScale" = var.min_instances
        "autoscaling.knative.dev/maxScale" = var.max_instances
        "run.googleapis.com/startup-cpu-boost" = "true"
        # Add a unique revision name suffix using the random ID
        "run.googleapis.com/revision-name-suffix" = random_id.revision_suffix.hex
      }
      labels = {
        app = "tunedin-backend"
        environment = var.environment
      }
    }

    spec {
      containers {
        image = var.backend_container_image
        
        ports {
          container_port = 8080
        }
        
        resources {
          limits = {
            cpu    = var.cpu
            memory = var.memory
          }
        }
        
        # Set environment variables
        env {
          name  = "MONGODB_URI"
          value = var.mongodb_uri
        }
        
        env {
          name  = "SPOTIFY_CLIENT_ID"
          value = var.spotify_client_id
        }
        
        env {
          name  = "SPOTIFY_CLIENT_SECRET"
          value = var.spotify_client_secret
        }
        
        env {
          name  = "ENVIRONMENT"
          value = var.environment
        }
      }
      
      # Set a longer timeout for container startup
      timeout_seconds = 300
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }

  autogenerate_revision_name = true

  # Force replacement of the service when force_replace is true
  lifecycle {
    replace_triggered_by = [
      random_id.revision_suffix
    ]
  }
}

# Allow unauthenticated access to the backend API
resource "google_cloud_run_service_iam_member" "backend_public" {
  service  = google_cloud_run_service.backend.name
  location = google_cloud_run_service.backend.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# Create a Cloud Run domain mapping if a domain is provided for the API
resource "google_cloud_run_domain_mapping" "backend" {
  count    = var.api_domain_name != "" ? 1 : 0
  location = var.region
  name     = var.api_domain_name

  metadata {
    namespace = var.project_id
  }

  spec {
    route_name = google_cloud_run_service.backend.name
  }
} 