import { and, desc, eq, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import type { NegotiateOfferRequest } from "@happyrobot-challenge/shared";
import type { Db } from "../db/client";
import { carriers, loads, negotiations, type NegotiationOffer } from "../db/schema";
import { invalidRequest, notFound } from "../utils/errors";
import { normalizeMcNumber, toNumber } from "../utils/http";
import type { NegotiationService } from "./types";

const MAX_NEGOTIATION_ROUNDS = 3;
const FIRST_COUNTER_ROUND = 1;
const SECOND_COUNTER_ROUND = 2;

type NegotiationDecision = "counter" | "reject" | "transfer_mock";
type NegotiationStatus = "accepted" | "rejected" | "countered";
type NegotiationStore = Pick<Db, "execute" | "insert" | "select" | "update">;
type StoredNegotiation = typeof negotiations.$inferSelect;
type StoredLoad = typeof loads.$inferSelect;
type StoredCarrier = typeof carriers.$inferSelect;
type NegotiationDecisionResult = ReturnType<typeof decideNegotiation>;

function thresholdForRound(targetRate: number, maxAutoRate: number, round: number) {
  if (round <= FIRST_COUNTER_ROUND) return targetRate;
  if (round === SECOND_COUNTER_ROUND) return Math.round(targetRate + (maxAutoRate - targetRate) / 2);
  return maxAutoRate;
}

function statusForDecision(decision: NegotiationDecision): NegotiationStatus {
  if (decision === "transfer_mock") return "accepted";
  if (decision === "reject") return "rejected";
  return "countered";
}

function formatRate(rate: number) {
  return `$${rate.toLocaleString("en-US")}`;
}

function messageForDecision(decision: NegotiationDecision, counterRate: number | null, agreedRate: number | null) {
  if (decision === "transfer_mock") {
    return `All set. I have you booked on this load at ${formatRate(agreedRate ?? 0)}.`;
  }
  if (decision === "counter" && counterRate != null) {
    return `I can do ${formatRate(counterRate)} on this load.`;
  }
  return "I cannot get approval at that rate. I can check for another option if you want.";
}

export function decideNegotiation(input: {
  targetRate: number;
  maxAutoRate: number;
  previousRoundCount: number;
  carrierOfferRate: number;
}) {
  const currentRound = Math.min(input.previousRoundCount + 1, MAX_NEGOTIATION_ROUNDS);
  const threshold = thresholdForRound(input.targetRate, input.maxAutoRate, currentRound);
  const carrierOfferRate = Math.round(input.carrierOfferRate);
  const accepted = carrierOfferRate <= threshold;
  const exhausted = currentRound >= MAX_NEGOTIATION_ROUNDS;
  const decision: NegotiationDecision = accepted ? "transfer_mock" : exhausted ? "reject" : "counter";
  const counterRate = decision === "counter" ? threshold : null;
  const agreedRate = decision === "transfer_mock" ? carrierOfferRate : null;

  return {
    currentRound,
    decision,
    counterRate,
    agreedRate,
    status: statusForDecision(decision),
    message: messageForDecision(decision, counterRate, agreedRate),
    remainingRounds: Math.max(0, MAX_NEGOTIATION_ROUNDS - currentRound),
    carrierOfferRate,
  };
}

function assertNegotiationMatchesInput(negotiation: StoredNegotiation, input: NegotiateOfferRequest, mcNumber: string) {
  const sessionMatches = isCarrierOnlySessionId(input.sessionId, mcNumber) || negotiation.sessionId === input.sessionId;
  const matches = sessionMatches && negotiation.loadId === input.loadId && negotiation.mcNumber === mcNumber;

  if (!matches) {
    throw notFound("Negotiation was not found for the supplied session, load, and carrier.", "negotiation_not_found");
  }
}

function isCarrierOnlySessionId(sessionId: string, mcNumber: string) {
  return normalizeMcNumber(sessionId) === mcNumber;
}

async function findActiveLoad(db: NegotiationStore, loadId: string) {
  const [load] = await db.select().from(loads).where(eq(loads.loadId, loadId)).limit(1);
  if (!load || !load.active) {
    throw notFound(`Active load ${loadId} was not found.`, "load_not_found");
  }
  return load;
}

async function findCarrierByMcNumber(db: NegotiationStore, mcNumber: string) {
  const [carrier] = await db.select().from(carriers).where(eq(carriers.mcNumber, mcNumber)).limit(1);
  return carrier;
}

async function lockNegotiationScope(db: NegotiationStore, input: NegotiateOfferRequest, mcNumber: string) {
  const lockKey = `${input.sessionId}:${input.loadId}:${mcNumber}`;
  await db.execute(sql`select pg_advisory_xact_lock(hashtextextended(${lockKey}, 0))`);
}

async function findExistingNegotiation(db: NegotiationStore, input: NegotiateOfferRequest, mcNumber: string) {
  if (input.negotiationId) {
    const [negotiation] = await db
      .select()
      .from(negotiations)
      .where(eq(negotiations.id, input.negotiationId))
      .limit(1)
      .for("update");
    if (!negotiation) {
      throw notFound(`Negotiation ${input.negotiationId} was not found.`, "negotiation_not_found");
    }
    assertNegotiationMatchesInput(negotiation, input, mcNumber);
    return negotiation;
  }

  if (isCarrierOnlySessionId(input.sessionId, mcNumber)) {
    return undefined;
  }

  const [negotiation] = await db
    .select()
    .from(negotiations)
    .where(and(eq(negotiations.sessionId, input.sessionId), eq(negotiations.loadId, input.loadId), eq(negotiations.mcNumber, mcNumber)))
    .orderBy(desc(negotiations.createdAt))
    .limit(1)
    .for("update");

  return negotiation;
}

function loadRateBounds(load: StoredLoad) {
  const targetRate = toNumber(load.targetRate) ?? 0;
  return {
    targetRate,
    maxAutoRate: toNumber(load.maxAutoRate) ?? targetRate,
  };
}

function offerFromDecision(decisionResult: NegotiationDecisionResult): NegotiationOffer {
  return {
    round: decisionResult.currentRound,
    carrierOfferRate: decisionResult.carrierOfferRate,
    decision: decisionResult.decision,
    counterRate: decisionResult.counterRate,
    agreedRate: decisionResult.agreedRate,
    at: new Date().toISOString(),
  };
}

function negotiationValues(input: NegotiateOfferRequest, options: {
  readonly mcNumber: string;
  readonly carrier: StoredCarrier | undefined;
  readonly existing: StoredNegotiation | undefined;
  readonly decisionResult: NegotiationDecisionResult;
}) {
  const offer = offerFromDecision(options.decisionResult);

  return {
    id: options.existing?.id ?? randomUUID(),
    sessionId: input.sessionId,
    loadId: input.loadId,
    mcNumber: options.mcNumber,
    carrierId: options.carrier?.id,
    roundCount: options.decisionResult.currentRound,
    status: options.decisionResult.status,
    agreedRate: options.decisionResult.agreedRate == null ? null : String(options.decisionResult.agreedRate),
    lastOfferRate: String(options.decisionResult.carrierOfferRate),
    lastCounterRate: options.decisionResult.counterRate == null ? null : String(options.decisionResult.counterRate),
    offers: [...(options.existing?.offers ?? []), offer],
    updatedAt: new Date(),
  };
}

async function persistNegotiation(db: NegotiationStore, existing: StoredNegotiation | undefined, values: ReturnType<typeof negotiationValues>) {
  if (existing) {
    await db.update(negotiations).set(values).where(eq(negotiations.id, existing.id));
    return;
  }

  await db.insert(negotiations).values({ ...values, createdAt: new Date() });
}

function negotiationResponse(values: ReturnType<typeof negotiationValues>, decisionResult: NegotiationDecisionResult) {
  return {
    negotiationId: values.id,
    decision: decisionResult.decision,
    round: decisionResult.currentRound,
    carrierOfferRate: decisionResult.carrierOfferRate,
    counterRate: decisionResult.counterRate,
    agreedRate: decisionResult.agreedRate,
    message: decisionResult.message,
    remainingRounds: decisionResult.remainingRounds,
  };
}

export function createNegotiationService(db: Db): NegotiationService {
  return {
    async negotiateOffer(input: NegotiateOfferRequest) {
      const mcNumber = normalizeMcNumber(input.mcNumber);
      if (!mcNumber) {
        throw invalidRequest("MC number must contain digits.", "invalid_mc_number");
      }

      return db.transaction(async (tx) => {
        await lockNegotiationScope(tx, input, mcNumber);

        const load = await findActiveLoad(tx, input.loadId);
        const carrier = await findCarrierByMcNumber(tx, mcNumber);
        const existing = await findExistingNegotiation(tx, input, mcNumber);
        const { targetRate, maxAutoRate } = loadRateBounds(load);
        const decisionResult = decideNegotiation({
          targetRate,
          maxAutoRate,
          previousRoundCount: existing?.roundCount ?? 0,
          carrierOfferRate: input.carrierOfferRate,
        });

        const values = negotiationValues(input, {
          mcNumber,
          carrier,
          existing,
          decisionResult,
        });
        await persistNegotiation(tx, existing, values);

        return negotiationResponse(values, decisionResult);
      });
    },
  };
}
