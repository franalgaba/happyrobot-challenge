output "project_id" {
  description = "Railway project ID."
  value       = railway_project.app.id
}

output "environment_id" {
  description = "Default Railway environment ID."
  value       = railway_project.app.default_environment.id
}

output "api_service_id" {
  description = "Railway API service ID."
  value       = railway_service.api.id
}

output "postgres_service_id" {
  description = "Railway Postgres service ID."
  value       = railway_service.postgres.id
}

output "api_url" {
  description = "Public API URL."
  value       = "https://${railway_service_domain.api.domain}"
}

output "dashboard_service_id" {
  description = "Railway dashboard service ID."
  value       = railway_service.dashboard.id
}

output "dashboard_url" {
  description = "Public operations dashboard URL."
  value       = "https://${railway_service_domain.dashboard.domain}"
}

output "postgres_tcp_proxy" {
  description = "Postgres TCP proxy endpoint for one-time admin tasks."
  value       = "${railway_tcp_proxy.postgres.domain}:${railway_tcp_proxy.postgres.proxy_port}"
  sensitive   = true
}

output "api_key" {
  description = "Generated API key for authenticated API calls."
  value       = random_password.api_key.result
  sensitive   = true
}

output "mcp_path_token" {
  description = "Generated MCP path token for HappyRobot MCP URL."
  value       = random_password.mcp_path_token.result
  sensitive   = true
}
