import { randomUUID } from "node:crypto";
import { eq, or, sql } from "drizzle-orm";
import type { FinalizeCallRequest } from "@happyrobot-challenge/shared";
import type { Db } from "../db/client";
import { calls, carriers, negotiations } from "../db/schema";
import { conflict } from "../utils/errors";
import { normalizeMcNumber } from "../utils/http";
import type { CallService } from "./types";

type CallStore = Pick<Db, "execute" | "insert" | "select" | "update">;
type StoredCall = typeof calls.$inferSelect;
type CallIdentity = {
  readonly runId?: string;
  readonly sessionId?: string;
};
type CallInsertOptions = {
  readonly callId: string;
  readonly mcNumber: string | undefined;
  readonly carrier: typeof carriers.$inferSelect | undefined;
  readonly negotiation: typeof negotiations.$inferSelect | undefined;
};

async function findCarrierByMcNumber(db: CallStore, mcNumber: string | undefined) {
  if (!mcNumber) {
    return undefined;
  }

  const [carrier] = await db.select().from(carriers).where(eq(carriers.mcNumber, mcNumber)).limit(1);
  return carrier;
}

async function findNegotiationById(db: CallStore, negotiationId: string | undefined) {
  if (!negotiationId) {
    return undefined;
  }

  const [negotiation] = await db.select().from(negotiations).where(eq(negotiations.id, negotiationId)).limit(1);
  return negotiation;
}

async function lockCallIdentity(db: CallStore, input: FinalizeCallRequest) {
  const lockKeys = callIdentityLockKeys(callIdentityFrom(input));

  for (const lockKey of lockKeys) {
    await db.execute(sql`select pg_advisory_xact_lock(hashtextextended(${lockKey}, 0))`);
  }
}

function callIdentityFrom(input: FinalizeCallRequest): CallIdentity {
  return {
    runId: input.happyrobotRunId,
    sessionId: input.happyrobotSessionId,
  };
}

function callIdentityLockKeys(identity: CallIdentity) {
  return [
    identity.runId ? `happyrobot-run:${identity.runId}` : undefined,
    identity.sessionId ? `happyrobot-session:${identity.sessionId}` : undefined,
  ]
    .filter((key): key is string => Boolean(key))
    .sort();
}

function hasCompleteIdentity(identity: CallIdentity): identity is Required<CallIdentity> {
  return Boolean(identity.runId && identity.sessionId);
}

function hasConflictingIdentity(call: StoredCall, identity: CallIdentity) {
  return (
    (call.happyrobotRunId != null &&
      identity.runId != null &&
      call.happyrobotRunId !== identity.runId) ||
    (call.happyrobotSessionId != null &&
      identity.sessionId != null &&
      call.happyrobotSessionId !== identity.sessionId)
  );
}

function hasMissingIdentityValue(call: StoredCall, identity: CallIdentity) {
  const canAttachSessionId =
    call.happyrobotRunId === identity.runId &&
    call.happyrobotSessionId == null &&
    identity.sessionId != null;
  const canAttachRunId =
    call.happyrobotSessionId === identity.sessionId &&
    call.happyrobotRunId == null &&
    identity.runId != null;

  return canAttachSessionId || canAttachRunId;
}

function canCompleteIdentity(call: StoredCall, identity: CallIdentity) {
  return !hasConflictingIdentity(call, identity) && hasMissingIdentityValue(call, identity);
}

function callMatchesIdentity(call: StoredCall, identity: Required<CallIdentity>) {
  return call.happyrobotRunId === identity.runId && call.happyrobotSessionId === identity.sessionId;
}

function buildIdentityUpdates(call: StoredCall, identity: CallIdentity): Partial<typeof calls.$inferInsert> {
  return {
    ...(call.happyrobotRunId == null && identity.runId ? { happyrobotRunId: identity.runId } : {}),
    ...(call.happyrobotSessionId == null && identity.sessionId ? { happyrobotSessionId: identity.sessionId } : {}),
  };
}

