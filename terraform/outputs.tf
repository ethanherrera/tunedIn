# Frontend outputs
output "frontend_url" {
  value = module.frontend.frontend_url
  description = "The URL of the frontend service"
}

# Backend outputs
output "backend_url" {
  value = module.backend.backend_url
  description = "The URL of the backend service"
} 