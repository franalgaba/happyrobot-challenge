# Railway Terraform

This Terraform stack provisions the Railway deployment architecture for the HappyRobot challenge:

- one private Railway project,
- one production environment,
- one `api` service deployed from `franalgaba/happyrobot-challenge`,
- one `dashboard` service deployed from `apps/web/railway.json`,
- one SSL-enabled Postgres image service with a persistent volume,
- one Postgres TCP proxy for admin/migration tasks,
- Railway-provided HTTPS domains for API and dashboard,
- service variable collections for API, dashboard, and database runtime config aligned with [docs/railway-deployment.md](../../docs/railway-deployment.md).

Terraform matches the live Railway layout:

| Service | Source | Key runtime config |
| --- | --- | --- |
| `api` | root `railway.json` + `apps/api/Dockerfile` | `DATABASE_URL=${{Postgres.DATABASE_URL}}`, MCP tokens, `DEMO_CARRIER_MC_NUMBERS`, `CORS_ORIGINS` |
| `dashboard` | `apps/web/railway.json` + `apps/web/Dockerfile` | `API_BASE_URL=http://api.railway.internal:3000`, shared `API_KEY` |
| `Postgres` | Railway SSL Postgres image | persistent volume + optional TCP proxy |

## Prerequisites

Authenticate before running Terraform. Either log in with the Railway CLI (`railway login`) and export the user token, or set a project/account token:

```bash
export RAILWAY_TOKEN=...
```

If `railway link` fails with `Unauthorized` while Terraform succeeds, unset a stale `RAILWAY_TOKEN` in your shell and rely on the CLI session instead.

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

The API `railway.json` pre-deploy command runs `bun run db:migrate && bun run db:seed` on each deploy. After the first `railway up`, confirm:

```bash
curl "$(terraform output -raw api_url)/health"
curl "$(terraform output -raw dashboard_url)/health"
```

Trigger the first code deploy if Railway did not auto-build from GitHub:

```bash
railway link --project "$(terraform output -raw project_id)"
railway up --service api --ci
# dashboard uses apps/web/railway.json at repo root during deploy
cp apps/web/railway.json railway.json && railway up --service dashboard --ci
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
