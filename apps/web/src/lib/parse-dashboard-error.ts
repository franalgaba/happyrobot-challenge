export type ParsedDashboardError = {
  title: string;
  message: string;
};

type ErrorKind = "config" | "auth" | "network" | "server" | "default";

const CONFIG_MARKERS = ["API_BASE_URL", "API_KEY", ".env.example"];

const ERROR_COPY: Record<ErrorKind, ParsedDashboardError> = {
  config: {
    title: "Dashboard not connected",
    message: "Metrics will appear once this view is linked to your reporting data.",
  },
  auth: {
    title: "Unable to load metrics",
    message: "Access to your reporting data could not be verified. Try refreshing in a moment.",
  },
  network: {
    title: "Unable to load metrics",
    message: "We couldn't reach your data right now. Check your connection and refresh.",
  },
  server: {
    title: "Metrics temporarily unavailable",
    message: "Something interrupted the update. Your last loaded figures may still appear below.",
  },
  default: {
    title: "Unable to load metrics",
    message: "We'll keep trying in the background. Contact your HappyRobot team if this continues.",
  },
};

function httpStatusFromMessage(message: string): number | null {
  const match = message.match(/Request failed \((\d{3})\)/i);
  return match ? Number(match[1]) : null;
}

function isNetworkError(message: string): boolean {
  return /failed to fetch|networkerror|load failed|connection refused/i.test(message);
}

function isConfigError(message: string): boolean {
  return CONFIG_MARKERS.some((marker) => message.includes(marker));
}

function classifyError(message: string): ErrorKind {
  if (isConfigError(message)) return "config";

  const status = httpStatusFromMessage(message);
  if (status === 401 || status === 403) return "auth";
  if (isNetworkError(message)) return "network";
  if (status != null && status >= 500) return "server";

  return "default";
}

export function parseDashboardError(raw: string): ParsedDashboardError {
  return ERROR_COPY[classifyError(raw)];
}
