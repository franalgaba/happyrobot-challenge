# Railway Terraform

This Terraform stack provisions the Railway deployment architecture for the HappyRobot challenge:

- one private Railway project,
- one production environment,
- one `api` service deployed from `franalgaba/happyrobot-challenge`,
- one `dashboard` service deployed from `apps/web/railway.json`,
- one SSL-enabled Postgres image service with a persistent volume,
- one Postgres TCP proxy for admin/migration tasks,
- Railway-provided HTTPS domains for API and dashboard,
- service variable collections for API, dashboard, and database runtime config.

## Prerequisites

Set a Railway account or workspace token before running Terraform:

```bash
export RAILWAY_TOKEN=...
```

Create a local variables file:

```bash
cp terraform.tfvars.example terraform.tfvars
```

If the Railway token has access to more than one workspace, keep `workspace_id` set:

```text
<railway-workspace-id>
```

## Recreate In Another Environment

Use unique `project_name`, `api_subdomain`, and `dashboard_subdomain` per environment:

```bash
terraform init
terraform plan
terraform apply
```

After apply, run the database setup against the generated TCP proxy or from a Railway shell:

```bash
bun run db:migrate
bun run db:seed
```

## Adopt An Existing Railway Project

If a Railway project was created with the CLI or UI first, import it before letting Terraform manage it:

```text
project:     <railway-project-name>
project_id:  <railway-project-id>
environment: production
api:         <api-service-id>
postgres:    <postgres-service-id>
dashboard:   <dashboard-service-id>
```

To manage that exact project with Terraform instead of recreating it, initialize Terraform and import the project and services before planning. Variable collections and generated secrets need careful manual reconciliation because Terraform will otherwise replace them with its own generated values.

```bash
terraform init
terraform import railway_project.app <railway-project-id>
terraform import railway_service.api <api-service-id>
terraform import railway_service.postgres <postgres-service-id>
terraform import railway_service.dashboard <dashboard-service-id>
```

Run `terraform plan` after imports and review every change before applying.

After apply, open `terraform output dashboard_url` for the public operations dashboard.

See [docs/dashboard.md](../../docs/dashboard.md) for dashboard environment variables and troubleshooting.
