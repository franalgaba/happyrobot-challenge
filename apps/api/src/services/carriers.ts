import { eq } from "drizzle-orm";
import type { VerifyCarrierRequest, VerifyCarrierResponse } from "@happyrobot-challenge/shared";
import type { Db } from "../db/client";
import { carriers } from "../db/schema";
import type { RuntimeConfig } from "../env/config";
import { invalidRequest } from "../utils/errors";
import { normalizeMcNumber } from "../utils/http";
import type { CarrierService } from "./types";

type FmcsaCarrier = {
  dotNumber?: string | number | null;
  legalName?: string | null;
  allowedToOperate?: string | boolean | null;
  outOfService?: string | boolean | null;
  docketNumber?: string | null;
};

type StoredCarrierInput = {
  mcNumber: string;
  dotNumber: string | null;
  legalName: string | null;
  allowedToOperate: boolean | null;
  outOfService: boolean | null;
  eligible: boolean;
  verificationSource: "fmcsa" | "seed" | "none";
  simulated: boolean;
  raw: Record<string, unknown> | null;
};
type StoredCarrier = typeof carriers.$inferSelect;
type VerificationSource = VerifyCarrierResponse["verificationSource"];
type CarrierResponseInput = {
  mcNumber: string;
  dotNumber: string | null;
  legalName: string | null;
  eligible: boolean;
  allowedToOperate: boolean | null;
  outOfService: boolean | null;
  verificationSource: VerificationSource;
  simulated: boolean;
  verifiedAt: Date | string;
  reason: string;
};

const FMCSA_DOCKET_LOOKUP_BASE_URL = "https://mobile.fmcsa.dot.gov/qc/services/carriers/docket-number";
const FMCSA_TRUE_VALUES = new Set(["Y", "YES", "TRUE", "1"]);

function parseFmcsaBoolean(value: string | boolean | null | undefined) {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value !== "string") {
    return null;
  }
  return FMCSA_TRUE_VALUES.has(value.toUpperCase());
}

function extractCarrier(payload: unknown): FmcsaCarrier | null {
  const content = (payload as { content?: unknown })?.content;
  const candidate = Array.isArray(content) ? content[0] : content;
  const carrier = (candidate as { carrier?: unknown })?.carrier ?? candidate;
  return carrier && typeof carrier === "object" ? (carrier as FmcsaCarrier) : null;
}

function isEligibleCarrier(input: { allowedToOperate: boolean | null; outOfService: boolean | null }) {
  return input.allowedToOperate === true && input.outOfService !== true;
}

function fmcsaReason(eligible: boolean) {
  return eligible
    ? "Carrier is allowed to operate and is not out of service."
    : "Carrier is not eligible based on FMCSA status.";
}

function seedReason(record: StoredCarrier) {
  return record.eligible ? "Seeded fallback carrier is eligible." : "Seeded fallback carrier is not eligible.";
}

function notFoundCarrierResponse(mcNumber: string) {
  return toCarrierResponse({
    mcNumber,
    dotNumber: null,
    legalName: null,
    eligible: false,
    allowedToOperate: null,
    outOfService: null,
    verificationSource: "none",
    simulated: true,
    reason: "Carrier was not found in seeded fallback data.",
    verifiedAt: new Date().toISOString(),
  });
}

function toCarrierResponse(input: CarrierResponseInput): VerifyCarrierResponse {
  return {
    mcNumber: input.mcNumber,
    dotNumber: input.dotNumber,
    legalName: input.legalName,
    eligible: input.eligible,
    allowedToOperate: input.allowedToOperate,
    outOfService: input.outOfService,
    verificationSource: input.verificationSource,
    simulated: input.simulated,
    reason: input.reason,
    verifiedAt: input.verifiedAt instanceof Date ? input.verifiedAt.toISOString() : input.verifiedAt,
  };
}

