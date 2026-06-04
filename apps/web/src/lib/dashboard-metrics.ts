import type { CallRecord, ReportSummary } from "@happyrobot-challenge/shared";
import { getBookedCount, sharePercent } from "./format";

/** Stable outcome order for legends (success → leakage). */
export const OUTCOME_STACK_ORDER = [
  "booked",
  "transferred",
  "follow_up",
  "human_review",
  "no_match",
  "rejected",
  "ineligible",
] as const;

export function getBookingRate(summary: ReportSummary): number {
  return sharePercent(getBookedCount(summary), summary.totalCalls);
}

export function getNegotiationCloseRate(summary: ReportSummary): number {
  const { total, accepted } = summary.negotiations;
  return sharePercent(accepted, total);
}

export function callNeedsReview(call: CallRecord): boolean {
  if (call.outcome === "human_review" || call.outcome === "follow_up") {
    return true;
  }
  return call.sentiment === "negative";
}

export function sortOutcomeStackEntries(
  byOutcome: Record<string, number>,
): [string, number][] {
  const entries = Object.entries(byOutcome).filter(([, count]) => count > 0);
  const orderIndex = new Map<string, number>(
    OUTCOME_STACK_ORDER.map((key, index) => [key, index]),
  );

  return entries.sort((left, right) => {
    const leftOrder = orderIndex.get(left[0]) ?? OUTCOME_STACK_ORDER.length;
    const rightOrder = orderIndex.get(right[0]) ?? OUTCOME_STACK_ORDER.length;
    if (leftOrder !== rightOrder) return leftOrder - rightOrder;
    return right[1] - left[1];
  });
}
