import { Hono } from "hono";
import { cors } from "hono/cors";
import type { MiddlewareHandler } from "hono";
import { createHash, timingSafeEqual } from "node:crypto";
import type { RuntimeConfig } from "./env/config";
import { createMcpRoutes } from "./mcp/routes";
import { createApiRoutes } from "./routes/api";
import type { AppServices } from "./services/types";
import { jsonError } from "./utils/http";
import { logError, logInfo, redactPathForLogs, requestFields } from "./utils/logging";
import { requestIdFromHeader, REQUEST_ID_HEADER, setRequestId } from "./utils/request-context";

function digest(value: string) {
  return createHash("sha256").update(value).digest();
}

function matchesSecret(provided: string | undefined, expected: string) {
  if (!provided) {
    return false;
  }

  return timingSafeEqual(digest(provided), digest(expected));
}

function requestTracing(): MiddlewareHandler {
  return async (c, next) => {
    const startedAt = Date.now();
    const requestId = requestIdFromHeader(c.req.header(REQUEST_ID_HEADER));
    const logFields = {
      requestId,
      method: c.req.method,
      path: redactPathForLogs(c.req.path),
    };

    setRequestId(c, requestId);
    logInfo("request_started", {
      ...logFields,
      userAgent: c.req.header("User-Agent"),
    });

    try {
      await next();
    } finally {
      c.header(REQUEST_ID_HEADER, requestId);
      logInfo("request_finished", {
        ...logFields,
        status: c.res.status,
        durationMs: Date.now() - startedAt,
      });
    }
  };
}

function apiKeyAuth(apiKey: string): MiddlewareHandler {
  return async (c, next) => {
    const providedApiKey = c.req.header("X-API-Key");
    if (!matchesSecret(providedApiKey, apiKey)) {
      return jsonError(c, 401, "unauthorized", "Missing or invalid X-API-Key.");
    }

    await next();
  };
}

export function createApp(
  config: Pick<RuntimeConfig, "apiKey" | "mcpPathToken" | "corsOrigins">,
  services: AppServices,
) {
  const app = new Hono();

  app.use(requestTracing());

  app.get("/health", (c) => c.json({ ok: true }));

  app.use(
    "/api/*",
    cors({
      origin: config.corsOrigins,
      allowHeaders: ["Content-Type", "X-API-Key"],
      allowMethods: ["GET", "POST", "OPTIONS"],
    }),
  );

  app.use("/api/*", apiKeyAuth(config.apiKey));

  app.route("/api", createApiRoutes(services));
  app.route("/mcp", createMcpRoutes(services, config.mcpPathToken));

  app.notFound((c) => jsonError(c, 404, "not_found", "Route not found."));
  app.onError((error, c) => {
    logError("request_unhandled_error", error, requestFields(c));
    return jsonError(c, 500, "internal_error", "Internal server error.");
  });

  return app;
}
