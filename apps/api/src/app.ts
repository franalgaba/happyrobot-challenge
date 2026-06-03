import { Hono } from "hono";
import { cors } from "hono/cors";
import type { MiddlewareHandler } from "hono";
import { createHash, timingSafeEqual } from "node:crypto";
import type { RuntimeConfig } from "./env/config";
import { createMcpRoutes } from "./mcp/routes";
import { createApiRoutes } from "./routes/api";
import type { AppServices } from "./services/types";
import { jsonError } from "./utils/http";

function redactSensitivePath(path: string) {
  return path.replace(/^\/mcp\/[^/?#]+/, "/mcp/<redacted>");
}

function digest(value: string) {
  return createHash("sha256").update(value).digest();
}

function matchesSecret(provided: string | undefined, expected: string) {
  if (!provided) {
    return false;
  }

  return timingSafeEqual(digest(provided), digest(expected));
}

function requestLogger(): MiddlewareHandler {
  return async (c, next) => {
    const method = c.req.method;
    const path = redactSensitivePath(c.req.path);
    const startedAt = Date.now();

    console.log(`<-- ${method} ${path}`);
    await next();
    console.log(`--> ${method} ${path} ${c.res.status} ${Date.now() - startedAt}ms`);
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

  app.use(requestLogger());

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
    console.error(error);
    return jsonError(c, 500, "internal_error", "Internal server error.");
  });

  return app;
}
