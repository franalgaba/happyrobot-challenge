/** [longitude, latitude] for react-simple-maps. */
export type GeoCoordinate = [number, number];

const US_CITY_COORDINATES: Record<string, GeoCoordinate> = {
  "atlanta, ga": [-84.388, 33.749],
  "chicago, il": [-87.63, 41.878],
  "dallas, tx": [-96.797, 32.777],
  "denver, co": [-104.99, 39.739],
  "los angeles, ca": [-118.244, 34.052],
  "phoenix, az": [-112.074, 33.448],
  "houston, tx": [-95.37, 29.76],
  "memphis, tn": [-90.049, 35.15],
  "miami, fl": [-80.191, 25.762],
  "nashville, tn": [-86.781, 36.163],
  "new york, ny": [-74.006, 40.713],
  "portland, or": [-122.676, 45.523],
  "salt lake city, ut": [-111.891, 40.761],
  "seattle, wa": [-122.332, 47.606],
};

function normalizeCityKey(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function resolveCityCoordinate(cityLabel: string): GeoCoordinate | null {
  return US_CITY_COORDINATES[normalizeCityKey(cityLabel)] ?? null;
}

export type LaneRoute = {
  id: string;
  origin: string;
  destination: string;
  from: GeoCoordinate;
  to: GeoCoordinate;
  kind: "active_load" | "booked_call";
  label: string;
  equipmentType?: string;
  miles?: number | null;
};

export function buildLaneRoutes(input: {
  loads: Array<{
    loadId: string;
    origin: string;
    destination: string;
    active: boolean;
    equipmentType: string;
    miles: number | null;
  }>;
  bookedLoadIds: Set<string>;
}): LaneRoute[] {
  const routes: LaneRoute[] = [];

  for (const load of input.loads) {
    const from = resolveCityCoordinate(load.origin);
    const to = resolveCityCoordinate(load.destination);
    if (!from || !to) continue;

    const isBooked = input.bookedLoadIds.has(load.loadId);

    routes.push({
      id: load.loadId,
      origin: load.origin,
      destination: load.destination,
      from,
      to,
      kind: isBooked ? "booked_call" : load.active ? "active_load" : "active_load",
      label: load.loadId,
      equipmentType: load.equipmentType,
      miles: load.miles,
    });
  }

  return routes;
}

export function collectRouteHubs(routes: LaneRoute[]): Array<{ id: string; label: string; coordinates: GeoCoordinate }> {
  const hubs = new Map<string, { id: string; label: string; coordinates: GeoCoordinate }>();

  for (const route of routes) {
    const originKey = normalizeCityKey(route.origin);
    const destinationKey = normalizeCityKey(route.destination);

    if (!hubs.has(originKey)) {
      hubs.set(originKey, { id: originKey, label: route.origin, coordinates: route.from });
    }
    if (!hubs.has(destinationKey)) {
      hubs.set(destinationKey, { id: destinationKey, label: route.destination, coordinates: route.to });
    }
  }

  return [...hubs.values()];
}
