import {
  ApiError,
  AuthenticationError,
  NetworkError,
  NotFoundError,
  RateLimitError,
  TimeoutError,
  ValidationError,
  HappyRobotClient,
} from "@happyrobot-ai/sdk";
import type { VoiceTokenRequest } from "@happyrobot-challenge/shared";
import type { RuntimeConfig } from "../env/config";
import type { VoiceService } from "./types";

const HAPPYROBOT_REQUEST_TIMEOUT_MS = 30_000;
const HAPPYROBOT_MAX_RETRIES = 2;

export class HappyRobotUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "HappyRobotUnavailableError";
  }
}

export type HappyRobotMappedError = {
  status: number;
  code: string;
  message: string;
  details?: unknown;
};

function shouldExposeUpstreamDetails() {
  return process.env.NODE_ENV !== "production";
}

function workflowIdFor(input: VoiceTokenRequest, config: RuntimeConfig) {
  return input.workflowId ?? config.happyrobotWorkflowId;
}

function createHappyRobotClient(input: Pick<RuntimeConfig, "happyrobotCluster"> & { readonly apiKey: string }) {
  return new HappyRobotClient({
    apiKey: input.apiKey,
    cluster: input.happyrobotCluster,
    timeout: HAPPYROBOT_REQUEST_TIMEOUT_MS,
    maxRetries: HAPPYROBOT_MAX_RETRIES,
  });
}

export function mapHappyRobotError(error: unknown): HappyRobotMappedError {
  const exposeUpstreamDetails = shouldExposeUpstreamDetails();

  if (error instanceof AuthenticationError) {
    return { status: 401, code: "happyrobot_authentication_error", message: "HappyRobot API key is invalid or missing." };
  }
  if (error instanceof NotFoundError) {
    return { status: 404, code: "happyrobot_workflow_not_found", message: "HappyRobot workflow was not found or has no live Web Call node." };
  }
  if (error instanceof ValidationError) {
    return {
      status: 422,
      code: "happyrobot_validation_error",
      message: "HappyRobot rejected the request parameters.",
      details: exposeUpstreamDetails ? error.body : undefined,
    };
  }
  if (error instanceof RateLimitError) {
    return { status: 429, code: "happyrobot_rate_limited", message: "HappyRobot rate limit exceeded.", details: { retryAfter: error.retryAfter } };
  }
  if (error instanceof TimeoutError) {
    return { status: 504, code: "happyrobot_timeout", message: "HappyRobot request timed out." };
  }
  if (error instanceof NetworkError) {
    return { status: 502, code: "happyrobot_network_error", message: "Could not reach HappyRobot." };
  }
  if (error instanceof ApiError) {
    return {
      status: error.status,
      code: "happyrobot_api_error",
      message: exposeUpstreamDetails ? error.message : "HappyRobot API request failed.",
      details: exposeUpstreamDetails ? error.body : undefined,
    };
  }
  if (error instanceof HappyRobotUnavailableError) {
    return { status: 503, code: "happyrobot_unavailable", message: error.message };
  }
  return { status: 500, code: "happyrobot_unknown_error", message: "Unexpected HappyRobot SDK error." };
}

export function createVoiceService(config: RuntimeConfig): VoiceService {
  return {
    async createToken(input: VoiceTokenRequest) {
      if (!config.happyrobotApiKey) {
        throw new HappyRobotUnavailableError("HAPPYROBOT_API_KEY is required to create Web Call tokens.");
      }

      const workflowId = workflowIdFor(input, config);
      if (!workflowId) {
        throw new HappyRobotUnavailableError("HAPPYROBOT_WORKFLOW_ID or request.workflowId is required.");
      }

      const client = createHappyRobotClient({
        apiKey: config.happyrobotApiKey,
        happyrobotCluster: config.happyrobotCluster,
      });

      return client.voice.createToken({
        workflow_id: workflowId,
        data: input.data,
        env: input.environment ?? config.happyrobotEnvironment,
        ttl_seconds: input.ttlSeconds,
      });
    },
  };
}
