import type { ReportSummary } from "@happyrobot-challenge/shared";
import { DashboardDiagnostics } from "./DashboardDiagnostics";
import { DashboardPulse } from "./DashboardPulse";

type DashboardOverviewProps = {
  summary: ReportSummary;
};

export function DashboardOverview({ summary }: DashboardOverviewProps) {
  return (
    <section className="dashboard-overview" aria-label="Operations overview">
      <DashboardPulse summary={summary} />
      <DashboardDiagnostics summary={summary} />
    </section>
  );
}
