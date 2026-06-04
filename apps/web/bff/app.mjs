import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import {
  dashboardApiBaseUrlFromEnv,
  dashboardApiKeyFromEnv,
  dashboardApiProxyErrorBody,
  DASHBOARD_API_PROXY_TIMEOUT_MS,
  DASHBOARD_AGGREGATE_REPORT_PATH,
  DASHBOARD_REPORT_PATHS,
  DASHBOARD_VOICE_TOKEN_PATH,
  JSON_CONTENT_TYPE,
  LIVEKIT_CONNECT_SRC,
  voiceTokenRequestBodyFromEnv,
} from "./config.mjs";

const LOCAL_REQUEST_BASE_URL = "http://localhost";
const REQUEST_ID_HEADER = "X-Request-ID";
const TEXT_CONTENT_TYPE = "text/plain; charset=utf-8";

const securityHeaders = {
  "Content-Security-Policy":
    `default-src 'self'; connect-src 'self' ${LIVEKIT_CONNECT_SRC}; media-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; font-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'`,
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "no-referrer",
};

class DashboardProxyError extends Error {
  constructor({ code, message, status = 502, upstreamPath, cause }) {
    super(message, { cause });
    this.name = "DashboardProxyError";
    this.code = code;
    this.status = status;
    this.upstreamPath = upstreamPath;
  }
}

function errorBody(code, message, requestId) {
  return { error: { code, message, ...(requestId ? { requestId } : {}) } };
}

function proxyErrorBody(error, requestId) {
  if (error instanceof DashboardProxyError) {
    return dashboardApiProxyErrorBody(error.message, {
      code: error.code,
      requestId,
    });
  }

  return dashboardApiProxyErrorBody("Dashboard API proxy failed.", { requestId });
}

function abortSignalWithTimeout(timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  return { signal: controller.signal, cancel: () => clearTimeout(timeout) };
}

function requestPath(url) {
  return new URL(url, LOCAL_REQUEST_BASE_URL).pathname;
}

function reportRequestIsSupported(c) {
  return c.req.method === "GET" || c.req.method === "HEAD";
}

function apiProxyIsConfigured(apiBaseUrl, apiKey) {
  return Boolean(apiBaseUrl && apiKey);
}

function loopbackHostnamesMatch(left, right) {
  const loopbackHosts = new Set(["localhost", "127.0.0.1", "::1"]);
  return left === right || (loopbackHosts.has(left) && loopbackHosts.has(right));
}

function requestHost(c) {
  return c.req.header("host") ?? "";
}

function requestProtocol(c) {
  return c.req.header("x-forwarded-proto") ?? "http";
}

function apiProxyTargetsCurrentServer(c, apiBaseUrl) {
  try {
    const upstreamUrl = new URL(apiBaseUrl);
    const currentUrl = new URL(`${requestProtocol(c)}://${requestHost(c)}`);

    return (
      loopbackHostnamesMatch(upstreamUrl.hostname, currentUrl.hostname) &&
      upstreamUrl.port === currentUrl.port
    );
  } catch {
    return false;
  }
}

function upstreamReportUrl(apiBaseUrl, requestUrl) {
  const url = new URL(requestUrl, LOCAL_REQUEST_BASE_URL);
  return new URL(`${apiBaseUrl}${url.pathname}${url.search}`);
}

function upstreamReportPathUrl(apiBaseUrl, pathname) {
  return new URL(`${apiBaseUrl}${pathname}`);
}

async function fetchUpstreamReport({ apiBaseUrl, apiKey, requestUrl, method, requestIdValue }) {
  const timeout = abortSignalWithTimeout(DASHBOARD_API_PROXY_TIMEOUT_MS);
  const upstreamUrl = upstreamReportUrl(apiBaseUrl, requestUrl);

  try {
    return await fetch(upstreamUrl, {
      method,
      headers: upstreamHeaders(apiKey, requestIdValue),
      signal: timeout.signal,
    });
  } catch (error) {
    throw upstreamFetchError(error, upstreamUrl.pathname);
  } finally {
    timeout.cancel();
  }
}

async function readUpstreamJson(response, pathname) {
  const text = await response.text();

  try {
    return JSON.parse(text);
  } catch {
    throw new DashboardProxyError({
      code: "dashboard_api_invalid_response",
      message: `Dashboard API returned a non-JSON response for ${pathname} (${response.status}).`,
      status: 502,
      upstreamPath: pathname,
    });
  }
}

function isAbortError(error) {
  return error instanceof Error && error.name === "AbortError";
}

function upstreamFetchError(error, upstreamPath) {
  if (isAbortError(error)) {
    return new DashboardProxyError({
      code: "dashboard_api_timeout",
      message: `Dashboard API timed out while fetching ${upstreamPath}.`,
      status: 504,
      upstreamPath,
      cause: error,
    });
  }

  return new DashboardProxyError({
    code: "dashboard_api_fetch_failed",
    message: `Dashboard API could not be reached while fetching ${upstreamPath}.`,
    status: 502,
    upstreamPath,
    cause: error,
  });
}

