# Backend module outputs
# These will be defined when the backend infrastructure is implemented

output "backend_url" {
  value       = google_cloud_run_service.backend.status[0].url
  description = "The URL of the deployed backend service"
}

output "backend_api_url" {
  value       = "${google_cloud_run_service.backend.status[0].url}/api"
  description = "The API URL of the deployed backend service"
}

output "backend_name" {
  value       = google_cloud_run_service.backend.name
  description = "The name of the backend service"
} 