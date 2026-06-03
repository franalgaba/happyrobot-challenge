import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  jsonb,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import type { DimensionsSchema } from "@happyrobot-challenge/shared";
import type { z } from "zod";

export type LoadDimensions = z.infer<typeof DimensionsSchema>;

export const loads = pgTable("loads", {
  loadId: text("load_id").primaryKey(),
  origin: text("origin").notNull(),
  destination: text("destination").notNull(),
  pickupDatetime: timestamp("pickup_datetime", { withTimezone: true }).notNull(),
  deliveryDatetime: timestamp("delivery_datetime", { withTimezone: true }).notNull(),
  equipmentType: text("equipment_type").notNull(),
  loadboardRate: numeric("loadboard_rate", { precision: 12, scale: 2 }).notNull(),
  notes: text("notes"),
  weight: integer("weight"),
  commodityType: text("commodity_type"),
  numOfPieces: integer("num_of_pieces"),
  miles: integer("miles"),
  dimensions: jsonb("dimensions").$type<LoadDimensions | null>(),
  targetRate: numeric("target_rate", { precision: 12, scale: 2 }).notNull(),
  maxAutoRate: numeric("max_auto_rate", { precision: 12, scale: 2 }).notNull(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const carriers = pgTable("carriers", {
  id: serial("id").primaryKey(),
  mcNumber: text("mc_number").notNull().unique(),
  dotNumber: text("dot_number"),
  legalName: text("legal_name"),
  allowedToOperate: boolean("allowed_to_operate"),
  outOfService: boolean("out_of_service"),
  eligible: boolean("eligible").notNull().default(false),
  verificationSource: text("verification_source").notNull(),
  simulated: boolean("simulated").notNull().default(false),
  raw: jsonb("raw").$type<Record<string, unknown> | null>(),
  verifiedAt: timestamp("verified_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type NegotiationOffer = {
  round: number;
  carrierOfferRate: number;
  decision: "counter" | "reject" | "transfer_mock";
  counterRate: number | null;
  agreedRate: number | null;
  at: string;
};

export const negotiations = pgTable("negotiations", {
  id: text("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  loadId: text("load_id")
    .notNull()
    .references(() => loads.loadId),
  mcNumber: text("mc_number").notNull(),
  carrierId: integer("carrier_id").references(() => carriers.id),
  roundCount: integer("round_count").notNull().default(0),
  status: text("status").notNull().default("open"),
  agreedRate: numeric("agreed_rate", { precision: 12, scale: 2 }),
  lastOfferRate: numeric("last_offer_rate", { precision: 12, scale: 2 }),
  lastCounterRate: numeric("last_counter_rate", { precision: 12, scale: 2 }),
  offers: jsonb("offers").$type<NegotiationOffer[]>().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const calls = pgTable("calls", {
  id: text("id").primaryKey(),
  happyrobotRunId: text("happyrobot_run_id"),
  happyrobotSessionId: text("happyrobot_session_id"),
  negotiationId: text("negotiation_id").references(() => negotiations.id),
  loadId: text("load_id").references(() => loads.loadId),
  mcNumber: text("mc_number"),
  carrierId: integer("carrier_id").references(() => carriers.id),
  outcome: text("outcome").notNull(),
  sentiment: text("sentiment").notNull(),
  agreedRate: numeric("agreed_rate", { precision: 12, scale: 2 }),
  extractedData: jsonb("extracted_data").$type<Record<string, unknown>>().notNull().default({}),
  transcript: text("transcript"),
  summary: text("summary"),
  transferMock: boolean("transfer_mock").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const loadRelations = relations(loads, ({ many }) => ({
  negotiations: many(negotiations),
  calls: many(calls),
}));

export const carrierRelations = relations(carriers, ({ many }) => ({
  negotiations: many(negotiations),
  calls: many(calls),
}));

export const negotiationRelations = relations(negotiations, ({ one, many }) => ({
  load: one(loads, {
    fields: [negotiations.loadId],
    references: [loads.loadId],
  }),
  carrier: one(carriers, {
    fields: [negotiations.carrierId],
    references: [carriers.id],
  }),
  calls: many(calls),
}));

export const callRelations = relations(calls, ({ one }) => ({
  negotiation: one(negotiations, {
    fields: [calls.negotiationId],
    references: [negotiations.id],
  }),
  load: one(loads, {
    fields: [calls.loadId],
    references: [loads.loadId],
  }),
  carrier: one(carriers, {
    fields: [calls.carrierId],
    references: [carriers.id],
  }),
}));
