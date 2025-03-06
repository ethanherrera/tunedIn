variable "project_id" {
  description = "The Google Cloud project ID"
  type        = string
}

variable "region" {
  description = "The Google Cloud region"
  type        = string
}

variable "environment" {
  description = "The deployment environment (e.g., dev, prod)"
  type        = string
}

variable "frontend_container_image" {
  description = "The container image for the frontend"
  type        = string
}

variable "domain_name" {
  description = "The custom domain name for the frontend"
  type        = string
  default     = ""
}

variable "cpu" {
  description = "The CPU allocation for the frontend"
  type        = string
  default     = "1"
}

variable "memory" {
  description = "The memory allocation for the frontend"
  type        = string
  default     = "512Mi"
}

variable "min_instances" {
  description = "The minimum number of instances"
  type        = string
  default     = "0"
}

variable "max_instances" {
  description = "The maximum number of instances"
  type        = string
  default     = "1"
}

variable "backend_api_url" {
  description = "The URL of the backend API"
  type        = string
}

variable "force_replace" {
  description = "Whether to force replacement of existing Cloud Run services"
  type        = bool
  default     = false
} 