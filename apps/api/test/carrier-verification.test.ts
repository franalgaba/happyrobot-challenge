import { afterEach, describe, expect, it, vi } from "vitest";
import type { Db } from "../src/db/client";
import { createCarrierService } from "../src/services/carriers";

const seededCarrier = {
  id: 1,
  mcNumber: "123456",
  dotNumber: "7654321",
  legalName: "Evergreen Freight LLC",
  allowedToOperate: true,
  outOfService: false,
  eligible: true,
  verificationSource: "seed",
  simulated: true,
  raw: { fixture: true },
  verifiedAt: new Date("2026-06-03T00:00:00.000Z"),
  createdAt: new Date("2026-06-03T00:00:00.000Z"),
  updatedAt: new Date("2026-06-03T00:00:00.000Z"),
};

function dbReturningCarrier(record: typeof seededCarrier | undefined) {
  return {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(async () => (record ? [record] : [])),
        })),
      })),
    })),
  } as unknown as Db;
}

describe("carrier verification", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("does not use seeded fallback when live FMCSA is required and unavailable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("unavailable", { status: 503 })),
    );

    const service = createCarrierService({} as Db, {
      allowSeededCarrierFallback: false,
      demoCarrierMcNumbers: [],
      fmcsaWebKey: "live-fmcsa-web-key",
    });

    await expect(service.verifyCarrier({ mcNumber: "999999" })).rejects.toMatchObject({
      code: "fmcsa_unavailable",
      status: 503,
    });
  });

  it("uses seeded fallback for demo MC 123456 when FMCSA is not configured", async () => {
    const service = createCarrierService(dbReturningCarrier(seededCarrier), {
      allowSeededCarrierFallback: false,
      demoCarrierMcNumbers: ["123456"],
      fmcsaWebKey: undefined,
    });

    await expect(service.verifyCarrier({ mcNumber: "123456" })).resolves.toMatchObject({
      eligible: true,
      legalName: "Evergreen Freight LLC",
      mcNumber: "123456",
      simulated: true,
      verificationSource: "seed",
    });
  });
});
