import type { Context } from "hono";
import { getRequestId } from "./request-context";

export function jsonError(c: Context, status: number, code: string, message: string, details?: unknown) {
  const requestId = getRequestId(c);

  return c.json(
    {
      error: {
        code,
        message,
        requestId,
        ...(details === undefined ? {} : { details }),
      },
    },
    status as never,
  );
}

export function normalizeMcNumber(value: string) {
  return value.replace(/^MC[-\s]?/i, "").replace(/\D/g, "");
}

export function toNumber(value: string | number | null | undefined) {
  if (value === null || value === undefined) {
    return null;
  }
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function iso(date: Date | string) {
  return date instanceof Date ? date.toISOString() : new Date(date).toISOString();
}
