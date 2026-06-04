# Five-Minute Demo Script

## 1. Setup

Show the deployed Hono backend, Postgres-backed seed data, and HappyRobot workflow sync command.

Key points:

- Backend exposes secure tool endpoints.
- HappyRobot API key stays server-side.
- MCP URL is registered with a path token.
- No phone number is purchased; the workflow uses Web Call.

## 2. HappyRobot Workflow

Show the inbound voice workflow:

- Web Call trigger.
- Inbound carrier sales prompt.
- MCP tools: `verify_carrier`, `search_loads`, `negotiate_offer`, `finalize_call`.
- Workflow variables for API and MCP URLs.

## 3. Short Call Demo

Use seeded eligible MC `123456`.

Suggested carrier behavior:

- Ask for Atlanta to Dallas dry van load.
- Counter above the listed rate first.
- Accept after the agent counters.

Expected result:

- Carrier verified eligible.
- Load `HR-ATL-DAL-001` pitched.
- Negotiation produces a counter or transfer mock.
- Agent says: “Transfer was successful and now you can wrap up the conversation.”

## 4. Data Capture

Show API report endpoint:

```bash
curl -H "X-API-Key: $API_KEY" "$PUBLIC_API_BASE_URL/api/reports/summary"
```

## 5. Dashboard

Open the operations dashboard (local Vite, Docker Compose on port 8080, or deployed Railway URL). See [dashboard.md](./dashboard.md).

Walk through:

- Pulse (booking rate, outcome stack)
- Expand diagnostics if needed (sentiment, negotiation policy)
- Recent calls tab with the demo call you just finalized (expand row for negotiation detail)
- Active loads and all negotiations (collapsed sections)
