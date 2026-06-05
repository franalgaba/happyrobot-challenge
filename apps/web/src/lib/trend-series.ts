import type { CallRecord, NegotiationRecord } from "@happyrobot-challenge/shared";
import { sharePercent } from "./format";

export type DailyCallBucket = {
  dateKey: string;
  label: string;
  totalCalls: number;
  bookedCalls: number;
  bookingRate: number;
  avgAgreedRate: number | null;
};

export type DailyNegotiationBucket = {
  dateKey: string;
  label: string;
  total: number;
  accepted: number;
  closeRate: number;
};

const DAY_MS = 86_400_000;

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function dateKeyFromUtc(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function shortDayLabel(date: Date): string {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" }).format(
    date,
  );
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function buildUtcDayRange(dayCount: number, anchor = new Date()): Date[] {
  const end = startOfUtcDay(anchor);
  const days: Date[] = [];

  for (let offset = dayCount - 1; offset >= 0; offset -= 1) {
    days.push(new Date(end.getTime() - offset * DAY_MS));
  }

  return days;
}

export function buildDailyCallTrend(calls: CallRecord[], dayCount = 14): DailyCallBucket[] {
  const days = buildUtcDayRange(dayCount);
  const buckets = new Map<string, DailyCallBucket>();

  for (const day of days) {
    const dateKey = dateKeyFromUtc(day);
    buckets.set(dateKey, {
      dateKey,
      label: shortDayLabel(day),
      totalCalls: 0,
      bookedCalls: 0,
      bookingRate: 0,
      avgAgreedRate: null,
    });
  }

  const agreedRatesByDay = new Map<string, number[]>();

  for (const call of calls) {
    const created = new Date(call.createdAt);
    const dateKey = dateKeyFromUtc(startOfUtcDay(created));
    const bucket = buckets.get(dateKey);
    if (!bucket) continue;

    bucket.totalCalls += 1;
    if (call.outcome === "booked") {
      bucket.bookedCalls += 1;
      if (call.agreedRate != null) {
        const rates = agreedRatesByDay.get(dateKey) ?? [];
        rates.push(call.agreedRate);
        agreedRatesByDay.set(dateKey, rates);
      }
    }
  }

  return days.map((day) => {
    const dateKey = dateKeyFromUtc(day);
    const bucket = buckets.get(dateKey)!;
    return {
      ...bucket,
      bookingRate: sharePercent(bucket.bookedCalls, bucket.totalCalls),
      avgAgreedRate: average(agreedRatesByDay.get(dateKey) ?? []),
    };
  });
}

export function buildDailyNegotiationTrend(
  negotiations: NegotiationRecord[],
  dayCount = 14,
): DailyNegotiationBucket[] {
  const days = buildUtcDayRange(dayCount);
  const buckets = new Map<string, DailyNegotiationBucket>();

  for (const day of days) {
    const dateKey = dateKeyFromUtc(day);
    buckets.set(dateKey, {
      dateKey,
      label: shortDayLabel(day),
      total: 0,
      accepted: 0,
      closeRate: 0,
    });
  }

  for (const negotiation of negotiations) {
    const created = new Date(negotiation.createdAt);
    const dateKey = dateKeyFromUtc(startOfUtcDay(created));
    const bucket = buckets.get(dateKey);
    if (!bucket) continue;

    bucket.total += 1;
    if (negotiation.status === "accepted") {
      bucket.accepted += 1;
    }
  }

  return days.map((day) => {
    const dateKey = dateKeyFromUtc(day);
    const bucket = buckets.get(dateKey)!;
    return {
      ...bucket,
      closeRate: sharePercent(bucket.accepted, bucket.total),
    };
  });
}

export function trendHasActivity<T extends { totalCalls?: number; total?: number }>(buckets: T[]): boolean {
  return buckets.some((bucket) => (bucket.totalCalls ?? bucket.total ?? 0) > 0);
}