function requestId(c) {
  return c.get("requestId");
}

function requestIdFromHeaders(c) {
  const incomingRequestId = c.req.header(REQUEST_ID_HEADER);
  return incomingRequestId?.trim() || randomUUID();
}

function upstreamHeaders(apiKey, requestIdValue) {
  return {
    "X-API-Key": apiKey,
    ...(requestIdValue ? { [REQUEST_ID_HEADER]: requestIdValue } : {}),
  };
}

function logProxyError(c, error) {
  const proxyError =
    error instanceof DashboardProxyError
      ? error
      : new DashboardProxyError({
          code: "dashboard_api_proxy_failed",
          message: "Dashboard API proxy failed.",
          cause: error,
        });

  console.error(
    JSON.stringify({
      level: "error",
      event: "dashboard_api_proxy_failed",
      timestamp: new Date().toISOString(),
      requestId: requestId(c),
      method: c.req.method,
      path: requestPath(c.req.url),
      code: proxyError.code,
      status: proxyError.status,
      upstreamPath: proxyError.upstreamPath,
      error: {
        name: error instanceof Error ? error.name : "UnknownError",
        message: error instanceof Error ? error.message : String(error),
      },
    }),
  );
}

async function fetchUpstreamReportJson({ apiBaseUrl, apiKey, pathname, requestIdValue }) {
  const timeout = abortSignalWithTimeout(DASHBOARD_API_PROXY_TIMEOUT_MS);
  const upstreamUrl = upstreamReportPathUrl(apiBaseUrl, pathname);

  try {
    const response = await fetch(upstreamUrl, {
      headers: upstreamHeaders(apiKey, requestIdValue),
      signal: timeout.signal,
    });

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        body: await readUpstreamJson(response, pathname),
      };
    }

    return {
      ok: true,
      status: response.status,
      body: await readUpstreamJson(response, pathname),
    };
  } catch (error) {
    if (error instanceof DashboardProxyError) throw error;
    throw upstreamFetchError(error, upstreamUrl.pathname);
  } finally {
    timeout.cancel();
  }
}

function aggregateUpstreamError(result) {
  return new Response(JSON.stringify(result.body), {
    status: result.status,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": JSON_CONTENT_TYPE,
    },
  });
}

async function proxyDashboardAggregate(c, { apiBaseUrl, apiKey }) {
  const requestIdValue = requestId(c);

  if (!reportRequestIsSupported(c)) {
    return c.text("Method Not Allowed", 405);
  }

  if (!apiProxyIsConfigured(apiBaseUrl, apiKey)) {
    return c.json(
      errorBody("dashboard_api_unavailable", "Dashboard API proxy is not configured.", requestIdValue),
      503,
    );
  }

  if (apiProxyTargetsCurrentServer(c, apiBaseUrl)) {
    return c.json(
      errorBody(
        "dashboard_api_self_proxy",
        "Dashboard API proxy points back to the dashboard server.",
        requestIdValue,
      ),
      502,
    );
  }

  try {
    const [summary, calls, loads, negotiations] = await Promise.all([
      fetchUpstreamReportJson({
        apiBaseUrl,
        apiKey,
        pathname: "/api/reports/summary",
        requestIdValue,
      }),
      fetchUpstreamReportJson({
        apiBaseUrl,
        apiKey,
        pathname: "/api/reports/calls",
        requestIdValue,
      }),
      fetchUpstreamReportJson({
        apiBaseUrl,
        apiKey,
        pathname: "/api/reports/loads",
        requestIdValue,
      }),
      fetchUpstreamReportJson({
        apiBaseUrl,
        apiKey,
        pathname: "/api/reports/negotiations",
        requestIdValue,
      }),
    ]);
    const failedReport = [summary, calls, loads, negotiations].find((report) => !report.ok);

    if (failedReport) {
      return aggregateUpstreamError(failedReport);
    }

    return c.json(
      {
        summary: summary.body,
        calls: calls.body.data,
        loads: loads.body.data,
        negotiations: negotiations.body.data,
      },
      200,
      { "Cache-Control": "no-store" },
    );
  } catch (error) {
    logProxyError(c, error);
    const status = error instanceof DashboardProxyError ? error.status : 502;
    return c.json(proxyErrorBody(error, requestIdValue), status);
  }
}

