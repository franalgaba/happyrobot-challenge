import { z } from "zod";

const OptionalNonEmptyStringSchema = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().min(1).optional(),
);

function optionalBoolean(value: string | undefined) {
  if (value == null || value.trim() === "") {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "y"].includes(normalized)) {
    return true;
  }
  if (["0", "false", "no", "n"].includes(normalized)) {
    return false;
  }

  return value;
}

function stringList(value: string | undefined) {
  return value
    ?.split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

const RuntimeConfigInputSchema = z.object({
  nodeEnv: z.string().default("development"),
  port: z.coerce.number().int().positive().default(3000),
  databaseUrl: z.string().min(1),
  apiKey: z.string().min(8),
  mcpPathToken: z.string().min(8),
  publicApiBaseUrl: z.string().url().default("http://localhost:3000"),
  happyrobotApiKey: z.string().optional(),
  happyrobotCluster: z.enum(["us", "eu"]).default("us"),
  happyrobotWorkflowId: z.string().optional(),
  happyrobotEnvironment: z.enum(["development", "production", "staging"]).default("production"),
  fmcsaWebKey: OptionalNonEmptyStringSchema,
  allowSeededCarrierFallback: z.boolean().optional(),
  demoCarrierMcNumbers: z.array(z.string()).default(["123456", "654321", "777888"]),
  corsOrigins: z.array(z.string()).default(["http://localhost:5173", "http://localhost:4173"]),
});

export const RuntimeConfigSchema = RuntimeConfigInputSchema.extend({
  allowSeededCarrierFallback: z.boolean(),
});

export type RuntimeConfig = z.infer<typeof RuntimeConfigSchema>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): RuntimeConfig {
  const config = RuntimeConfigInputSchema.parse({
    nodeEnv: env.NODE_ENV,
    port: env.PORT,
    databaseUrl: env.DATABASE_URL,
    apiKey: env.API_KEY,
    mcpPathToken: env.MCP_PATH_TOKEN,
    publicApiBaseUrl: env.PUBLIC_API_BASE_URL,
    happyrobotApiKey: env.HAPPYROBOT_API_KEY,
    happyrobotCluster: env.HAPPYROBOT_CLUSTER,
    happyrobotWorkflowId: env.HAPPYROBOT_WORKFLOW_ID,
    happyrobotEnvironment: env.HAPPYROBOT_ENVIRONMENT,
    fmcsaWebKey: env.FMCSA_WEB_KEY,
    allowSeededCarrierFallback: optionalBoolean(env.ALLOW_SEEDED_CARRIER_FALLBACK),
    demoCarrierMcNumbers: stringList(env.DEMO_CARRIER_MC_NUMBERS),
    corsOrigins: env.CORS_ORIGINS
      ? env.CORS_ORIGINS.split(",").map((origin) => origin.trim()).filter(Boolean)
      : undefined,
  });

  const allowSeededCarrierFallback = config.allowSeededCarrierFallback ?? config.nodeEnv !== "production";
  if (config.nodeEnv === "production" && !allowSeededCarrierFallback && !config.fmcsaWebKey && config.demoCarrierMcNumbers.length === 0) {
    throw new Error("FMCSA_WEB_KEY is required in production unless demo MC numbers or seeded fallback are explicitly configured.");
  }

  return RuntimeConfigSchema.parse({
    ...config,
    allowSeededCarrierFallback,
  });
}
