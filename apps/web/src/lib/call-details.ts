import type { CallRecord, LoadRecord, NegotiationRecord } from "@happyrobot-challenge/shared";

export function findLoadForCall(loads: LoadRecord[], loadId: string | null): LoadRecord | undefined {
  if (loadId == null) return undefined;
  return loads.find((load) => load.loadId === loadId);
}

export function formatLane(load: LoadRecord | undefined): string | null {
  if (load == null) return null;
  return `${load.origin} → ${load.destination}`;
}

export function findNegotiationForCall(
  negotiations: NegotiationRecord[],
  call: CallRecord,
): NegotiationRecord | undefined {
  if (call.negotiationId) {
    const byId = negotiations.find((row) => row.id === call.negotiationId);
    if (byId) return byId;
  }

  if (call.happyrobotSessionId) {
    return negotiations.find((row) => row.sessionId === call.happyrobotSessionId);
  }

  if (call.loadId && call.mcNumber) {
    return negotiations.find(
      (row) => row.loadId === call.loadId && row.mcNumber === call.mcNumber,
    );
  }

  return undefined;
}
