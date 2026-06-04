import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import {
  CallsReportResponseSchema,
  FinalizeCallRequestSchema,
  LoadsReportResponseSchema,
  NegotiateOfferRequestSchema,
  NegotiationsReportResponseSchema,
  ReportSummarySchema,
  SearchLoadsRequestSchema,
  VerifyCarrierRequestSchema,
  VoiceTokenRequestSchema,
  VoiceTokenResponseSchema,
} from "@happyrobot-challenge/shared";
import type { z } from "zod";
import { mapHappyRobotError } from "../services/happyrobot";
import type { AppServices } from "../services/types";
import { ServiceError } from "../utils/errors";
import { jsonError } from "../utils/http";
import { logError, logWarn, requestFields } from "../utils/logging";

type JsonErrorContext = Parameters<typeof jsonError>[0];

type RouteErrorResponseInput = {
  c: JsonErrorContext;
  error: unknown;
  operation: string;
  fallbackCode: string;
  fallbackMessage: string;
};

type MappedHappyRobotError = ReturnType<typeof mapHappyRobotError>;

function validationIssues(error: z.ZodError) {
  return error.issues.map((issue) => ({
    path: issue.path.join("."),
    code: issue.code,
    message: issue.message,
  }));
}

function jsonValidator(schema: z.ZodTypeAny) {
  return zValidator("json", schema, (result, c) => {
    if (result.success) {
      return;
    }

    const details = { issues: validationIssues(result.error) };
    logWarn("request_validation_failed", requestFields(c, { details }));
    return jsonError(c, 422, "invalid_request", "Request validation failed.", details);
  });
}

function serviceJsonError({ c, error, operation, fallbackCode, fallbackMessage }: RouteErrorResponseInput) {
  if (error instanceof ServiceError) {
    logWarn(
      "request_service_error",
      requestFields(c, {
        operation,
        code: error.code,
        status: error.status,
        message: error.message,
      }),
    );
    return jsonError(c, error.status, error.code, error.message);
  }

  logError("request_handler_error", error, requestFields(c, { operation, code: fallbackCode }));
  return jsonError(c, 500, fallbackCode, fallbackMessage);
}

function logHappyRobotTokenError(c: JsonErrorContext, error: unknown, mapped: MappedHappyRobotError) {
  const fields = requestFields(c, {
    operation: "voice_token",
    code: mapped.code,
    status: mapped.status,
    message: mapped.message,
  });

  if (mapped.status >= 500) {
    logError("happyrobot_voice_token_error", error, fields);
    return;
  }

  logWarn("happyrobot_voice_token_error", fields);
}

export function createApiRoutes(services: AppServices) {
  const api = new Hono();

  api.post("/tools/verify-carrier", jsonValidator(VerifyCarrierRequestSchema), async (c) => {
    try {
      return c.json(await services.carriers.verifyCarrier(c.req.valid("json")));
    } catch (error) {
      return serviceJsonError({
        c,
        error,
        operation: "verify_carrier",
        fallbackCode: "carrier_verification_failed",
        fallbackMessage: "Carrier verification failed.",
      });
    }
  });

  api.post("/tools/search-loads", jsonValidator(SearchLoadsRequestSchema), async (c) => {
    try {
      return c.json(await services.loads.searchLoads(c.req.valid("json")));
    } catch (error) {
      return serviceJsonError({
        c,
        error,
        operation: "search_loads",
        fallbackCode: "load_search_failed",
        fallbackMessage: "Load search failed.",
      });
    }
  });

  api.post("/tools/negotiate-offer", jsonValidator(NegotiateOfferRequestSchema), async (c) => {
    try {
      return c.json(await services.negotiations.negotiateOffer(c.req.valid("json")));
    } catch (error) {
      return serviceJsonError({
        c,
        error,
        operation: "negotiate_offer",
        fallbackCode: "negotiation_failed",
        fallbackMessage: "Negotiation failed.",
      });
    }
  });

  api.post("/tools/finalize-call", jsonValidator(FinalizeCallRequestSchema), async (c) => {
    try {
      return c.json(await services.calls.finalizeCall(c.req.valid("json")));
    } catch (error) {
      return serviceJsonError({
        c,
        error,
        operation: "finalize_call",
        fallbackCode: "finalize_call_failed",
        fallbackMessage: "Call finalization failed.",
      });
    }
  });

  api.get("/reports/summary", async (c) => c.json(ReportSummarySchema.parse(await services.reports.getSummary())));
  api.get("/reports/calls", async (c) =>
    c.json(CallsReportResponseSchema.parse(listResponse(await services.reports.listCalls()))),
  );
  api.get("/reports/loads", async (c) =>
    c.json(LoadsReportResponseSchema.parse(listResponse(await services.reports.listLoads()))),
  );
  api.get("/reports/negotiations", async (c) =>
    c.json(NegotiationsReportResponseSchema.parse(listResponse(await services.reports.listNegotiations()))),
  );

  api.post("/voice/token", jsonValidator(VoiceTokenRequestSchema), async (c) => {
    try {
      return c.json(VoiceTokenResponseSchema.parse(await services.voice.createToken(c.req.valid("json"))));
    } catch (error) {
      const mapped = mapHappyRobotError(error);
      logHappyRobotTokenError(c, error, mapped);
      return jsonError(c, mapped.status, mapped.code, mapped.message, mapped.details);
    }
  });

  return api;
}

function listResponse<T>(data: T[]) {
  return { data };
}
