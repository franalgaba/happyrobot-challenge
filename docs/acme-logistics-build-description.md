# Acme Logistics Inbound Carrier Sales Build Description

## Overview

Acme Logistics asked for a proof of concept that can automate inbound carrier sales calls without losing operational control over carrier vetting, load matching, pricing policy, and post-call reporting.

The delivered build uses HappyRobot for the inbound voice conversation and a custom TypeScript backend for freight operations logic. The backend stores loads, carriers, negotiations, and finalized call records in Postgres, then exposes secure tool endpoints that the HappyRobot workflow can call during the conversation.

The system is designed for Web Call demos, which matches the challenge constraint of not purchasing a phone number.

## What Was Built

- Inbound carrier sales workflow support for HappyRobot.
- Secure API tool endpoints for carrier verification, load search, negotiation, and call finalization.
- Postgres data model for loads, carrier verification records, negotiations, and call outcomes.
- Deterministic negotiation policy with per-load target rates, max auto-approval rates, and a three-round limit.
- Reporting endpoints that provide use case metrics outside of HappyRobot platform analytics.
- Dockerized service with Railway deployment instructions.
- HappyRobot SDK sync script for registering the MCP server and workflow variables.

## Architecture

The proof of concept has three main parts:

1. HappyRobot voice workflow

   The workflow starts from a Web Call trigger, speaks with the carrier, gathers required fields, and calls backend tools through the registered MCP server.

2. Freight operations API

   The API is a Hono service running on Node/Bun. It validates requests with Zod and exposes:

   - `POST /api/tools/verify-carrier`
   - `POST /api/tools/search-loads`
   - `POST /api/tools/negotiate-offer`
   - `POST /api/tools/finalize-call`
   - `GET /api/reports/summary`
   - `GET /api/reports/calls`
   - `GET /api/reports/loads`
   - `GET /api/reports/negotiations`
   - `POST /api/voice/token`

3. Postgres database

   The database stores freight-specific records rather than relying only on conversation transcripts. This makes the reporting layer reproducible and suitable for future dashboards.

## Carrier Flow

1. The carrier starts a Web Call with the HappyRobot inbound voice workflow.
2. The agent asks for an MC number.
3. The backend verifies carrier eligibility through FMCSA for real MCs. Scripted demo MCs such as `123456` can use seeded data if FMCSA is unavailable, keeping the POC demo reliable.
4. Eligible carriers are matched to active loads by lane, equipment type, and pickup timing.
5. The agent pitches the best load and asks whether the carrier wants it.
6. If the carrier counters, the negotiation tool applies per-load target and max rates for up to three rounds.
7. If a rate is accepted, the negotiation tool returns a carrier-facing booking confirmation and the agent wraps up naturally.
8. The call is finalized with extracted fields, outcome classification, sentiment, transcript, and summary.

## Load Matching

Loads are stored with the fields required for carrier sales:

- Load ID
- Origin and destination
- Pickup and delivery datetime
- Equipment type
- Loadboard rate
- Notes
- Weight
- Commodity type
- Number of pieces
- Miles
- Dimensions

The search tool scores active loads using lane, equipment type, and pickup date proximity. It returns a short pitch string so the voice agent can describe the load consistently.

## Negotiation Policy

Each load has:

- `loadboard_rate`: public listed rate
- `target_rate`: preferred acceptance threshold
- `max_auto_rate`: highest rate the agent may accept automatically

The negotiation service allows up to three carrier counteroffers:

- Round 1 accepts offers at or below the target rate.
- Round 2 counters toward the midpoint between target and max auto rate.
- Round 3 accepts up to the max auto rate or rejects the offer.

When an offer is accepted, the backend returns the required mock transfer message for the Web Call demo.

## Data Captured

- Carrier MC/DOT/legal name and eligibility source.
- Load details, including origin, destination, schedule, equipment, commodity, weight, pieces, miles, dimensions, notes, and rate.
- Negotiation rounds, offers, counters, agreement, or rejection.
- Call outcome and sentiment for future dashboard reporting.

## Reporting and Metrics

The reporting API is separate from HappyRobot analytics. It exposes:

- Total finalized calls.
- Calls grouped by outcome.
- Calls grouped by carrier sentiment.
- Average agreed rate for booked loads.
- Negotiation totals by accepted, rejected, and countered status.
- Carrier verification source counts, split between live FMCSA and seeded demo records.
- Detailed call, load, and negotiation records for a dashboard table view.

This gives Acme Logistics a broker-owned reporting mechanism. A client-facing operations dashboard is included (`apps/web`; see [dashboard.md](./dashboard.md)). CSV export or BI integration can follow the same API.

## Security

All `/api/*` endpoints require `X-API-Key`. HappyRobot API keys stay server-side. The MCP endpoint uses an unguessable URL token because the current SDK reference exposes MCP registration by URL.

In production, Railway provides HTTPS for the public API URL. Local development can run over plain HTTP for testing, while deployed demos should use the Railway HTTPS endpoint.

## Deployment

The backend is containerized with Docker and designed for Railway with a Railway Postgres service.

Required environment variables:

- `DATABASE_URL`
- `API_KEY`
- `MCP_PATH_TOKEN`
- `MCP_AUTH_TOKEN`
- `PUBLIC_API_BASE_URL`
- `HAPPYROBOT_API_KEY`
- `HAPPYROBOT_CLUSTER`
- `HAPPYROBOT_ENVIRONMENT`
- `FMCSA_WEB_KEY` for live FMCSA verification
- `DEMO_CARRIER_MC_NUMBERS=123456,654321,777888` for scripted seeded demo MCs
- `ALLOW_SEEDED_CARRIER_FALLBACK=true` only for local/POC seeded fallback demos

Deployment reproduction steps are documented in `docs/railway-deployment.md`.

## Demo Dataset

The seeded demo includes three active loads:

- `HR-ATL-DAL-001`: Atlanta, GA to Dallas, TX, Dry Van
- `HR-CHI-DEN-002`: Chicago, IL to Denver, CO, Reefer
- `HR-LAX-PHX-003`: Los Angeles, CA to Phoenix, AZ, Flatbed

It also includes eligible and ineligible carrier fixtures so the demo can show both accepted and rejected carrier paths even if FMCSA credentials are unavailable.

## Current Scope and Next Steps

This build is a proof of concept focused on the inbound call flow, backend tool contract, security posture, deployment shape, and reporting data model. It intentionally mocks the final transfer step because Web Call cannot perform a real PSTN transfer in the demo.

Recommended next steps for a production pilot:

- Connect live TMS/loadboard inventory instead of seeded loads.
- Expand carrier compliance checks beyond basic FMCSA eligibility.
- Add human review queues for high-value or exception-rate negotiations.
- Add audit exports for booked calls and rejected carriers.