async function proxyVoiceToken(c, { apiBaseUrl, apiKey, env }) {
  if (c.req.method !== "POST") {
    return c.text("Method Not Allowed", 405);
  }

  if (!apiProxyIsConfigured(apiBaseUrl, apiKey)) {
    return c.json(
      errorBody("dashboard_api_unavailable", "Dashboard API proxy is not configured.", requestId(c)),
      503,
    );
  }

  if (apiProxyTargetsCurrentServer(c, apiBaseUrl)) {
    return c.json(
      errorBody(
        "dashboard_api_self_proxy",
        "Dashboard API proxy points back to the dashboard server.",
        requestId(c),
      ),
      502,
    );
  }

  const timeout = abortSignalWithTimeout(DASHBOARD_API_PROXY_TIMEOUT_MS);
  const upstreamUrl = upstreamReportPathUrl(apiBaseUrl, DASHBOARD_VOICE_TOKEN_PATH);

  try {
    const upstreamResponse = await fetch(upstreamUrl, {
      method: "POST",
      headers: {
        ...upstreamHeaders(apiKey, requestId(c)),
        "Content-Type": JSON_CONTENT_TYPE,
      },
      body: JSON.stringify(voiceTokenRequestBodyFromEnv(env)),
      signal: timeout.signal,
    });
    const body = await upstreamResponse.text();

    return new Response(body, {
      status: upstreamResponse.status,
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": upstreamResponse.headers.get("Content-Type") ?? JSON_CONTENT_TYPE,
      },
    });
  } catch (error) {
    logProxyError(c, error);
    const status = error instanceof DashboardProxyError ? error.status : 502;
    return c.json(proxyErrorBody(error, requestId(c)), status);
  } finally {
    timeout.cancel();
  }
}

async function proxyDashboardReport(c, { apiBaseUrl, apiKey }) {
  if (requestPath(c.req.url) === DASHBOARD_AGGREGATE_REPORT_PATH) {
    return proxyDashboardAggregate(c, { apiBaseUrl, apiKey });
  }

  if (!DASHBOARD_REPORT_PATHS.has(requestPath(c.req.url))) {
    return c.json(errorBody("not_found", "Route not found."), 404);
  }

  if (!reportRequestIsSupported(c)) {
    return c.text("Method Not Allowed", 405);
  }

  if (!apiProxyIsConfigured(apiBaseUrl, apiKey)) {
    return c.json(
      errorBody("dashboard_api_unavailable", "Dashboard API proxy is not configured.", requestId(c)),
      503,
    );
  }

  if (apiProxyTargetsCurrentServer(c, apiBaseUrl)) {
    return c.json(
      errorBody(
        "dashboard_api_self_proxy",
        "Dashboard API proxy points back to the dashboard server.",
        requestId(c),
      ),
      502,
    );
  }

  try {
    const upstreamResponse = await fetchUpstreamReport({
      apiBaseUrl,
      apiKey,
      requestUrl: c.req.url,
      method: c.req.method,
      requestIdValue: requestId(c),
    });
    const body = c.req.method === "HEAD" ? null : await upstreamResponse.text();

    return new Response(body, {
      status: upstreamResponse.status,
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": upstreamResponse.headers.get("Content-Type") ?? JSON_CONTENT_TYPE,
      },
    });
  } catch (error) {
    logProxyError(c, error);
    const status = error instanceof DashboardProxyError ? error.status : 502;
    return c.json(proxyErrorBody(error, requestId(c)), status);
  }
}

async function securityHeadersMiddleware(c, next) {
  for (const [name, value] of Object.entries(securityHeaders)) {
    c.header(name, value);
  }

  await next();
}

async function requestIdMiddleware(c, next) {
  const requestIdValue = requestIdFromHeaders(c);
  c.set("requestId", requestIdValue);
  c.header(REQUEST_ID_HEADER, requestIdValue);

  await next();
}

async function indexFallback(c, indexFile) {
  try {
    return c.html(await readFile(indexFile, "utf8"));
  } catch {
    return c.text("Build output missing. Run `bun run build` before starting.", 500, {
      "Content-Type": TEXT_CONTENT_TYPE,
    });
  }
}

export function createDashboardBffApp({
  env = process.env,
  staticRoot = "dist",
  indexFile = "dist/index.html",
  serveStaticAssets = true,
} = {}) {
  const app = new Hono();
  const apiBaseUrl = dashboardApiBaseUrlFromEnv(env);
  const apiKey = dashboardApiKeyFromEnv(env);

  app.use("*", requestIdMiddleware);
  app.use("*", securityHeadersMiddleware);
  app.get("/health", (c) => c.text("ok"));
  app.on(["GET", "HEAD"], "/api/reports/*", (c) =>
    proxyDashboardReport(c, { apiBaseUrl, apiKey }),
  );
  app.post(DASHBOARD_VOICE_TOKEN_PATH, (c) =>
    proxyVoiceToken(c, { apiBaseUrl, apiKey, env }),
  );
  app.all("/api/*", (c) => c.json(errorBody("not_found", "Route not found."), 404));

  if (serveStaticAssets) {
    app.use("*", serveStatic({ root: staticRoot }));
    app.get("*", (c) => indexFallback(c, indexFile));
  }

  return app;
}
