import type { CallRecord, LoadRecord, NegotiationRecord } from "@happyrobot-challenge/shared";
import { DashboardTrendCharts } from "./DashboardTrendCharts";
import { OperationsMap } from "./OperationsMap";

type DashboardIntelligenceProps = {
  loads: LoadRecord[];
  calls: CallRecord[];
  negotiations: NegotiationRecord[];
};

export function DashboardIntelligence({ loads, calls, negotiations }: DashboardIntelligenceProps) {
  return (
    <section className="dashboard-intelligence" aria-label="Network and trend intelligence">
      <div className="intelligence-grid">
        <OperationsMap loads={loads} calls={calls} />
        <DashboardTrendCharts calls={calls} negotiations={negotiations} />
      </div>
    </section>
  );
}
