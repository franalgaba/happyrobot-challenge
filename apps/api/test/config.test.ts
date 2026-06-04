import { describe, expect, it } from "vitest";
import { loadConfig } from "../src/env/config";

const requiredEnv = {
  DATABASE_URL: "postgres://postgres:postgres@localhost:5432/happyrobot_challenge",
  API_KEY: "test-api-key",
  MCP_PATH_TOKEN: "test-mcp-token",
};

describe("runtime config", () => {
  it("allows production demo MC fallback by default", () => {
    expect(loadConfig({ ...requiredEnv, NODE_ENV: "production" })).toMatchObject({
      allowSeededCarrierFallback: false,
      demoCarrierMcNumbers: ["123456", "654321", "777888"],
      fmcsaWebKey: undefined,
      nodeEnv: "production",
    });
  });

  it("requires FMCSA_WEB_KEY in production when demo fallback is disabled", () => {
    expect(() =>
      loadConfig({
        ...requiredEnv,
        NODE_ENV: "production",
        ALLOW_SEEDED_CARRIER_FALLBACK: "false",
        DEMO_CARRIER_MC_NUMBERS: "",
      }),
    ).toThrow("FMCSA_WEB_KEY is required in production unless demo MC numbers or seeded fallback are explicitly configured.");
  });

  it("allows explicit seeded fallback for production demos", () => {
    expect(
      loadConfig({
        ...requiredEnv,
        NODE_ENV: "production",
        ALLOW_SEEDED_CARRIER_FALLBACK: "true",
      }),
    ).toMatchObject({
      allowSeededCarrierFallback: true,
      demoCarrierMcNumbers: ["123456", "654321", "777888"],
      fmcsaWebKey: undefined,
      nodeEnv: "production",
    });
  });

  it("uses live FMCSA in production when FMCSA_WEB_KEY is set", () => {
    expect(
      loadConfig({
        ...requiredEnv,
        NODE_ENV: "production",
        FMCSA_WEB_KEY: "live-fmcsa-web-key",
      }),
    ).toMatchObject({
      allowSeededCarrierFallback: false,
      demoCarrierMcNumbers: ["123456", "654321", "777888"],
      fmcsaWebKey: "live-fmcsa-web-key",
      nodeEnv: "production",
    });
  });

  it("defaults local and test environments to seeded fallback", () => {
    expect(loadConfig({ ...requiredEnv, NODE_ENV: "test" })).toMatchObject({
      allowSeededCarrierFallback: true,
      demoCarrierMcNumbers: ["123456", "654321", "777888"],
      fmcsaWebKey: undefined,
      nodeEnv: "test",
    });
  });

  it("accepts a custom demo MC fallback allowlist", () => {
    expect(
      loadConfig({
        ...requiredEnv,
        NODE_ENV: "production",
        DEMO_CARRIER_MC_NUMBERS: "123456, 654321",
      }),
    ).toMatchObject({
      demoCarrierMcNumbers: ["123456", "654321"],
    });
  });
});
