import { desc } from "drizzle-orm";
import type { CallRecord, LoadRecord, NegotiationRecord, ReportSummary } from "@happyrobot-challenge/shared";
import type { Db } from "../db/client";
import { calls, carriers, loads, negotiations } from "../db/schema";
import { iso, toNumber } from "../utils/http";
import type { ReportService } from "./types";

function increment(target: Record<string, number>, key: string) {
  target[key] = (target[key] ?? 0) + 1;
}

function countBy<T>(rows: T[], keySelector: (row: T) => string) {
  return rows.reduce<Record<string, number>>((counts, row) => {
    increment(counts, keySelector(row));
    return counts;
  }, {});
}

function countWhere<T>(rows: T[], predicate: (row: T) => boolean) {
  return rows.filter(predicate).length;
}

function average(values: number[]) {
  if (values.length === 0) {
    return null;
  }
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function callRecord(row: typeof calls.$inferSelect): CallRecord {
  return {
    id: row.id,
    happyrobotRunId: row.happyrobotRunId,
    happyrobotSessionId: row.happyrobotSessionId,
    negotiationId: row.negotiationId,
    loadId: row.loadId,
    mcNumber: row.mcNumber,
    outcome: row.outcome as CallRecord["outcome"],
    sentiment: row.sentiment as CallRecord["sentiment"],
    agreedRate: toNumber(row.agreedRate),
    summary: row.summary,
    extractedData: row.extractedData,
    transferMock: row.transferMock,
    createdAt: iso(row.createdAt),
  };
}

function loadRecord(row: typeof loads.$inferSelect): LoadRecord {
  return {
    loadId: row.loadId,
    origin: row.origin,
    destination: row.destination,
    pickupDatetime: iso(row.pickupDatetime),
    deliveryDatetime: iso(row.deliveryDatetime),
    equipmentType: row.equipmentType,
    loadboardRate: toNumber(row.loadboardRate) ?? 0,
    targetRate: toNumber(row.targetRate) ?? 0,
    maxAutoRate: toNumber(row.maxAutoRate) ?? 0,
    active: row.active,
    miles: row.miles,
  };
}

function negotiationRecord(row: typeof negotiations.$inferSelect): NegotiationRecord {
  return {
    id: row.id,
    sessionId: row.sessionId,
    loadId: row.loadId,
    mcNumber: row.mcNumber,
    roundCount: row.roundCount,
    status: row.status,
    agreedRate: toNumber(row.agreedRate),
    lastOfferRate: toNumber(row.lastOfferRate),
    lastCounterRate: toNumber(row.lastCounterRate),
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
  };
}

export function createReportService(db: Db): ReportService {
  return {
    async getSummary(): Promise<ReportSummary> {
      const [callRows, carrierRows, negotiationRows] = await Promise.all([
        db.select().from(calls),
        db.select().from(carriers),
        db.select().from(negotiations),
      ]);
      const agreedRates = callRows.map((call) => toNumber(call.agreedRate)).filter((rate): rate is number => rate != null);

      return {
        totalCalls: callRows.length,
        byOutcome: countBy(callRows, (call) => call.outcome),
        bySentiment: countBy(callRows, (call) => call.sentiment),
        averageAgreedRate: average(agreedRates),
        negotiations: {
          total: negotiationRows.length,
          accepted: countWhere(negotiationRows, (row) => row.status === "accepted"),
          rejected: countWhere(negotiationRows, (row) => row.status === "rejected"),
          countered: countWhere(negotiationRows, (row) => row.status === "countered"),
        },
        carrierVerification: {
          liveFmcsa: countWhere(carrierRows, (row) => row.verificationSource === "fmcsa"),
          fallbackSeeded: countWhere(carrierRows, (row) => row.verificationSource === "seed"),
        },
      };
    },
    async listCalls(): Promise<CallRecord[]> {
      const rows = await db.select().from(calls).orderBy(desc(calls.createdAt));
      return rows.map(callRecord);
    },
    async listLoads(): Promise<LoadRecord[]> {
      const rows = await db.select().from(loads).orderBy(desc(loads.pickupDatetime));
      return rows.map(loadRecord);
    },
    async listNegotiations(): Promise<NegotiationRecord[]> {
      const rows = await db.select().from(negotiations).orderBy(desc(negotiations.createdAt));
      return rows.map(negotiationRecord);
    },
  };
}
