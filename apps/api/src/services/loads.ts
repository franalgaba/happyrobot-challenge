import { desc, eq } from "drizzle-orm";
import type { Load, SearchLoadResult, SearchLoadsRequest } from "@happyrobot-challenge/shared";
import type { Db } from "../db/client";
import { loads } from "../db/schema";
import { iso, toNumber } from "../utils/http";
import type { LoadService } from "./types";

const DEFAULT_LOAD_SEARCH_LIMIT = 3;
const BASE_MATCH_SCORE = 50;
const TEXT_MATCH_SCORE = 25;
const TEXT_MISMATCH_PENALTY = -20;
const SAME_DAY_PICKUP_SCORE = 20;
const THREE_DAY_PICKUP_SCORE = 8;
const PICKUP_MISMATCH_PENALTY = -10;
const HOURS_PER_DAY = 24;
const HOURS_PER_THREE_DAYS = 72;
const MILLISECONDS_PER_HOUR = 3_600_000;

function asLoad(row: typeof loads.$inferSelect): Load {
  return {
    loadId: row.loadId,
    origin: row.origin,
    destination: row.destination,
    pickupDatetime: iso(row.pickupDatetime),
    deliveryDatetime: iso(row.deliveryDatetime),
    equipmentType: row.equipmentType,
    loadboardRate: toNumber(row.loadboardRate) ?? 0,
    notes: row.notes,
    weight: row.weight,
    commodityType: row.commodityType,
    numOfPieces: row.numOfPieces,
    miles: row.miles,
    dimensions: row.dimensions ?? null,
    targetRate: toNumber(row.targetRate) ?? 0,
    maxAutoRate: toNumber(row.maxAutoRate) ?? 0,
    active: row.active,
  };
}

function textMatch(haystack: string, needle?: string) {
  if (!needle) {
    return 0;
  }
  return haystack.toLowerCase().includes(needle.toLowerCase()) ? TEXT_MATCH_SCORE : TEXT_MISMATCH_PENALTY;
}

function dateScore(pickup: Date, requested?: string) {
  if (!requested) {
    return 0;
  }
  const requestedDate = new Date(requested);
  if (Number.isNaN(requestedDate.getTime())) {
    return 0;
  }
  const hours = Math.abs(pickup.getTime() - requestedDate.getTime()) / MILLISECONDS_PER_HOUR;
  if (hours <= HOURS_PER_DAY) return SAME_DAY_PICKUP_SCORE;
  if (hours <= HOURS_PER_THREE_DAYS) return THREE_DAY_PICKUP_SCORE;
  return PICKUP_MISMATCH_PENALTY;
}

function pitch(load: Load) {
  const rate = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(
    load.loadboardRate,
  );
  return [
    `Load ${load.loadId}: ${load.origin} to ${load.destination}.`,
    `Pickup ${load.pickupDatetime}, delivery ${load.deliveryDatetime}.`,
    `${load.equipmentType}, ${load.miles ?? "unknown"} miles, ${load.weight ?? "unknown"} lbs.`,
    `${load.commodityType ?? "Commodity not specified"}, listed at ${rate}.`,
    load.notes ? `Notes: ${load.notes}` : null,
  ]
    .filter(Boolean)
    .join(" ");
}

function scoreLoad(load: Load, pickupDatetime: Date, input: SearchLoadsRequest) {
  return (
    BASE_MATCH_SCORE +
    textMatch(load.origin, input.origin) +
    textMatch(load.destination, input.destination) +
    textMatch(load.equipmentType, input.equipmentType) +
    dateScore(pickupDatetime, input.pickupDate)
  );
}

export function createLoadService(db: Db): LoadService {
  return {
    async searchLoads(input: SearchLoadsRequest) {
      const limit = input.limit ?? DEFAULT_LOAD_SEARCH_LIMIT;
      const rows = await db.select().from(loads).where(eq(loads.active, true)).orderBy(desc(loads.pickupDatetime));
      const matches: SearchLoadResult[] = rows
        .map((row) => {
          const load = asLoad(row);
          const score = scoreLoad(load, row.pickupDatetime, input);
          return { ...load, score, pitch: pitch(load) };
        })
        .filter((match) => match.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      return { matches, total: matches.length };
    },
  };
}
