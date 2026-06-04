import { z } from "zod";

export const MoneyStringSchema = z.string().regex(/^\d+(\.\d{1,2})?$/);

export const DimensionsSchema = z.object({
  lengthFt: z.number().positive().optional(),
  widthFt: z.number().positive().optional(),
  heightFt: z.number().positive().optional(),
  raw: z.string().optional(),
});

export const LoadSchema = z.object({
  loadId: z.string(),
  origin: z.string(),
  destination: z.string(),
  pickupDatetime: z.string().datetime(),
  deliveryDatetime: z.string().datetime(),
  equipmentType: z.string(),
  loadboardRate: z.number(),
  notes: z.string().nullable(),
  weight: z.number().int().nullable(),
  commodityType: z.string().nullable(),
  numOfPieces: z.number().int().nullable(),
  miles: z.number().int().nullable(),
  dimensions: DimensionsSchema.nullable(),
  targetRate: z.number(),
  maxAutoRate: z.number(),
  active: z.boolean(),
});

export const VerifyCarrierRequestSchema = z.object({
  mcNumber: z.string().min(1).describe("Carrier MC number, with or without the MC prefix."),
});

export const VerifyCarrierResponseSchema = z.object({
  mcNumber: z.string(),
  dotNumber: z.string().nullable(),
  legalName: z.string().nullable(),
  eligible: z.boolean(),
  allowedToOperate: z.boolean().nullable(),
  outOfService: z.boolean().nullable(),
  verificationSource: z.enum(["fmcsa", "seed", "none"]),
  simulated: z.boolean(),
  reason: z.string(),
  verifiedAt: z.string().datetime(),
});

export const SearchLoadsRequestSchema = z.object({
  origin: z.string().optional(),
  destination: z.string().optional(),
  equipmentType: z.string().optional(),
  pickupDate: z.string().optional().describe("ISO date or datetime preferred by the carrier."),
  limit: z.number().int().min(1).max(10).default(3).optional(),
});

export const SearchLoadResultSchema = LoadSchema.extend({
  score: z.number(),
  pitch: z.string(),
});

export const SearchLoadsResponseSchema = z.object({
  matches: z.array(SearchLoadResultSchema),
  total: z.number().int(),
});

export const NegotiateOfferRequestSchema = z.object({
  sessionId: z.string().min(1),
  negotiationId: z.string().optional(),
  loadId: z.string().min(1),
  mcNumber: z.string().min(1),
  carrierOfferRate: z.number().positive(),
});

export const NegotiationDecisionSchema = z.enum(["counter", "reject", "transfer_mock"]);

export const NegotiateOfferResponseSchema = z.object({
  negotiationId: z.string(),
  decision: NegotiationDecisionSchema,
  round: z.number().int().min(1).max(3),
  carrierOfferRate: z.number(),
  counterRate: z.number().nullable(),
  agreedRate: z.number().nullable(),
  message: z.string(),
  remainingRounds: z.number().int().min(0).max(2),
});

export const CallOutcomeSchema = z.enum([
  "booked",
  "rejected",
  "no_match",
  "ineligible",
  "transferred",
  "follow_up",
  "human_review",
]);

export const SentimentSchema = z.enum(["positive", "neutral", "negative", "mixed"]);

const MAX_SUMMARY_LENGTH = 2_000;
const MAX_TRANSCRIPT_LENGTH = 50_000;
const MAX_EXTRACTED_DATA_BYTES = 20_000;

const ExtractedDataSchema = z
  .record(z.unknown())
  .refine((data) => JSON.stringify(data).length <= MAX_EXTRACTED_DATA_BYTES, {
    message: `Extracted data must be at most ${MAX_EXTRACTED_DATA_BYTES} bytes.`,
  });

export const FinalizeCallRequestSchema = z.object({
  happyrobotRunId: z.string().optional(),
  happyrobotSessionId: z.string().optional(),
  negotiationId: z.string().optional(),
  loadId: z.string().optional(),
  mcNumber: z.string().optional(),
  outcome: CallOutcomeSchema,
  sentiment: SentimentSchema,
  agreedRate: z.number().positive().optional(),
  transferMock: z.boolean().default(false).optional(),
  summary: z.string().max(MAX_SUMMARY_LENGTH).optional(),
  transcript: z.string().max(MAX_TRANSCRIPT_LENGTH).optional(),
  extractedData: ExtractedDataSchema.default({}).optional(),
});

export const FinalizeCallResponseSchema = z.object({
  callId: z.string(),
  stored: z.literal(true),
});

