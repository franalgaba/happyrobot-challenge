import { describe, expect, it, vi } from "vitest";
import type { ReportSummary } from "@happyrobot-challenge/shared";
import { createApp } from "../src/app";
import { HappyRobotUnavailableError } from "../src/services/happyrobot";
import type { AppServices } from "../src/services/types";
import { ServiceError } from "../src/utils/errors";

const API_KEY = "test-api-key";
const MCP_PATH_TOKEN = "test-mcp-token";
const JSON_HEADERS = { "Content-Type": "application/json" };
const AUTHENTICATED_JSON_HEADERS = { ...JSON_HEADERS, "X-API-Key": API_KEY };
const REQUEST_ID = "test-request-123";

function emptyReportSummary(): ReportSummary {
  return {
    totalCalls: 0,
    byOutcome: {},
    bySentiment: {},
    averageAgreedRate: null,
    negotiations: {
      total: 0,
      accepted: 0,
      rejected: 0,
      countered: 0,
    },
    carrierVerification: {
      liveFmcsa: 0,
      fallbackSeeded: 0,
    },
  };
}

function services(overrides: Partial<AppServices> = {}): AppServices {
  return {
    carriers: {
      verifyCarrier: vi.fn(async () => ({
        mcNumber: "123456",
        dotNumber: "7654321",
        legalName: "Evergreen Freight LLC",
        eligible: true,
        allowedToOperate: true,
        outOfService: false,
        verificationSource: "seed" as const,
        simulated: true,
        reason: "Seeded fallback carrier is eligible.",
        verifiedAt: new Date("2026-06-03T00:00:00.000Z").toISOString(),
      })),
    },
    loads: {
      searchLoads: vi.fn(async () => ({ matches: [], total: 0 })),
    },
    negotiations: {
      negotiateOffer: vi.fn(async () => ({
        negotiationId: "neg-1",
        decision: "counter" as const,
        round: 1,
        carrierOfferRate: 2600,
        counterRate: 2250,
        agreedRate: null,
        message: "We can offer 2250 on this load.",
        remainingRounds: 2,
      })),
    },
    calls: {
      finalizeCall: vi.fn(async () => ({ callId: "call-1", stored: true as const })),
    },
    reports: {
      getSummary: vi.fn(async () => emptyReportSummary()),
      listCalls: vi.fn(async () => []),
      listLoads: vi.fn(async () => []),
      listNegotiations: vi.fn(async () => []),
    },
    voice: {
      createToken: vi.fn(async () => ({ url: "wss://example", token: "token", room_name: "room", run_id: "run" })),
    },
    ...overrides,
  };
}

function app(overrides: Partial<AppServices> = {}) {
  return createApp(
    { apiKey: API_KEY, mcpPathToken: MCP_PATH_TOKEN, corsOrigins: ["http://localhost:5173"] },
    services(overrides),
  );
}

function postJson(path: string, body: unknown, overrides: Partial<AppServices> = {}) {
  return app(overrides).request(path, {
    method: "POST",
    headers: AUTHENTICATED_JSON_HEADERS,
    body: JSON.stringify(body),
  });
}

function postMcp(body: unknown, overrides: Partial<AppServices> = {}) {
  return app(overrides).request(`/mcp/${MCP_PATH_TOKEN}`, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(body),
  });
}

