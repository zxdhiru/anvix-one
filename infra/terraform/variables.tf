# ============================================================================
# Variables
# ============================================================================

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "ap-south-1"
}

variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "production"
}

variable "github_org" {
  description = "GitHub organization or username"
  type        = string
}

variable "github_repo" {
  description = "GitHub repository name"
  type        = string
  default     = "anvix-one"
}

variable "db_username" {
  description = "Database master username"
  type        = string
  default     = "anvix"
  sensitive   = true
}

variable "db_password" {
  description = "Database master password"
  type        = string
  sensitive   = true
}

variable "api_env_vars" {
  description = "Environment variables for the API"
  type        = map(string)
  default     = {}
  sensitive   = true
}
