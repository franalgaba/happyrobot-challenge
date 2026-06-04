import { randomUUID } from "node:crypto";
import type { Context } from "hono";

export const REQUEST_ID_HEADER = "X-Request-ID";

const REQUEST_ID_PATTERN = /^[A-Za-z0-9._:-]{1,128}$/;

type RequestIdContext = Context & {
  get(key: "requestId"): string | undefined;
  set(key: "requestId", value: string): void;
};

export function requestIdFromHeader(value: string | undefined): string {
  if (value && REQUEST_ID_PATTERN.test(value)) {
    return value;
  }

  return randomUUID();
}

export function setRequestId(c: Context, requestId: string) {
  (c as RequestIdContext).set("requestId", requestId);
  c.header(REQUEST_ID_HEADER, requestId);
}

export function getRequestId(c: Context): string {
  return (c as RequestIdContext).get("requestId") ?? "unknown";
}
