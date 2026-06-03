import { z } from "zod";

export const RuntimeConfigSchema = z.object({
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
  fmcsaWebKey: z.string().optional(),
  corsOrigins: z.array(z.string()).default(["http://localhost:5173", "http://localhost:4173"]),
});

export type RuntimeConfig = z.infer<typeof RuntimeConfigSchema>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): RuntimeConfig {
  return RuntimeConfigSchema.parse({
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
    corsOrigins: env.CORS_ORIGINS
      ? env.CORS_ORIGINS.split(",").map((origin) => origin.trim()).filter(Boolean)
      : undefined,
  });
}
