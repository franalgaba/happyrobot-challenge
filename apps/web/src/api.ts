import type { DashboardData } from "@happyrobot-challenge/shared";

type ErrorResponseBody = {
  message?: unknown;
  error?: unknown;
};

type StructuredError = {
  message?: unknown;
  requestId?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function structuredErrorMessage(error: StructuredError): string | null {
  const message = stringValue(error.message);
  if (!message) return null;

  const requestId = stringValue(error.requestId);
  return requestId ? `${message} (request ${requestId})` : message;
}

function errorMessageFromJson(json: ErrorResponseBody): string | null {
  const topLevelMessage = stringValue(json.message);
  if (topLevelMessage) return topLevelMessage;

  const error = json.error;
  if (typeof error === "string") return error;
  if (isRecord(error)) return structuredErrorMessage(error);

  return null;
}

function errorDetailFromJson(body: string) {
  try {
    return errorMessageFromJson(JSON.parse(body) as ErrorResponseBody) ?? body;
  } catch {
    return body;
  }
}

function errorDetailFromBody(body: string) {
  const detail = body.trim();
  return detail.startsWith("{") ? errorDetailFromJson(detail) : detail;
}

async function requestErrorMessage(response: Response) {
  const detail = errorDetailFromBody(await response.text());
  const fallbackMessage = `Request failed (${response.status})`;
  return detail ? `${fallbackMessage}: ${detail}` : fallbackMessage;
}

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(path);

  if (!response.ok) {
    throw new Error(await requestErrorMessage(response));
  }

  return response.json() as Promise<T>;
}

export async function fetchDashboardData(): Promise<DashboardData> {
  return getJson<DashboardData>("/api/reports/dashboard");
}
