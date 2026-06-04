import type { Context } from "hono";
import { ServiceError } from "./errors";
import { getRequestId } from "./request-context";

type LogLevel = "info" | "warn" | "error";

type LogFields = Record<string, unknown>;

type SerializedError = {
  name: string;
  message: string;
  stack?: string;
  code?: string;
  status?: number;
  cause?: unknown;
};

export function redactPathForLogs(path: string) {
  return path.replace(/^\/mcp\/[^/?#]+/, "/mcp/<redacted>");
}

function emit(level: LogLevel, event: string, fields: LogFields) {
  const line = JSON.stringify({
    level,
    event,
    timestamp: new Date().toISOString(),
    ...fields,
  });

  if (level === "error") {
    console.error(line);
    return;
  }

  if (level === "warn") {
    console.warn(line);
    return;
  }

  console.info(line);
}

function serializeCause(cause: unknown) {
  if (cause instanceof Error) {
    return { name: cause.name, message: cause.message };
  }

  return cause;
}

export function serializeError(error: unknown): SerializedError {
  if (error instanceof ServiceError) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code,
      status: error.status,
      cause: serializeCause(error.cause),
    };
  }

  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      cause: serializeCause(error.cause),
    };
  }

  return {
    name: typeof error,
    message: String(error),
  };
}

export function logInfo(event: string, fields: LogFields = {}) {
  emit("info", event, fields);
}

export function logWarn(event: string, fields: LogFields = {}) {
  emit("warn", event, fields);
}

export function logError(event: string, error: unknown, fields: LogFields = {}) {
  emit("error", event, {
    ...fields,
    error: serializeError(error),
  });
}

export function requestFields(c: Context, fields: LogFields = {}) {
  return {
    requestId: getRequestId(c),
    method: c.req.method,
    path: redactPathForLogs(c.req.path),
    ...fields,
  };
}
