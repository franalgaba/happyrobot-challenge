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

export async function callMcpTool(services: AppServices, name: string, args: unknown) {
  switch (name) {
    case "verify_carrier":
      return services.carriers.verifyCarrier(VerifyCarrierRequestSchema.parse(args));
    case "search_loads":
      return services.loads.searchLoads(SearchLoadsRequestSchema.parse(args));
    case "negotiate_offer":
      return services.negotiations.negotiateOffer(NegotiateOfferRequestSchema.parse(args));
    case "finalize_call":
      return services.calls.finalizeCall(FinalizeCallRequestSchema.parse(args));
    default:
      throw new Error(`Unknown MCP tool: ${name}`);
  }
}
