# Backend infrastructure module
# This file will contain the backend infrastructure resources when implemented

# Placeholder for backend Cloud Run service

# Placeholder for backend database resources

# Placeholder for backend storage resources

# Placeholder for backend networking resources

# Placeholder for backend security resources

# Output placeholders

resource "google_cloud_run_service" "backend" {
  name     = "tunedin-backend-${var.environment}"
  location = var.region

  template {
    metadata {
      annotations = {
        "autoscaling.knative.dev/minScale" = "0"
        "autoscaling.knative.dev/maxScale" = "1"
        "run.googleapis.com/startup-cpu-boost" = "true"
      }
      labels = {
        app = "tunedin-backend"
        environment = "prod"
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
            cpu    = "1"
            memory = "512Mi"
          }
        }
        
        env {
          name  = "ENVIRONMENT"
          value = var.environment
        }
        
        # Add MongoDB connection URI directly
        env {
          name  = "MONGODB_URI"
          value = var.mongodb_uri
        }
        
        # Add Spotify API credentials
        env {
          name  = "SPOTIFY_CLIENT_ID"
          value = var.spotify_client_id
        }
        
        env {
          name  = "SPOTIFY_CLIENT_SECRET"
          value = var.spotify_client_secret
        }
        
        # Add Spring profile
        env {
          name  = "SPRING_PROFILES_ACTIVE"
          value = "prod"
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