terraform {
  required_version = ">= 1.6.0"

  required_providers {
    railway = {
      source  = "terraform-community-providers/railway"
      version = "~> 0.6.2"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.7"
    }
  }
}

provider "railway" {}

resource "random_password" "api_key" {
  length  = 48
  special = false
}

resource "random_password" "mcp_path_token" {
  length  = 48
  special = false
}

resource "random_password" "mcp_auth_token" {
  length  = 48
  special = false
}

resource "random_password" "postgres_password" {
  length  = 32
  special = false
}

resource "railway_project" "app" {
  name         = var.project_name
  description  = "HappyRobot inbound carrier sales proof of concept."
  workspace_id = var.workspace_id
  private      = true

  default_environment = {
    name = var.environment_name
  }
}

resource "railway_service" "postgres" {
  name         = "Postgres"
  project_id   = railway_project.app.id
  source_image = var.postgres_image

  volume = {
    name       = "postgres-volume"
    mount_path = "/var/lib/postgresql/data"
  }
}

resource "railway_tcp_proxy" "postgres" {
  environment_id   = railway_project.app.default_environment.id
  service_id       = railway_service.postgres.id
  application_port = 5432
}

resource "railway_variable_collection" "postgres" {
  environment_id = railway_project.app.default_environment.id
  service_id     = railway_service.postgres.id

  variables = [
    {
      name  = "POSTGRES_DB"
      value = var.postgres_database
    },
    {
      name  = "POSTGRES_USER"
      value = var.postgres_user
    },
    {
      name  = "POSTGRES_PASSWORD"
      value = random_password.postgres_password.result
    },
    {
      name  = "PGDATA"
      value = "/var/lib/postgresql/data/pgdata"
    },
    {
      name  = "DATABASE_URL"
      value = "postgresql://$${{Postgres.POSTGRES_USER}}:$${{Postgres.POSTGRES_PASSWORD}}@postgres.railway.internal:5432/$${{Postgres.POSTGRES_DB}}"
    }
  ]
}

resource "railway_service" "api" {
  name               = "api"
  project_id         = railway_project.app.id
  source_repo        = var.source_repo
  source_repo_branch = var.source_repo_branch
  config_path        = "railway.json"
}

resource "railway_service_domain" "api" {
  environment_id = railway_project.app.default_environment.id
  service_id     = railway_service.api.id
  subdomain      = var.api_subdomain
}

resource "railway_service" "dashboard" {
  name               = "dashboard"
  project_id         = railway_project.app.id
  source_repo        = var.source_repo
  source_repo_branch = var.source_repo_branch
  config_path        = "apps/web/railway.json"
}

resource "railway_service_domain" "dashboard" {
  environment_id = railway_project.app.default_environment.id
  service_id     = railway_service.dashboard.id
  subdomain      = var.dashboard_subdomain
}

resource "railway_variable_collection" "api" {
  environment_id = railway_project.app.default_environment.id
  service_id     = railway_service.api.id

  variables = concat(
    [
      {
        name  = "NODE_ENV"
        value = "production"
      },
      {
        name  = "PORT"
        value = "3000"
      },
      {
        name  = "DATABASE_URL"
        value = "$${{Postgres.DATABASE_URL}}"
      },
      {
        name  = "API_KEY"
        value = random_password.api_key.result
      },
      {
        name  = "MCP_PATH_TOKEN"
        value = random_password.mcp_path_token.result
      },
      {
        name  = "MCP_AUTH_TOKEN"
        value = random_password.mcp_auth_token.result
      },
      {
        name  = "PUBLIC_API_BASE_URL"
        value = "https://${railway_service_domain.api.domain}"
      },
      {
        name  = "HAPPYROBOT_CLUSTER"
        value = var.happyrobot_cluster
      },
      {
        name  = "HAPPYROBOT_ENVIRONMENT"
        value = var.happyrobot_environment
      }
    ],
    var.happyrobot_api_key == "" ? [] : [
      {
        name  = "HAPPYROBOT_API_KEY"
        value = var.happyrobot_api_key
      }
    ],
    var.fmcsa_web_key == "" ? [] : [
      {
        name  = "FMCSA_WEB_KEY"
        value = var.fmcsa_web_key
      }
    ],
    [
      {
        name  = "CORS_ORIGINS"
        value = "https://${railway_service_domain.dashboard.domain},${var.dashboard_cors_dev_origins}"
      }
    ]
  )
}

resource "railway_variable_collection" "dashboard" {
  environment_id = railway_project.app.default_environment.id
  service_id     = railway_service.dashboard.id

  variables = [
    {
      name  = "NODE_ENV"
      value = "production"
    },
    {
      name  = "PORT"
      value = "8080"
    },
    {
      name  = "API_BASE_URL"
      value = "https://${railway_service_domain.api.domain}"
    },
    {
      name  = "API_KEY"
      value = random_password.api_key.result
    },
    {
      name  = "VITE_CLIENT_NAME"
      value = var.client_name
    }
  ]
}
