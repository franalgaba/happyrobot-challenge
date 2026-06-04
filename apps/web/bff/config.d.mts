export const DASHBOARD_API_PROXY_ERROR_CODE: "dashboard_api_proxy_failed";
export const DASHBOARD_API_PROXY_TIMEOUT_MS: 20000;
export const DASHBOARD_AGGREGATE_REPORT_PATH: "/api/reports/dashboard";
export const DASHBOARD_REPORT_PATHS: ReadonlySet<string>;
export const JSON_CONTENT_TYPE: "application/json; charset=utf-8";
export const LOCAL_API_BASE_URL: "http://localhost:3000";

export function normalizeApiBaseUrl(raw: string, fallback?: string): string;

type DashboardApiEnv = {
  [key: string]: string | undefined;
  API_BASE_URL?: string;
  PUBLIC_API_BASE_URL?: string;
  VITE_API_BASE_URL?: string;
  API_KEY?: string;
  VITE_API_KEY?: string;
};

export function dashboardApiBaseUrlFromEnv(env: DashboardApiEnv, fallback?: string): string;

export function dashboardApiKeyFromEnv(env: DashboardApiEnv): string;

export function dashboardApiProxyErrorBody(
  message: string,
  options?: {
    code?: string;
    requestId?: string;
  },
): {
  error: {
    code: string;
    message: string;
    requestId?: string;
  };
};
