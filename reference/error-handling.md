> ## Documentation Index
> Fetch the complete documentation index at: https://docs.happyrobot.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Error handling

> Handle errors and configure retry behavior in the TypeScript SDK

## Error class hierarchy

All errors extend `HappyRobotError`. HTTP errors extend `ApiError` with a `status` code and response `body`.

| Class                 | Status      | Description                                                    |
| --------------------- | ----------- | -------------------------------------------------------------- |
| `HappyRobotError`     | —           | Base error class                                               |
| `ApiError`            | any non-2xx | Generic API error with `status` and `body`                     |
| `AuthenticationError` | 401         | Invalid or missing API key                                     |
| `NotFoundError`       | 404         | Resource not found                                             |
| `ValidationError`     | 400 / 422   | Invalid request parameters                                     |
| `RateLimitError`      | 429         | Rate limit exceeded. Includes `retryAfter` (seconds or `null`) |
| `TimeoutError`        | —           | Request timed out (not an HTTP error)                          |
| `NetworkError`        | —           | Fetch failure (DNS, connection refused, etc.)                  |

## Catching errors

```ts theme={null}
import {
  ApiError,
  AuthenticationError,
  NotFoundError,
  RateLimitError,
  ValidationError,
  TimeoutError,
  NetworkError,
} from "@happyrobot-ai/sdk";

try {
  const wf = await client.workflows.get("nonexistent");
} catch (err) {
  if (err instanceof NotFoundError) {
    console.log("Workflow not found");
  } else if (err instanceof AuthenticationError) {
    console.log("Invalid API key");
  } else if (err instanceof ValidationError) {
    console.log("Bad request:", err.body.details);
  } else if (err instanceof RateLimitError) {
    console.log(`Rate limited. Retry after ${err.retryAfter}s`);
  } else if (err instanceof TimeoutError) {
    console.log("Request timed out");
  } else if (err instanceof NetworkError) {
    console.log("Network error:", err.message);
  } else if (err instanceof ApiError) {
    console.log(`API error ${err.status}: ${err.message}`);
  }
}
```

## Retry behavior

The client automatically retries requests that fail with `429` (rate limit) or `5xx` (server error) status codes.

* **Default retries**: 2 (configurable via `maxRetries`)
* **Backoff**: Exponential with jitter
* **429 responses**: Uses the `Retry-After` header when available

```ts theme={null}
const client = new HappyRobotClient({
  apiKey: "sk_live_...",
  maxRetries: 3,  // retry up to 3 times
  timeout: 60_000, // 60 second timeout
});
```

<Note>
  `AuthenticationError` (401), `NotFoundError` (404), and `ValidationError` (400/422) are **not** retried since they indicate a client-side issue.
</Note>

For pagination and SDK helper utilities like `triggerAndWait`, see [Helpers](/developer-tools/sdk/helpers).