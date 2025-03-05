variable "project_id" {
  description = "The GCP project ID"
  type        = string
}

variable "region" {
  description = "The GCP region to deploy resources"
  type        = string
}

variable "frontend_container_image" {
  description = "The container image for the frontend service"
  type        = string
}

variable "domain_name" {
  description = "The domain name for the application"
  type        = string
}

variable "environment" {
  description = "The deployment environment (e.g., prod, staging)"
  type        = string
}

variable "cpu" {
  description = "The CPU allocation for the Cloud Run instance"
  type        = string
  default     = "1"
}

variable "memory" {
  description = "The memory allocation for the Cloud Run instance"
  type        = string
  default     = "256Mi"
}

variable "min_instances" {
  description = "The minimum number of instances"
  type        = string
  default     = "0"
}

variable "max_instances" {
  description = "The maximum number of instances"
  type        = string
  default     = "2"
} 