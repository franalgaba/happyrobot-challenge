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
