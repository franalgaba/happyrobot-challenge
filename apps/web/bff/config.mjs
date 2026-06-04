export const DASHBOARD_API_PROXY_ERROR_CODE = "dashboard_api_proxy_failed";
export const DASHBOARD_API_PROXY_TIMEOUT_MS = 20_000;
export const DASHBOARD_AGGREGATE_REPORT_PATH = "/api/reports/dashboard";
export const DASHBOARD_REPORT_PATHS = new Set([
  DASHBOARD_AGGREGATE_REPORT_PATH,
  "/api/reports/summary",
  "/api/reports/calls",
  "/api/reports/loads",
  "/api/reports/negotiations",
]);
export const DASHBOARD_VOICE_TOKEN_PATH = "/api/voice/token";
export const LIVEKIT_CONNECT_SRC =
  "https://livekit.platform.happyrobot.ai wss://livekit.platform.happyrobot.ai";
export const JSON_CONTENT_TYPE = "application/json; charset=utf-8";
export const LOCAL_API_BASE_URL = "http://localhost:3000";

export function normalizeApiBaseUrl(raw, fallback = "") {
  const trimmed = raw.trim().replace(/\/$/, "");
  if (!trimmed) return fallback;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function dashboardApiBaseUrlFromEnv(env, fallback = "") {
  return normalizeApiBaseUrl(
    env.API_BASE_URL ?? env.PUBLIC_API_BASE_URL ?? env.VITE_API_BASE_URL ?? "",
    fallback,
  );
}

export function dashboardApiKeyFromEnv(env) {
  return env.API_KEY ?? env.VITE_API_KEY ?? "";
}

export function dashboardApiProxyErrorBody(message, { code = DASHBOARD_API_PROXY_ERROR_CODE, requestId } = {}) {
  return {
    error: {
      code,
      message,
      ...(requestId ? { requestId } : {}),
    },
  };
}

export function voiceTokenRequestBodyFromEnv(env) {
  const ttlRaw = env.VOICE_TOKEN_TTL_SECONDS ?? "3600";
  const ttlSeconds = Number(ttlRaw);

  return {
    environment: env.VOICE_TOKEN_ENVIRONMENT ?? "production",
    ttlSeconds: Number.isFinite(ttlSeconds) ? ttlSeconds : 3600,
    data: { demo: true },
  };
}
