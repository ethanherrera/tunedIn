# Generate a random ID for the revision suffix
resource "random_id" "revision_suffix" {
  byte_length = 4
  keepers = {
    # Generate a new ID when the image changes or force_replace is true
    image = var.frontend_container_image
    force_replace = var.force_replace ? timestamp() : "static"
  }
}

resource "google_cloud_run_service" "frontend" {
  name     = "tunedin-frontend-${var.environment}"
  location = var.region

  template {
    spec {
      containers {
        image = var.frontend_container_image
        
        ports {
          container_port = 8080
        }
        
        resources {
          limits = {
            cpu    = var.cpu
            memory = var.memory
          }
        }
        
        env {
          name  = "ENVIRONMENT"
          value = var.environment
        }
        
        env {
          name  = "VITE_API_BASE_URL"
          value = var.backend_api_url
        }
      }
      
      # Set a longer timeout for container startup
      timeout_seconds = 300
    }

    metadata {
      annotations = {
        "autoscaling.knative.dev/minScale" = var.min_instances
        "autoscaling.knative.dev/maxScale" = var.max_instances
        # Increase the startup timeout
        "run.googleapis.com/startup-cpu-boost" = "true"
        # Add a unique revision name suffix using the random ID
        "run.googleapis.com/revision-name-suffix" = random_id.revision_suffix.hex
      }
      labels = {
        "environment" = var.environment
        "app"         = "tunedin-frontend"
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }

  autogenerate_revision_name = true
}

# Allow unauthenticated access to the frontend
resource "google_cloud_run_service_iam_member" "frontend_public" {
  service  = google_cloud_run_service.frontend.name
  location = google_cloud_run_service.frontend.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# Create a Cloud Run domain mapping if a domain is provided
resource "google_cloud_run_domain_mapping" "frontend" {
  count    = var.domain_name != "" ? 1 : 0
  location = var.region
  name     = var.domain_name

  metadata {
    namespace = var.project_id
  }

  spec {
    route_name = google_cloud_run_service.frontend.name
  }
} 