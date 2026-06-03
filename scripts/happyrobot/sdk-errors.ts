import {
  ApiError,
  AuthenticationError,
  NetworkError,
  NotFoundError,
  RateLimitError,
  TimeoutError,
  ValidationError,
} from "@happyrobot-ai/sdk";

export function describeSdkError(error: unknown) {
  if (error instanceof AuthenticationError) return "Authentication failed. Check HAPPYROBOT_API_KEY.";
  if (error instanceof NotFoundError) return "Resource not found in HappyRobot.";
  if (error instanceof ValidationError) return `Validation failed: ${JSON.stringify(error.body)}`;
  if (error instanceof RateLimitError) return `Rate limited. Retry after ${error.retryAfter ?? "unknown"} seconds.`;
  if (error instanceof TimeoutError) return "HappyRobot request timed out.";
  if (error instanceof NetworkError) return `Network error: ${error.message}`;
  if (error instanceof ApiError) return `HappyRobot API error ${error.status}: ${error.message}`;
  return error instanceof Error ? error.message : "Unknown HappyRobot SDK error.";
}