export const VoiceTokenRequestSchema = z.object({
  workflowId: z.string().optional(),
  data: z.record(z.unknown()).optional(),
  environment: z.enum(["development", "production", "staging"]).optional(),
  ttlSeconds: z.number().int().min(60).max(86400).optional(),
});

export const VoiceTokenResponseSchema = z.object({
  url: z.string().url(),
  token: z.string().min(1),
  room_name: z.string().min(1),
  run_id: z.string().min(1),
});

export const ReportSummarySchema = z.object({
  totalCalls: z.number().int(),
  byOutcome: z.record(z.number().int()),
  bySentiment: z.record(z.number().int()),
  averageAgreedRate: z.number().nullable(),
  negotiations: z.object({
    total: z.number().int(),
    accepted: z.number().int(),
    rejected: z.number().int(),
    countered: z.number().int(),
  }),
  carrierVerification: z.object({
    liveFmcsa: z.number().int(),
    fallbackSeeded: z.number().int(),
  }),
});

export const CallRecordSchema = z.object({
  id: z.string(),
  happyrobotRunId: z.string().nullable(),
  happyrobotSessionId: z.string().nullable(),
  negotiationId: z.string().nullable(),
  loadId: z.string().nullable(),
  mcNumber: z.string().nullable(),
  outcome: CallOutcomeSchema,
  sentiment: SentimentSchema,
  agreedRate: z.number().nullable(),
  summary: z.string().nullable(),
  extractedData: z.record(z.unknown()),
  transferMock: z.boolean(),
  createdAt: z.string().datetime(),
});

export const LoadRecordSchema = z.object({
  loadId: z.string(),
  origin: z.string(),
  destination: z.string(),
  pickupDatetime: z.string().datetime(),
  deliveryDatetime: z.string().datetime(),
  equipmentType: z.string(),
  loadboardRate: z.number(),
  targetRate: z.number(),
  maxAutoRate: z.number(),
  active: z.boolean(),
  miles: z.number().int().nullable(),
});

export const NegotiationRecordSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  loadId: z.string(),
  mcNumber: z.string(),
  roundCount: z.number().int(),
  status: z.string(),
  agreedRate: z.number().nullable(),
  lastOfferRate: z.number().nullable(),
  lastCounterRate: z.number().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const CallsReportResponseSchema = z.object({
  data: z.array(CallRecordSchema),
});

export const LoadsReportResponseSchema = z.object({
  data: z.array(LoadRecordSchema),
});

export const NegotiationsReportResponseSchema = z.object({
  data: z.array(NegotiationRecordSchema),
});

export const ApiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    requestId: z.string().optional(),
    details: z.unknown().optional(),
  }),
});

export type Load = z.infer<typeof LoadSchema>;
export type VerifyCarrierRequest = z.infer<typeof VerifyCarrierRequestSchema>;
export type VerifyCarrierResponse = z.infer<typeof VerifyCarrierResponseSchema>;
export type SearchLoadsRequest = z.infer<typeof SearchLoadsRequestSchema>;
export type SearchLoadsResponse = z.infer<typeof SearchLoadsResponseSchema>;
export type SearchLoadResult = z.infer<typeof SearchLoadResultSchema>;
export type NegotiateOfferRequest = z.infer<typeof NegotiateOfferRequestSchema>;
export type NegotiateOfferResponse = z.infer<typeof NegotiateOfferResponseSchema>;
export type FinalizeCallRequest = z.infer<typeof FinalizeCallRequestSchema>;
export type FinalizeCallResponse = z.infer<typeof FinalizeCallResponseSchema>;
export type VoiceTokenRequest = z.infer<typeof VoiceTokenRequestSchema>;
export type VoiceTokenResponse = z.infer<typeof VoiceTokenResponseSchema>;
export type CallOutcome = z.infer<typeof CallOutcomeSchema>;
export type Sentiment = z.infer<typeof SentimentSchema>;
export type ReportSummary = z.infer<typeof ReportSummarySchema>;
export type CallRecord = z.infer<typeof CallRecordSchema>;
export type LoadRecord = z.infer<typeof LoadRecordSchema>;
export type NegotiationRecord = z.infer<typeof NegotiationRecordSchema>;
export type CallsReportResponse = z.infer<typeof CallsReportResponseSchema>;
export type LoadsReportResponse = z.infer<typeof LoadsReportResponseSchema>;
export type NegotiationsReportResponse = z.infer<typeof NegotiationsReportResponseSchema>;
export type DashboardData = {
  summary: ReportSummary;
  calls: CallRecord[];
  loads: LoadRecord[];
  negotiations: NegotiationRecord[];
};