describe("Hono API", () => {
  it("requires X-API-Key for API routes", async () => {
    const response = await app().request("/api/reports/summary");
    expect(response.status).toBe(401);
  });

  it("propagates request IDs in headers and API error responses", async () => {
    const response = await app().request("/api/reports/summary", {
      headers: { "X-Request-ID": REQUEST_ID },
    });

    expect(response.status).toBe(401);
    expect(response.headers.get("X-Request-ID")).toBe(REQUEST_ID);
    await expect(response.json()).resolves.toMatchObject({
      error: {
        code: "unauthorized",
        requestId: REQUEST_ID,
      },
    });
  });

  it("returns request validation details", async () => {
    const response = await postJson("/api/tools/verify-carrier", {});

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toMatchObject({
      error: {
        code: "invalid_request",
        requestId: expect.any(String),
        details: {
          issues: [
            {
              path: "mcNumber",
              code: "invalid_type",
              message: expect.any(String),
            },
          ],
        },
      },
    });
  });

  it("verifies a carrier through the API route", async () => {
    const response = await postJson("/api/tools/verify-carrier", { mcNumber: "MC-123456" });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ eligible: true, simulated: true });
  });

  it("creates a HappyRobot Web Call token through the API route", async () => {
    const createToken = vi.fn(async () => ({
      url: "wss://livekit.platform.happyrobot.ai",
      token: "scoped-livekit-token",
      room_name: "workflow_webcall_room",
      run_id: "run-1",
    }));
    const response = await postJson(
      "/api/voice/token",
      { workflowId: "workflow-1", environment: "production", data: { demo: true }, ttlSeconds: 3600 },
      { voice: { createToken } },
    );

    expect(response.status).toBe(200);
    expect(createToken).toHaveBeenCalledWith({
      workflowId: "workflow-1",
      environment: "production",
      data: { demo: true },
      ttlSeconds: 3600,
    });
    await expect(response.json()).resolves.toMatchObject({
      url: "wss://livekit.platform.happyrobot.ai",
      token: "scoped-livekit-token",
      room_name: "workflow_webcall_room",
      run_id: "run-1",
    });
  });

  it("maps unavailable HappyRobot voice token errors", async () => {
    const response = await postJson("/api/voice/token", { workflowId: "wf" }, {
      voice: {
        createToken: vi.fn(async () => {
          throw new HappyRobotUnavailableError("HAPPYROBOT_API_KEY is required to create Web Call tokens.");
        }),
      },
    });
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({ error: { code: "happyrobot_unavailable" } });
  });

  it("maps negotiation service errors to their declared status", async () => {
    const response = await postJson(
      "/api/tools/negotiate-offer",
      { sessionId: "session-1", loadId: "load-1", mcNumber: "MC123456", carrierOfferRate: 2600 },
      {
        negotiations: {
          negotiateOffer: vi.fn(async () => {
            throw new ServiceError("Negotiation was not found.", 404, "negotiation_not_found");
          }),
        },
      },
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({ error: { code: "negotiation_not_found" } });
  });

  it("maps finalize-call service errors to their declared status", async () => {
    const response = await postJson(
      "/api/tools/finalize-call",
      { outcome: "booked", sentiment: "positive", happyrobotRunId: "run-1", happyrobotSessionId: "session-2" },
      {
        calls: {
          finalizeCall: vi.fn(async () => {
            throw new ServiceError(
              "HappyRobot run ID and session ID conflict with an existing finalized call.",
              409,
              "call_identity_conflict",
            );
          }),
        },
      },
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({ error: { code: "call_identity_conflict" } });
  });

  it("hides unhandled internal errors", async () => {
    const response = await app({
      reports: {
        getSummary: vi.fn(async () => {
          throw new Error("database password leaked in stack detail");
        }),
        listCalls: vi.fn(async () => []),
        listLoads: vi.fn(async () => []),
        listNegotiations: vi.fn(async () => []),
      },
    }).request("/api/reports/summary", { headers: { "X-API-Key": API_KEY } });

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "internal_error", message: "Internal server error." },
    });
  });

  it("lists MCP tools", async () => {
    const response = await postMcp({ jsonrpc: "2.0", id: 1, method: "tools/list" });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ result: { tools: expect.arrayContaining([expect.objectContaining({ name: "verify_carrier" })]) } });
  });

  it("accepts MCP initialized notifications", async () => {
    const response = await postMcp({ jsonrpc: "2.0", method: "notifications/initialized" });
    expect(response.status).toBe(202);
  });

  it("returns a JSON-RPC parse error for malformed MCP JSON", async () => {
    const response = await app().request(`/mcp/${MCP_PATH_TOKEN}`, {
      method: "POST",
      headers: { ...JSON_HEADERS, "X-Request-ID": REQUEST_ID },
      body: "{",
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: -32700, message: "Parse error", data: { requestId: REQUEST_ID } },
    });
  });

  it("hides MCP tool error details", async () => {
    const response = await postMcp(
      {
        jsonrpc: "2.0",
        id: 3,
        method: "tools/call",
        params: { name: "verify_carrier", arguments: { mcNumber: "123456" } },
      },
      {
        carriers: {
          verifyCarrier: vi.fn(async () => {
            throw new Error("internal carrier failure detail");
          }),
        },
      },
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: -32000, message: "MCP tool call failed." },
    });
  });

  it("calls an MCP tool", async () => {
    const response = await postMcp({
      jsonrpc: "2.0",
      id: 2,
      method: "tools/call",
      params: { name: "verify_carrier", arguments: { mcNumber: "123456" } },
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ result: { structuredContent: { eligible: true } } });
  });

  it("normalizes HappyRobot MCP message arguments for carrier verification", async () => {
    const verifyCarrier = vi.fn(services().carriers.verifyCarrier);
    const response = await postMcp(
      {
        jsonrpc: "2.0",
        id: 4,
        method: "tools/call",
        params: { name: "verify_carrier", arguments: { _message: "Verifying MC 123456." } },
      },
      { carriers: { verifyCarrier } },
    );

    expect(response.status).toBe(200);
    expect(verifyCarrier).toHaveBeenCalledWith({ mcNumber: "123456" });
  });

  it("normalizes templated string values for numeric MCP arguments", async () => {
    const negotiateOffer = vi.fn(services().negotiations.negotiateOffer);
    const response = await postMcp(
      {
        jsonrpc: "2.0",
        id: 5,
        method: "tools/call",
        params: {
          name: "negotiate_offer",
          arguments: {
            sessionId: "session-1",
            negotiationId: "",
            loadId: "HR-ATL-DAL-001",
            mcNumber: "123456",
            carrierOfferRate: "2,600",
          },
        },
      },
      { negotiations: { negotiateOffer } },
    );

    expect(response.status).toBe(200);
    expect(negotiateOffer).toHaveBeenCalledWith({
      sessionId: "session-1",
      loadId: "HR-ATL-DAL-001",
      mcNumber: "123456",
      carrierOfferRate: 2600,
    });
  });
});
