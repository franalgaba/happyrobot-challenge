import type { Db } from "../db/client";
import type { RuntimeConfig } from "../env/config";
import { createCallService } from "./calls";
import { createCarrierService } from "./carriers";
import { createVoiceService } from "./happyrobot";
import { createLoadService } from "./loads";
import { createNegotiationService } from "./negotiations";
import { createReportService } from "./reports";
import type { AppServices } from "./types";

export function createServices(db: Db, config: RuntimeConfig): AppServices {
  return {
    carriers: createCarrierService(db, config),
    loads: createLoadService(db),
    negotiations: createNegotiationService(db),
    calls: createCallService(db),
    reports: createReportService(db),
    voice: createVoiceService(config),
  };
}

export type { AppServices } from "./types";
