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

# Add more variables as needed for backend configuration 