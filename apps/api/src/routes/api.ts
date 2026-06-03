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
} from "@happyrobot-challenge/shared";
import { mapHappyRobotError } from "../services/happyrobot";
import type { AppServices } from "../services/types";
import { ServiceError } from "../utils/errors";
import { jsonError } from "../utils/http";

type JsonErrorContext = Parameters<typeof jsonError>[0];

function serviceJsonError(c: JsonErrorContext, error: unknown, fallbackCode: string, fallbackMessage: string) {
  if (error instanceof ServiceError) {
    return jsonError(c, error.status, error.code, error.message);
  }

  return jsonError(c, 500, fallbackCode, fallbackMessage);
}

export function createApiRoutes(services: AppServices) {
  const api = new Hono();

  api.post("/tools/verify-carrier", zValidator("json", VerifyCarrierRequestSchema), async (c) => {
    try {
      return c.json(await services.carriers.verifyCarrier(c.req.valid("json")));
    } catch (error) {
      return serviceJsonError(c, error, "carrier_verification_failed", "Carrier verification failed.");
    }
  });

  api.post("/tools/search-loads", zValidator("json", SearchLoadsRequestSchema), async (c) => {
    return c.json(await services.loads.searchLoads(c.req.valid("json")));
  });

  api.post("/tools/negotiate-offer", zValidator("json", NegotiateOfferRequestSchema), async (c) => {
    try {
      return c.json(await services.negotiations.negotiateOffer(c.req.valid("json")));
    } catch (error) {
      return serviceJsonError(c, error, "negotiation_failed", "Negotiation failed.");
    }
  });

  api.post("/tools/finalize-call", zValidator("json", FinalizeCallRequestSchema), async (c) => {
    try {
      return c.json(await services.calls.finalizeCall(c.req.valid("json")));
    } catch (error) {
      return serviceJsonError(c, error, "finalize_call_failed", "Call finalization failed.");
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

  api.post("/voice/token", zValidator("json", VoiceTokenRequestSchema), async (c) => {
    try {
      return c.json(await services.voice.createToken(c.req.valid("json")));
    } catch (error) {
      const mapped = mapHappyRobotError(error);
      return jsonError(c, mapped.status, mapped.code, mapped.message, mapped.details);
    }
  });

  return api;
}

function listResponse<T>(data: T[]) {
  return { data };
}
