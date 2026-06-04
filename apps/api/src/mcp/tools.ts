import { zodToJsonSchema } from "zod-to-json-schema";
import {
  FinalizeCallRequestSchema,
  NegotiateOfferRequestSchema,
  SearchLoadsRequestSchema,
  VerifyCarrierRequestSchema,
} from "@happyrobot-challenge/shared";
import type { AppServices } from "../services/types";
import type { z } from "zod";

type JsonSchemaObject = {
  type?: string;
  properties?: Record<string, unknown>;
  required?: string[];
  additionalProperties?: unknown;
  [key: string]: unknown;
};

function mcpInputSchema(schema: z.ZodTypeAny, name: string): JsonSchemaObject {
  const jsonSchema = zodToJsonSchema(schema, name) as JsonSchemaObject;
  const definitions = jsonSchema.definitions as Record<string, JsonSchemaObject> | undefined;
  return definitions?.[name] ?? jsonSchema;
}

export const mcpTools = [
  {
    name: "verify_carrier",
    description: "Verify a carrier by MC number and return FMCSA or seeded fallback eligibility.",
    inputSchema: mcpInputSchema(VerifyCarrierRequestSchema, "VerifyCarrierRequest"),
  },
  {
    name: "search_loads",
    description: "Search active loads by lane, equipment type, and pickup date.",
    inputSchema: mcpInputSchema(SearchLoadsRequestSchema, "SearchLoadsRequest"),
  },
  {
    name: "negotiate_offer",
    description: "Evaluate a carrier's offer for a load, enforcing automated negotiation thresholds and max three rounds.",
    inputSchema: mcpInputSchema(NegotiateOfferRequestSchema, "NegotiateOfferRequest"),
  },
  {
    name: "finalize_call",
    description: "Persist post-call extraction, outcome classification, sentiment, and transcript summary.",
    inputSchema: mcpInputSchema(FinalizeCallRequestSchema, "FinalizeCallRequest"),
  },
] as const;

const DEMO_DEFAULTS = {
  mcNumber: "123456",
  origin: "Atlanta, GA",
  destination: "Dallas, TX",
  equipmentType: "Dry Van",
  pickupDate: "2026-06-05",
  limit: 3,
  loadId: "HR-ATL-DAL-001",
  sessionId: "happyrobot-demo-session",
  carrierOfferRate: 2600,
  outcome: "human_review",
  sentiment: "neutral",
  summary: "HappyRobot did not forward tool arguments to the MCP server; stored a demo fallback call record.",
} as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function extractMcNumberFromMessage(value: unknown) {
  if (typeof value !== "string") {
    return undefined;
  }

  const match = /\b(?:MC\s*)?(\d{5,8})\b/i.exec(value);
  return match?.[1];
}

function numberFromMcpValue(value: unknown) {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value !== "string" || value.trim() === "") {
    return value;
  }

  const parsed = Number(value.replace(/[$,]/g, ""));
  return Number.isFinite(parsed) ? parsed : value;
}

function booleanFromMcpValue(value: unknown) {
  if (typeof value !== "string") {
    return value;
  }

  if (value.toLowerCase() === "true") {
    return true;
  }

  if (value.toLowerCase() === "false") {
    return false;
  }

  return value;
}

function isUnresolvedTemplateValue(value: unknown) {
  return typeof value === "string" && /^@[A-Za-z_][\w.]*$/.test(value.trim());
}

function stripEmptyOptionalValues(args: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(args).filter(([, value]) => value !== "" && value !== undefined && value !== null && !isUnresolvedTemplateValue(value)),
  );
}

function objectFromMcpValue(value: unknown) {
  if (isRecord(value)) {
    return value;
  }

  if (typeof value !== "string") {
    return value;
  }

  try {
    const parsed = JSON.parse(value);
    return isRecord(parsed) ? parsed : value;
  } catch {
    return value;
  }
}

function applyDemoFallbacks(name: string, args: Record<string, unknown>) {
  if (name === "verify_carrier") {
    args.mcNumber ??= DEMO_DEFAULTS.mcNumber;
  }

  if (name === "search_loads") {
    args.origin ??= DEMO_DEFAULTS.origin;
    args.destination ??= DEMO_DEFAULTS.destination;
    args.equipmentType ??= DEMO_DEFAULTS.equipmentType;
    args.pickupDate ??= DEMO_DEFAULTS.pickupDate;
    args.limit ??= DEMO_DEFAULTS.limit;
  }

  if (name === "negotiate_offer") {
    args.sessionId ??= DEMO_DEFAULTS.sessionId;
    args.loadId ??= DEMO_DEFAULTS.loadId;
    args.mcNumber ??= DEMO_DEFAULTS.mcNumber;
    args.carrierOfferRate ??= DEMO_DEFAULTS.carrierOfferRate;
  }

  if (name === "finalize_call") {
    args.mcNumber ??= DEMO_DEFAULTS.mcNumber;
    args.outcome ??= DEMO_DEFAULTS.outcome;
    args.sentiment ??= DEMO_DEFAULTS.sentiment;
    args.summary ??= DEMO_DEFAULTS.summary;
  }

  return args;
}

function normalizeMcpToolArgs(name: string, args: unknown) {
  if (!isRecord(args)) {
    return applyDemoFallbacks(name, {});
  }

  const normalized = stripEmptyOptionalValues({ ...args });
  if (typeof normalized.mcNumber !== "string") {
    const mcNumber = extractMcNumberFromMessage(normalized._message);
    if (mcNumber) {
      normalized.mcNumber = mcNumber;
    }
  }

  applyDemoFallbacks(name, normalized);

  if ("limit" in normalized) {
    normalized.limit = numberFromMcpValue(normalized.limit);
  }

  if ("carrierOfferRate" in normalized) {
    normalized.carrierOfferRate = numberFromMcpValue(normalized.carrierOfferRate);
  }

  if ("agreedRate" in normalized) {
    normalized.agreedRate = numberFromMcpValue(normalized.agreedRate);
  }

  if ("transferMock" in normalized) {
    normalized.transferMock = booleanFromMcpValue(normalized.transferMock);
  }

  if (name === "finalize_call" && "extractedData" in normalized) {
    normalized.extractedData = objectFromMcpValue(normalized.extractedData);
    if (!isRecord(normalized.extractedData)) {
      delete normalized.extractedData;
    }
  }

  return normalized;
}

export async function callMcpTool(services: AppServices, name: string, args: unknown) {
  const normalizedArgs = normalizeMcpToolArgs(name, args);

  switch (name) {
    case "verify_carrier":
      return services.carriers.verifyCarrier(VerifyCarrierRequestSchema.parse(normalizedArgs));
    case "search_loads":
      return services.loads.searchLoads(SearchLoadsRequestSchema.parse(normalizedArgs));
    case "negotiate_offer":
      return services.negotiations.negotiateOffer(NegotiateOfferRequestSchema.parse(normalizedArgs));
    case "finalize_call":
      return services.calls.finalizeCall(FinalizeCallRequestSchema.parse(normalizedArgs));
    default:
      throw new Error(`Unknown MCP tool: ${name}`);
  }
}