export function createCarrierService(db: Db, config: Pick<RuntimeConfig, "fmcsaWebKey">): CarrierService {
  async function storeCarrier(input: StoredCarrierInput) {
    const updatedAt = new Date();
    const [record] = await db
      .insert(carriers)
      .values({
        ...input,
        verifiedAt: updatedAt,
        updatedAt,
      })
      .onConflictDoUpdate({
        target: carriers.mcNumber,
        set: {
          dotNumber: input.dotNumber,
          legalName: input.legalName,
          allowedToOperate: input.allowedToOperate,
          outOfService: input.outOfService,
          eligible: input.eligible,
          verificationSource: input.verificationSource,
          simulated: input.simulated,
          raw: input.raw,
          verifiedAt: updatedAt,
          updatedAt,
        },
      })
      .returning();

    if (!record) {
      throw new Error("Carrier upsert did not return a record.");
    }

    return record;
  }

  function buildFmcsaLookupUrl(mcNumber: string) {
    const url = new URL(`${FMCSA_DOCKET_LOOKUP_BASE_URL}/${mcNumber}`);
    url.searchParams.set("webKey", config.fmcsaWebKey ?? "");
    return url;
  }

  async function verifyWithFmcsa(mcNumber: string): Promise<VerifyCarrierResponse | null> {
    if (!config.fmcsaWebKey) {
      return null;
    }

    const response = await fetch(buildFmcsaLookupUrl(mcNumber));
    if (!response.ok) {
      throw new Error(`FMCSA lookup failed with status ${response.status}`);
    }

    const payload = (await response.json()) as Record<string, unknown>;
    const carrier = extractCarrier(payload);
    if (!carrier) {
      return null;
    }

    const allowedToOperate = parseFmcsaBoolean(carrier.allowedToOperate);
    const outOfService = parseFmcsaBoolean(carrier.outOfService);
    const eligible = isEligibleCarrier({ allowedToOperate, outOfService });
    const stored = await storeCarrier({
      mcNumber,
      dotNumber: carrier.dotNumber == null ? null : String(carrier.dotNumber),
      legalName: carrier.legalName ?? null,
      allowedToOperate,
      outOfService,
      eligible,
      verificationSource: "fmcsa",
      simulated: false,
      raw: payload,
    });

    return toCarrierResponse({
      mcNumber,
      dotNumber: stored.dotNumber,
      legalName: stored.legalName,
      eligible: stored.eligible,
      allowedToOperate: stored.allowedToOperate,
      outOfService: stored.outOfService,
      verificationSource: "fmcsa",
      simulated: false,
      reason: fmcsaReason(eligible),
      verifiedAt: stored.verifiedAt,
    });
  }

  async function verifyFromSeed(mcNumber: string): Promise<VerifyCarrierResponse> {
    const [record] = await db.select().from(carriers).where(eq(carriers.mcNumber, mcNumber)).limit(1);
    if (!record) {
      return notFoundCarrierResponse(mcNumber);
    }

    return toCarrierResponse({
      mcNumber,
      dotNumber: record.dotNumber,
      legalName: record.legalName,
      eligible: record.eligible,
      allowedToOperate: record.allowedToOperate,
      outOfService: record.outOfService,
      verificationSource: "seed",
      simulated: true,
      reason: seedReason(record),
      verifiedAt: record.verifiedAt,
    });
  }

  return {
    async verifyCarrier(input: VerifyCarrierRequest) {
      const mcNumber = normalizeMcNumber(input.mcNumber);
      if (!mcNumber) {
        throw invalidRequest("MC number must contain digits.", "invalid_mc_number");
      }

      let liveResult: VerifyCarrierResponse | null = null;
      try {
        liveResult = await verifyWithFmcsa(mcNumber);
      } catch (error) {
        console.warn(error instanceof Error ? error.message : "FMCSA lookup failed.");
      }

      return liveResult ?? verifyFromSeed(mcNumber);
    },
  };
}
