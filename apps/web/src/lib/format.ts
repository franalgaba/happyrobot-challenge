import type { ReportSummary } from "@happyrobot-challenge/shared";

const EMPTY_VALUE = "—";

export function formatMoney(value: number | null | undefined) {
  if (value == null) return EMPTY_VALUE;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function formatPercent(part: number, total: number) {
  if (total === 0) return "0%";
  return `${Math.round((part / total) * 100)}%`;
}

export function sortCountEntries(record: Record<string, number>) {
  return Object.entries(record).sort((left, right) => right[1] - left[1]);
}

export function getBookedCount(summary: ReportSummary) {
  return summary.byOutcome.booked ?? 0;
}

export function formatBookRate(summary: ReportSummary) {
  const booked = getBookedCount(summary);
  if (summary.totalCalls === 0) return EMPTY_VALUE;
  return formatPercent(booked, summary.totalCalls);
}
