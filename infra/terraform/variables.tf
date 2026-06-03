variable "project_name" {
  description = "Railway project name."
  type        = string
  default     = "happyrobot-challenge"
}

variable "workspace_id" {
  description = "Railway workspace ID. Required when the Railway token has access to multiple workspaces."
  type        = string
}

variable "environment_name" {
  description = "Default Railway environment name."
  type        = string
  default     = "production"
}

variable "source_repo" {
  description = "GitHub repository connected to the API service, in owner/repo form."
  type        = string
  default     = "franalgaba/happyrobot-challenge"
}

variable "source_repo_branch" {
  description = "Git branch deployed by Railway."
  type        = string
  default     = "main"
}

variable "api_subdomain" {
  description = "Railway-provided subdomain for the API service. Must be globally unique."
  type        = string
  default     = "happyrobot-challenge-api"
}

variable "dashboard_subdomain" {
  description = "Railway-provided subdomain for the dashboard service. Must be globally unique."
  type        = string
  default     = "happyrobot-challenge-dashboard"
}

variable "client_name" {
  description = "Broker name shown in the operations dashboard shell."
  type        = string
  default     = "Acme Logistics"
}

variable "dashboard_cors_dev_origins" {
  description = "Extra comma-separated origins allowed on the API for local dashboard development."
  type        = string
  default     = "http://localhost:5173,http://localhost:4173"
}

variable "postgres_image" {
  description = "Railway SSL-enabled Postgres image."
  type        = string
  default     = "ghcr.io/railwayapp-templates/postgres-ssl:18"
}

variable "postgres_database" {
  description = "Postgres database name."
  type        = string
  default     = "railway"
}

variable "postgres_user" {
  description = "Postgres user."
  type        = string
  default     = "postgres"
}

variable "happyrobot_api_key" {
  description = "Server-only HappyRobot API key. Leave blank to omit the variable."
  type        = string
  default     = ""
  sensitive   = true
}

variable "happyrobot_cluster" {
  description = "HappyRobot cluster."
  type        = string
  default     = "us"

  validation {
    condition     = contains(["us", "eu"], var.happyrobot_cluster)
    error_message = "happyrobot_cluster must be either us or eu."
  }
}

variable "happyrobot_environment" {
  description = "HappyRobot environment."
  type        = string
  default     = "production"

  validation {
    condition     = contains(["development", "production", "staging"], var.happyrobot_environment)
    error_message = "happyrobot_environment must be development, production, or staging."
  }
}

variable "fmcsa_web_key" {
  description = "Optional FMCSA WebKey. Leave blank to omit the variable."
  type        = string
  default     = ""
  sensitive   = true
}
