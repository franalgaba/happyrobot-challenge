import type {
  CallsReportResponse,
  DashboardData,
  LoadsReportResponse,
  NegotiationsReportResponse,
  ReportSummary,
} from "@happyrobot-challenge/shared";

function errorDetailFromJson(body: string) {
  try {
    const json = JSON.parse(body) as { message?: string; error?: string };
    return json.message ?? json.error ?? body;
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
  const [summary, calls, loads, negotiations] = await Promise.all([
    getJson<ReportSummary>("/api/reports/summary"),
    getJson<CallsReportResponse>("/api/reports/calls"),
    getJson<LoadsReportResponse>("/api/reports/loads"),
    getJson<NegotiationsReportResponse>("/api/reports/negotiations"),
  ]);

  return {
    summary,
    calls: calls.data,
    loads: loads.data,
    negotiations: negotiations.data,
  };
}