async function completeIdentity(db: CallStore, call: StoredCall, identity: CallIdentity) {
  const updates = buildIdentityUpdates(call, identity);

  if (Object.keys(updates).length === 0) {
    return call;
  }

  await db.update(calls).set(updates).where(eq(calls.id, call.id));
  return { ...call, ...updates };
}

async function findCallsByAnyIdentityValue(db: CallStore, identity: Required<CallIdentity>) {
  return db
    .select()
    .from(calls)
    .where(or(eq(calls.happyrobotRunId, identity.runId), eq(calls.happyrobotSessionId, identity.sessionId)))
    .for("update");
}

function assertNoIdentityConflict(matchingCalls: StoredCall[], identity: CallIdentity) {
  const hasConflictingCall =
    matchingCalls.length > 1 || matchingCalls.some((call) => hasConflictingIdentity(call, identity));

  if (hasConflictingCall) {
    throw conflict(
      "HappyRobot run ID and session ID conflict with an existing finalized call.",
      "call_identity_conflict",
    );
  }
}

async function findCallByCompleteIdentity(db: CallStore, identity: Required<CallIdentity>) {
  const matchingCalls = await findCallsByAnyIdentityValue(db, identity);
  const exactCall = matchingCalls.find((call) => callMatchesIdentity(call, identity));

  if (exactCall) {
    return exactCall;
  }

  assertNoIdentityConflict(matchingCalls, identity);

  const [partialCall] = matchingCalls;
  if (partialCall && canCompleteIdentity(partialCall, identity)) {
    return completeIdentity(db, partialCall, identity);
  }

  return undefined;
}

async function findCallByRunId(db: CallStore, runId: string) {
  const [call] = await db.select().from(calls).where(eq(calls.happyrobotRunId, runId)).limit(1).for("update");
  return call;
}

async function findCallBySessionId(db: CallStore, sessionId: string) {
  const [call] = await db
    .select()
    .from(calls)
    .where(eq(calls.happyrobotSessionId, sessionId))
    .limit(1)
    .for("update");
  return call;
}

async function findExistingCall(db: CallStore, input: FinalizeCallRequest) {
  const identity = callIdentityFrom(input);

  if (hasCompleteIdentity(identity)) {
    return findCallByCompleteIdentity(db, identity);
  }

  if (identity.runId) {
    return findCallByRunId(db, identity.runId);
  }

  if (identity.sessionId) {
    return findCallBySessionId(db, identity.sessionId);
  }

  return undefined;
}

function callInsertValues(input: FinalizeCallRequest, options: CallInsertOptions): typeof calls.$inferInsert {
  return {
    id: options.callId,
    happyrobotRunId: input.happyrobotRunId,
    happyrobotSessionId: input.happyrobotSessionId,
    negotiationId: input.negotiationId,
    loadId: input.loadId ?? options.negotiation?.loadId,
    mcNumber: options.mcNumber,
    carrierId: options.carrier?.id ?? options.negotiation?.carrierId,
    outcome: input.outcome,
    sentiment: input.sentiment,
    agreedRate: input.agreedRate == null ? null : String(input.agreedRate),
    extractedData: input.extractedData ?? {},
    transcript: input.transcript,
    summary: input.summary,
    transferMock: input.transferMock ?? false,
  };
}

async function insertCall(db: CallStore, input: FinalizeCallRequest) {
  const mcNumber = input.mcNumber ? normalizeMcNumber(input.mcNumber) : undefined;
  const [carrier, negotiation] = await Promise.all([
    findCarrierByMcNumber(db, mcNumber),
    findNegotiationById(db, input.negotiationId),
  ]);
  const callId = randomUUID();

  await db.insert(calls).values(
    callInsertValues(input, {
      callId,
      mcNumber,
      carrier,
      negotiation,
    }),
  );

  return callId;
}

export function createCallService(db: Db): CallService {
  return {
    async finalizeCall(input: FinalizeCallRequest) {
      return db.transaction(async (tx) => {
        await lockCallIdentity(tx, input);

        const existingCall = await findExistingCall(tx, input);
        if (existingCall) {
          return { callId: existingCall.id, stored: true as const };
        }

        const callId = await insertCall(tx, input);

        return { callId, stored: true as const };
      });
    },
  };
}
