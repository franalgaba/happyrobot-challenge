# HappyRobot Inbound Carrier Sales POC

Proof of concept for automating inbound carrier load sales with HappyRobot.

The core service is a TypeScript Hono API backed by Postgres and Drizzle. It exposes secure HappyRobot tool endpoints for carrier verification, load search, price negotiation, post-call finalization, reporting data, and Web Call token smoke testing. A small dashboard reads the reporting APIs through a server-side proxy.

## Stack

- Hono on Node/Bun
- Postgres with Drizzle schema and SQL migrations
- Zod request/response validation
- HappyRobot TypeScript SDK
- Docker and Railway-ready deployment

## Local Setup

One-command local setup:

```bash
bun run dev:up
```

This starts Docker Postgres, runs migrations, seeds demo data, and launches the backend in the background. Local development uses `http://127.0.0.1:3000`; HappyRobot workflow sync should use the deployed Railway URL.

Stop the local stack with:

```bash
bun run dev:down
```

1. Copy `.env.example` to `.env` and set at least:
   - `DATABASE_URL` (`postgres://postgres:postgres@127.0.0.1:55432/happyrobot_challenge` for local Docker)
   - `API_KEY`
   - `MCP_PATH_TOKEN`
   - `MCP_AUTH_TOKEN`
   - `PUBLIC_API_BASE_URL`
   - `FMCSA_WEB_KEY` for live FMCSA verification in production-like runs

   Local demos may use seeded carrier fallback with `ALLOW_SEEDED_CARRIER_FALLBACK=true`. Production uses live FMCSA for real MCs, while `DEMO_CARRIER_MC_NUMBERS` keeps scripted demo MCs such as `123456` available from seeded data if FMCSA is unavailable.
2. Start Postgres (or the full Docker stack):
   ```bash
   docker compose up postgres
   ```

   API + dashboard + Postgres:

   ```bash
   docker compose up --build
   ```

   - API: http://localhost:3000
   - Dashboard: http://localhost:8080
3. Install dependencies:
   ```bash
   bun install
   ```
4. Run migrations and seed demo data:
   ```bash
   bun run db:migrate
   bun run db:seed
   ```
5. Start the API:
   ```bash
   bun run dev
   ```

Health check:

```bash
curl http://localhost:3000/health
```

Authenticated API calls require:

```bash
X-API-Key: <API_KEY>
```

## Core Routes

- `POST /api/tools/verify-carrier`
- `POST /api/tools/search-loads`
- `POST /api/tools/negotiate-offer`
- `POST /api/tools/finalize-call`
- `GET /api/reports/summary`
- `GET /api/reports/calls`
- `GET /api/reports/loads`
- `GET /api/reports/negotiations`
- `POST /api/voice/token`

MCP endpoint for HappyRobot:

```text
POST /mcp/<MCP_PATH_TOKEN>
```

## HappyRobot Workflow Sync

HappyRobot requires a stable public HTTPS API. Use the Railway deployment URL for `PUBLIC_API_BASE_URL`.

Dry-run the SDK sync:

```bash
PUBLIC_API_BASE_URL=https://<api-service>.up.railway.app \
MCP_PATH_TOKEN=<token> \
MCP_AUTH_TOKEN=<bearer-token> \
HAPPYROBOT_API_KEY=<key> \
bun run happyrobot:sync -- --dry-run
```

Create/update resources:

```bash
bun run happyrobot:sync
```

Publish after verification:

```bash
bun run happyrobot:sync -- --publish
```

The sync script creates or updates an `inbound-voice-agent` workflow where possible, registers the Hono MCP server with Bearer auth, syncs workflow variables, inspects nodes, and prints manual Builder fallback steps if SDK node attachment is not fully supported by the current template/schema.

## Operations Dashboard

Client-facing metrics UI in `apps/web` (Vite + React). See **[docs/dashboard.md](docs/dashboard.md)** for setup, Docker Compose, Railway/Terraform deploy, environment variables, branding, and troubleshooting.

Quick start:

```bash
cp apps/web/.env.example apps/web/.env.local
bun run dev:web
```

Open [http://localhost:5173](http://localhost:5173).

## Tests

```bash
bun run test
bun run typecheck
bun run validate
```

## Deployment

Pushes to `main` validate and deploy the API and dashboard services to Railway through GitHub Actions. Railway runs API migrations and seed data as a pre-deploy step before starting the server. See [docs/railway-deployment.md](docs/railway-deployment.md).
