import { zodToJsonSchema } from "zod-to-json-schema";
import {
  FinalizeCallRequestSchema,
  NegotiateOfferRequestSchema,
  SearchLoadsRequestSchema,
  VerifyCarrierRequestSchema,
} from "@happyrobot-challenge/shared";
import type { AppServices } from "../services/types";
import type { z } from "zod";

const MCP_MESSAGE_MC_NUMBER_PATTERN = /\b(?:MC\s*)?(\d{5,8})\b/i;
const UNRESOLVED_TEMPLATE_VALUE_PATTERN = /^@[A-Za-z_][\w.]*$/;
const NUMERIC_MCP_FIELDS = new Set(["limit", "carrierOfferRate", "agreedRate"]);

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

type McpToolName = (typeof mcpTools)[number]["name"];
type McpToolHandler = (services: AppServices, args: unknown) => Promise<unknown> | unknown;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function extractMcNumberFromMessage(value: unknown) {
  if (typeof value !== "string") {
    return undefined;
  }

  const match = MCP_MESSAGE_MC_NUMBER_PATTERN.exec(value);
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
  return typeof value === "string" && UNRESOLVED_TEMPLATE_VALUE_PATTERN.test(value.trim());
}

function hasValue(value: unknown) {
  return value !== "" && value !== undefined && value !== null && !isUnresolvedTemplateValue(value);
}

function stripEmptyOptionalValues(args: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(args).filter(([, value]) => hasValue(value)));
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

function normalizeMcNumber(args: Record<string, unknown>) {
  if (typeof args.mcNumber === "string") {
    return args;
  }

  const mcNumber = extractMcNumberFromMessage(args._message);
  return mcNumber ? { ...args, mcNumber } : args;
}

function normalizeNumericFields(args: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(args).map(([fieldName, value]) => [
      fieldName,
      NUMERIC_MCP_FIELDS.has(fieldName) ? numberFromMcpValue(value) : value,
    ]),
  );
}

function normalizeTransferMock(args: Record<string, unknown>) {
  if (!("transferMock" in args)) {
    return args;
  }

  return { ...args, transferMock: booleanFromMcpValue(args.transferMock) };
}

function normalizeFinalizationData(toolName: string, args: Record<string, unknown>) {
  if (toolName !== "finalize_call" || !("extractedData" in args)) {
    return args;
  }

  const extractedData = objectFromMcpValue(args.extractedData);
  if (isRecord(extractedData)) {
    return { ...args, extractedData };
  }

  const argsWithoutExtractedData = { ...args };
  delete argsWithoutExtractedData.extractedData;
  return argsWithoutExtractedData;
}

function normalizeMcpToolArgs(name: string, args: unknown) {
  if (!isRecord(args)) {
    return args;
  }

  const argsWithOptionalValuesRemoved = stripEmptyOptionalValues(args);
  const argsWithMcNumber = normalizeMcNumber(argsWithOptionalValuesRemoved);
  const argsWithNumericValues = normalizeNumericFields(argsWithMcNumber);
  const argsWithTransferMock = normalizeTransferMock(argsWithNumericValues);
  return normalizeFinalizationData(name, argsWithTransferMock);
}

function verifyCarrierTool(services: AppServices, args: unknown) {
  return services.carriers.verifyCarrier(VerifyCarrierRequestSchema.parse(args));
}

function searchLoadsTool(services: AppServices, args: unknown) {
  return services.loads.searchLoads(SearchLoadsRequestSchema.parse(args));
}

function negotiateOfferTool(services: AppServices, args: unknown) {
  return services.negotiations.negotiateOffer(NegotiateOfferRequestSchema.parse(args));
}

function finalizeCallTool(services: AppServices, args: unknown) {
  return services.calls.finalizeCall(FinalizeCallRequestSchema.parse(args));
}

const mcpToolHandlers: Record<McpToolName, McpToolHandler> = {
  verify_carrier: verifyCarrierTool,
  search_loads: searchLoadsTool,
  negotiate_offer: negotiateOfferTool,
  finalize_call: finalizeCallTool,
};

function isMcpToolName(name: string): name is McpToolName {
  return name in mcpToolHandlers;
}

export async function callMcpTool(services: AppServices, name: string, args: unknown) {
  if (!isMcpToolName(name)) {
    throw new Error(`Unknown MCP tool: ${name}`);
  }

  const normalizedArgs = normalizeMcpToolArgs(name, args);
  return mcpToolHandlers[name](services, normalizedArgs);
}
