variable "project_id" {
  description = "The GCP project ID"
  type        = string
}

variable "region" {
  description = "The GCP region to deploy resources"
  type        = string
}

variable "backend_container_image" {
  description = "The container image for the backend service"
  type        = string
}

variable "environment" {
  description = "The deployment environment (e.g., prod, staging)"
  type        = string
}

variable "cpu" {
  description = "The CPU allocation for the Cloud Run instance"
  type        = string
}

variable "memory" {
  description = "The memory allocation for the Cloud Run instance"
  type        = string
}

variable "min_instances" {
  description = "The minimum number of instances"
  type        = string
}

variable "max_instances" {
  description = "The maximum number of instances"
  type        = string
}

variable "api_domain_name" {
  description = "The domain name for the API (e.g., api.tunedin.app)"
  type        = string
  default     = ""
}

variable "mongodb_uri" {
  description = "The MongoDB connection URI"
  type        = string
  sensitive   = true
}

variable "spotify_client_id" {
  description = "The Spotify API client ID"
  type        = string
  sensitive   = true
}

variable "spotify_client_secret" {
  description = "The Spotify API client secret"
  type        = string
  sensitive   = true
}

variable "force_replace" {
  description = "Whether to force replacement of existing Cloud Run services"
  type        = bool
  default     = false
}

# Add more variables as needed for backend configuration 