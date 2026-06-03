# Security Posture For The POC

This project is a controlled proof of concept for the HappyRobot inbound carrier sales flow. It is not a production auth model. The notes below document the accepted POC risks and the conditions that must change before broader public or multi-user use.

## Dashboard API Proxy

The dashboard no longer compiles an API key into the browser bundle. Browser code calls same-origin report endpoints, and the dashboard server proxies only the read-only report API paths while injecting `X-API-Key` from its server-side `API_KEY` environment variable.

Current controls:

- No `VITE_API_KEY` or API secret is required at build time.
- The dashboard proxy allows only `GET` and `HEAD` for:
  - `/api/reports/summary`
  - `/api/reports/calls`
  - `/api/reports/loads`
  - `/api/reports/negotiations`
- Tool and voice-token routes are not proxied by the dashboard server.

Before production:

- Add user/session auth in front of the dashboard if it is accessible beyond trusted evaluators.
- Split API capabilities into scoped credentials, such as reporting read access, voice token creation, and tool mutation access.
- Add audit logging for the authenticated actor or service account.

## MCP Path Token

HappyRobot MCP registration currently uses a URL:

```text
https://<api-service>.up.railway.app/mcp/<MCP_PATH_TOKEN>
```

The local HappyRobot SDK reference documents MCP registration by URL only, without custom auth headers. For that reason, the POC uses an unguessable path token rather than `X-API-Key` or `Authorization`.

Controls currently in place:

- Wrong MCP tokens return `404`.
- Runtime logging redacts `/mcp/<token>` as `/mcp/<redacted>`.
- Terraform-generated MCP tokens are 48 random alphanumeric characters.

Before production:

- Prefer header-based `Authorization: Bearer` auth when HappyRobot supports it for MCP server registration.
- Rotate `MCP_PATH_TOKEN` if a full MCP URL is exposed in logs, screenshots, or shared tooling.
- Keep the MCP URL out of public docs, browser code, analytics, and issue trackers.

## FMCSA WebKey

FMCSA QCMobile lookups use a `webKey` query parameter in the request URL. The current implementation does not log the FMCSA URL, but query-string credentials can still appear in upstream provider logs or network telemetry.

Current POC handling:

- `FMCSA_WEB_KEY` is optional.
- If FMCSA is unavailable, carrier verification falls back to seeded data and marks the response as simulated.
- The key must be stored only in environment variables and never committed.

Before production:

- Use a header-based FMCSA auth mechanism if FMCSA provides one for the chosen endpoint.
- Rotate `FMCSA_WEB_KEY` periodically and immediately after suspected exposure.
- Treat FMCSA logs and any proxy/APM logs as sensitive if they capture full upstream URLs.

## Railway Postgres TCP Proxy

The Terraform stack provisions a Railway TCP proxy for Postgres to support one-time bootstrap and admin tasks. This exposes a public database endpoint and is not required for normal API operation because the API uses Railway private networking.

For the POC:

- Use the TCP proxy only for setup, inspection, migrations, or seed tasks when a Railway shell is not available.
- Keep Postgres credentials in Railway variables and Terraform state only.

Before production:

- Disable or remove the TCP proxy after bootstrap.
- Prefer Railway private networking, Railway shell, or another controlled admin path.
- If external database access is unavoidable, use additional controls such as IP allowlisting, VPN, short-lived credentials, and strict credential rotation.

## Terraform State

Terraform generates and stores `API_KEY`, `MCP_PATH_TOKEN`, and the Postgres password. These values are marked sensitive in outputs, but they still exist in Terraform state.

For the POC:

- Do not commit `terraform.tfstate` or plan files.
- Keep local state on a trusted machine only.

Before production or team use:

- Move Terraform state to an encrypted remote backend with restricted access and locking, such as Terraform Cloud or an encrypted object store.
- Limit state access to maintainers who are allowed to read generated secrets.
- Rotate generated secrets if state access is broadened or suspected to be exposed.

## Dev Defaults

Docker Compose uses predictable local values such as `postgres`, `local-dev-api-key`, and `local-dev-mcp-token`. These are development defaults only.

Do not expose the Compose stack directly to the public internet. Use Railway secrets or another secret manager for deployed environments.
