export const OUTCOME_LABELS: Record<string, string> = {
  booked: "Booked",
  rejected: "Rejected",
  no_match: "No match",
  ineligible: "Ineligible",
  transferred: "Transferred",
  follow_up: "Follow-up",
  human_review: "Human review",
};

export const SENTIMENT_LABELS: Record<string, string> = {
  positive: "Positive",
  neutral: "Neutral",
  negative: "Negative",
  mixed: "Mixed",
};

export const OUTCOME_COLORS: Record<string, string> = {
  booked: "var(--hr-accent-green)",
  rejected: "var(--hr-accent-red)",
  no_match: "var(--hr-dim)",
  ineligible: "var(--hr-accent-red)",
  transferred: "var(--hr-accent-blue)",
  follow_up: "var(--hr-accent-orange)",
  human_review: "var(--hr-accent-purple)",
};

export const SENTIMENT_COLORS: Record<string, string> = {
  positive: "var(--hr-accent-green)",
  neutral: "var(--hr-accent-blue)",
  negative: "var(--hr-accent-red)",
  mixed: "var(--hr-accent-orange)",
};

export const NEGOTIATION_LABELS: Record<string, string> = {
  accepted: "Accepted",
  countered: "Countered",
  rejected: "Rejected",
  open: "Open",
};

export const NEGOTIATION_COLORS: Record<string, string> = {
  accepted: "var(--hr-accent-green)",
  countered: "var(--hr-accent-orange)",
  rejected: "var(--hr-accent-red)",
  open: "var(--hr-accent-blue)",
};

export type CategoryKind = "outcome" | "sentiment" | "negotiation";

const CATEGORY_MAPS: Record<CategoryKind, { labels: Record<string, string>; colors: Record<string, string> }> =
  {
    outcome: { labels: OUTCOME_LABELS, colors: OUTCOME_COLORS },
    sentiment: { labels: SENTIMENT_LABELS, colors: SENTIMENT_COLORS },
    negotiation: { labels: NEGOTIATION_LABELS, colors: NEGOTIATION_COLORS },
  };

function categoryKey(value: string): string {
  return value.trim().replace(/\s+/g, "_").toLowerCase();
}

function fallbackLabel(value: string): string {
  return value.replace(/_/g, " ");
}

export function getCategoryDisplay(kind: CategoryKind, value: string) {
  const key = categoryKey(value);
  const { labels, colors } = CATEGORY_MAPS[kind];
  return {
    key,
    label: labels[key] ?? fallbackLabel(value),
    color: colors[key] ?? "var(--hr-dim)",
  };
}
