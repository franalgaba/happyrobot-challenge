# Operations Dashboard

Client-facing metrics UI for the inbound carrier sales proof of concept. It is built for **two audiences** with the same view:

- **Broker operations** (e.g. Acme Logistics) monitoring call outcomes, negotiations, and load inventory.
- **Vendor evaluation** (HappyRobot prospect meetings) demonstrating product vision without using HappyRobot platform analytics.

The dashboard reads the custom reporting API only. It does not configure workflows or agents.

## Stack

| Piece | Location |
| --- | --- |
| App | `apps/web` (Vite + React) |
| Static server | `apps/web/server.mjs` (Bun, serves `dist/`) |
| Container | `apps/web/Dockerfile` |
| Railway config | `apps/web/railway.json` |
| Design context | `.impeccable.md` |

## What It Shows

### Summary (top of page)

- Total finalized calls
- Booked count and book rate
- Average agreed rate
- Negotiation totals (accepted / countered / rejected)

### Distributions

- **Call outcomes** — `booked`, `rejected`, `no_match`, `ineligible`, `transferred`, `follow_up`, `human_review`
- **Carrier sentiment** — `positive`, `neutral`, `negative`, `mixed`
- **Carrier verification** — live FMCSA vs seeded fallback
- **Negotiation policy** — accepted / countered / rejected counts

### Tables

- **Recent calls** — MC, load, outcome, sentiment, agreed rate, summary
- **Active loads** — lane, equipment, rates (board / target / max auto)
- **Negotiations** — rounds, status, last offer/counter, agreed rate

Data refreshes automatically every 30 seconds (TanStack Query), and also when you return to the tab or regain network connectivity.

## API Integration

Browser requests go to the dashboard server on the same origin. The dashboard server proxies these read-only report endpoints to the API and injects `X-API-Key` server-side:

```text
GET /api/reports/summary
GET /api/reports/calls
GET /api/reports/loads
GET /api/reports/negotiations
```

The browser must be allowed by the API `CORS_ORIGINS` setting. Default local origins:

```text
http://localhost:5173
http://localhost:4173
http://localhost:8080
```

## Environment Variables

Set in `apps/web/.env.local` for Vite dev, or as Railway / Docker **runtime** variables for production. The dashboard server uses these values to proxy report requests to the API without exposing the API key to browser code.

| Variable | Required | Description |
| --- | --- | --- |
| `API_BASE_URL` | Yes | API origin reachable from the dashboard server, e.g. `http://localhost:3000` locally or `https://<api-service>.up.railway.app` on Railway |
| `API_KEY` | Yes | Same value as API `API_KEY`; injected server-side by the dashboard proxy |
| `VITE_CLIENT_NAME` | No | Broker label in header (default: `Acme Logistics`) |

On the **API** service:

| Variable | Description |
| --- | --- |
| `CORS_ORIGINS` | Comma-separated dashboard origins |

**Security note:** the dashboard does not ship `API_KEY` to the browser. Browser requests go to the dashboard server, which proxies only read-only report endpoints and injects the key server-side. See [security-poc.md](./security-poc.md) for remaining POC assumptions.

## Local Development

1. Start Postgres and the API (see root `README.md`), or use Docker Compose (below).
2. Configure the dashboard:

   ```bash
   cp apps/web/.env.example apps/web/.env.local
   ```

   ```text
   API_BASE_URL=http://localhost:3000
   API_KEY=<same as API_KEY in .env>
   VITE_CLIENT_NAME=Acme Logistics
   ```

3. Ensure API `CORS_ORIGINS` includes `http://localhost:5173` (see root `.env.example`).
4. Run:

   ```bash
   bun install
   bun run dev:web
   ```

5. Open [http://localhost:5173](http://localhost:5173).

### Production build (local)

```bash
bun run build:web
bun --filter @happyrobot-challenge/web start
```

Preview server: [http://localhost:8080](http://localhost:8080) (set `PORT` to override).

## Docker Compose

The root `docker-compose.yml` includes `postgres`, `api`, and `dashboard`.

```bash
docker compose up --build
```

| Service | URL |
| --- | --- |
| API | http://localhost:3000 |
| Dashboard | http://localhost:8080 |

The dashboard container is configured with:

- `API_BASE_URL=http://api:3000` (server-to-server API URL inside Compose)
- `API_KEY=local-dev-api-key` (injected by the dashboard proxy, not the browser)

API `CORS_ORIGINS` in compose includes `http://localhost:8080`.

The API container runs migrations and seeds local demo data before it starts.

## Railway Deployment

The `dashboard` service is deployed separately from `api`:

- **Build:** `apps/web/Dockerfile` via `apps/web/railway.json`
- **Health check:** `GET /health`
- **Port:** `8080`

GitHub Actions (`.github/workflows/railway-deploy.yml`) deploys `api` then `dashboard` on pushes to `main`.

### Required variables (dashboard service)

```text
NODE_ENV=production
PORT=8080
API_BASE_URL=https://<api-service>.up.railway.app
API_KEY=<same value as the API service API_KEY>
VITE_CLIENT_NAME=Acme Logistics
```

Restart or redeploy the dashboard after changing `API_BASE_URL` or `API_KEY`. Redeploy after changing any `VITE_*` value so the static bundle is rebuilt.

### API CORS (production)

```text
CORS_ORIGINS=https://<dashboard-service>.up.railway.app,http://localhost:5173,http://localhost:4173
```

Terraform sets this automatically when using `infra/terraform` (see `dashboard_url` output).

Full platform notes: [railway-deployment.md](./railway-deployment.md).

## Branding and Theme

- **HappyRobot** logo and wordmark in the header; **client name** (e.g. Acme Logistics) as secondary line.
- **Geist** + **Instrument Serif** + **Geist Mono**; OKLCH tokens; skip link and `:focus-visible` rings.
- **Connection pill** reflects API state (live / connecting / error).
- Logo assets:
  - Light UI: `apps/web/public/happyrobot-logo-light.png`
  - Dark UI: `apps/web/public/happyrobot-logo-dark.png`
- **Theme switcher** in the header (light / dark). Preference is stored in `localStorage` under `hr-dashboard-theme`.
- Visual direction is documented in `.impeccable.md` (minimal black/white, serif headlines, sparse accent color).

## Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Blank error banner on load | Missing `VITE_*` or wrong API URL | Check `apps/web/.env.local` or Railway build vars |
| CORS error in browser console | API `CORS_ORIGINS` missing dashboard origin | Add your Vite port (`5173`), preview (`4173`), or compose URL (`8080`) |
| 401 on API calls | Dashboard `API_KEY` does not match API `API_KEY` | Align runtime keys and restart the dashboard service |
| Empty metrics after demo | No finalized calls in DB | Run a Web Call and `finalize_call`; or `bun run db:seed` |
| Stale production data | Old static build | Redeploy dashboard after API/data changes (auto-refresh only re-fetches API) |

## Demo Flow

For a five-minute walkthrough that includes the dashboard, see [demo-script.md](./demo-script.md) §5.

Quick check after a call:

```bash
curl -H "X-API-Key: $API_KEY" "$PUBLIC_API_BASE_URL/api/reports/summary"
```

Then open the dashboard and confirm the new call appears under **Recent calls**.

## Related Docs

- [acme-logistics-build-description.md](./acme-logistics-build-description.md) — broker-facing build summary
- [railway-deployment.md](./railway-deployment.md) — API, Postgres, dashboard on Railway
- [infra/terraform/README.md](../infra/terraform/README.md) — IaC for all three services
