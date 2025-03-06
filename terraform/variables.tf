variable "project_id" {
  description = "The GCP project ID"
  type        = string
}

variable "region" {
  description = "The GCP region to deploy resources"
  type        = string
  default     = "us-central1"
}

variable "environment" {
  description = "The deployment environment (e.g., prod, staging)"
  type        = string
  default     = "prod"
}

# Domain configuration
variable "domain_name" {
  description = "The domain name for the application"
  type        = string
  default     = ""
}

# Frontend configuration
variable "frontend_container_image" {
  description = "The container image for the frontend service"
  type        = string
}

variable "frontend_cpu" {
  description = "The CPU allocation for the frontend Cloud Run instance"
  type        = string
  default     = "1"
}

variable "frontend_memory" {
  description = "The memory allocation for the frontend Cloud Run instance"
  type        = string
  default     = "256Mi"
}

variable "frontend_min_instances" {
  description = "The minimum number of frontend instances"
  type        = string
  default     = "0"
}

variable "frontend_max_instances" {
  description = "The maximum number of frontend instances"
  type        = string
  default     = "2"
}

# Backend configuration
variable "backend_container_image" {
  description = "The container image for the backend service"
  type        = string
}

variable "backend_cpu" {
  description = "The CPU allocation for the backend Cloud Run instance"
  type        = string
  default     = "1"
}

variable "backend_memory" {
  description = "The memory allocation for the backend Cloud Run instance"
  type        = string
  default     = "512Mi"
}

variable "backend_min_instances" {
  description = "The minimum number of backend instances"
  type        = string
  default     = "0"
}

variable "backend_max_instances" {
  description = "The maximum number of backend instances"
  type        = string
  default     = "2"
}

variable "api_domain_name" {
  description = "The domain name for the API (e.g., api.tunedin.app)"
  type        = string
  default     = ""
}

# Database configuration
variable "mongodb_uri" {
  description = "The MongoDB connection URI"
  type        = string
  sensitive   = true
}

# Spotify API configuration
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

# Force replacement configuration
variable "force_replace" {
  description = "Whether to force replacement of existing Cloud Run services"
  type        = bool
  default     = false
} 