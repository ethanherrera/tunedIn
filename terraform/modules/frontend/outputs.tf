# Frontend module outputs
output "frontend_url" {
  value       = google_cloud_run_service.frontend.status[0].url
  description = "The URL of the frontend service"
}

output "frontend_name" {
  value       = google_cloud_run_service.frontend.name
  description = "The name of the frontend service"
} 