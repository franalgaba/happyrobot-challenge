import { eq } from "drizzle-orm";
import { createDb } from "./client";
import { carriers, loads } from "./schema";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to seed data");
}

const { db, sql } = createDb(databaseUrl);

const seedLoads = [
  {
    loadId: "HR-ATL-DAL-001",
    origin: "Atlanta, GA",
    destination: "Dallas, TX",
    pickupDatetime: new Date("2026-06-05T14:00:00.000Z"),
    deliveryDatetime: new Date("2026-06-07T18:00:00.000Z"),
    equipmentType: "Dry Van",
    loadboardRate: "2350.00",
    notes: "No-touch freight. Appointment required at delivery.",
    weight: 38000,
    commodityType: "Packaged food",
    numOfPieces: 22,
    miles: 781,
    dimensions: { raw: "53 ft dry van" },
    targetRate: "2250.00",
    maxAutoRate: "2500.00",
    active: true,
  },
  {
    loadId: "HR-CHI-DEN-002",
    origin: "Chicago, IL",
    destination: "Denver, CO",
    pickupDatetime: new Date("2026-06-06T13:00:00.000Z"),
    deliveryDatetime: new Date("2026-06-08T16:00:00.000Z"),
    equipmentType: "Reefer",
    loadboardRate: "3100.00",
    notes: "Maintain 34F. Driver must pulp at pickup and delivery.",
    weight: 42000,
    commodityType: "Produce",
    numOfPieces: 26,
    miles: 1004,
    dimensions: { raw: "53 ft reefer" },
    targetRate: "3000.00",
    maxAutoRate: "3350.00",
    active: true,
  },
  {
    loadId: "HR-LAX-PHX-003",
    origin: "Los Angeles, CA",
    destination: "Phoenix, AZ",
    pickupDatetime: new Date("2026-06-04T17:00:00.000Z"),
    deliveryDatetime: new Date("2026-06-05T14:00:00.000Z"),
    equipmentType: "Flatbed",
    loadboardRate: "1450.00",
    notes: "Straps required. Tarps not required.",
    weight: 27000,
    commodityType: "Building materials",
    numOfPieces: 14,
    miles: 372,
    dimensions: { lengthFt: 48, raw: "48 ft flatbed" },
    targetRate: "1375.00",
    maxAutoRate: "1550.00",
    active: true,
  },
];

const seedCarriers = [
  {
    mcNumber: "123456",
    dotNumber: "7654321",
    legalName: "Evergreen Freight LLC",
    allowedToOperate: true,
    outOfService: false,
    eligible: true,
    verificationSource: "seed",
    simulated: true,
    raw: { fixture: true },
  },
  {
    mcNumber: "654321",
    dotNumber: "1234567",
    legalName: "Suspended Express Inc",
    allowedToOperate: false,
    outOfService: true,
    eligible: false,
    verificationSource: "seed",
    simulated: true,
    raw: { fixture: true },
  },
  {
    mcNumber: "777888",
    dotNumber: "7788990",
    legalName: "Mesa Linehaul Partners",
    allowedToOperate: true,
    outOfService: false,
    eligible: true,
    verificationSource: "seed",
    simulated: true,
    raw: { fixture: true },
  },
];

async function upsertLoad(load: (typeof seedLoads)[number]) {
  await db
    .insert(loads)
    .values(load)
    .onConflictDoUpdate({
      target: loads.loadId,
      set: { ...load, updatedAt: new Date() },
    });
}

async function upsertCarrier(carrier: (typeof seedCarriers)[number]) {
  await db
    .insert(carriers)
    .values(carrier)
    .onConflictDoUpdate({
      target: carriers.mcNumber,
      set: { ...carrier, verifiedAt: new Date(), updatedAt: new Date() },
    });
}

async function countActiveLoads() {
  const activeLoads = await db.select({ loadId: loads.loadId }).from(loads).where(eq(loads.active, true));
  return activeLoads.length;
}

try {
  for (const load of seedLoads) {
    await upsertLoad(load);
  }

  for (const carrier of seedCarriers) {
    await upsertCarrier(carrier);
  }

  console.log(`Seeded ${seedLoads.length} loads and ${seedCarriers.length} carriers. Active loads: ${await countActiveLoads()}`);
} finally {
  await sql.end();
}
