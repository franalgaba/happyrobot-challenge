export type ParsedDashboardError = {
  title: string;
  message: string;
};

const CONFIG_MARKERS = ["API_BASE_URL", "API_KEY", ".env.example"];

function statusFromMessage(message: string): number | null {
  const match = message.match(/Request failed \((\d{3})\)/i);
  return match ? Number(match[1]) : null;
}

function isNetworkError(message: string): boolean {
  return /failed to fetch|networkerror|load failed|connection refused/i.test(message);
}

function isConfigError(message: string): boolean {
  return CONFIG_MARKERS.some((marker) => message.includes(marker));
}

/** Client-facing copy only — no env vars, status codes, or raw API bodies. */
export function parseDashboardError(raw: string): ParsedDashboardError {
  const status = statusFromMessage(raw);

  if (isConfigError(raw)) {
    return {
      title: "Dashboard not connected",
      message: "Metrics will appear once this view is linked to your reporting data.",
    };
  }

  if (status === 401 || status === 403) {
    return {
      title: "Unable to load metrics",
      message: "Access to your reporting data could not be verified. Try refreshing in a moment.",
    };
  }

  if (isNetworkError(raw)) {
    return {
      title: "Unable to load metrics",
      message: "We couldn't reach your data right now. Check your connection and refresh.",
    };
  }

  if (status != null && status >= 500) {
    return {
      title: "Metrics temporarily unavailable",
      message: "Something interrupted the update. Your last loaded figures may still appear below.",
    };
  }

  return {
    title: "Unable to load metrics",
    message: "We'll keep trying in the background. Contact your HappyRobot team if this continues.",
  };
}
