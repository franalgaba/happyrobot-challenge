import type { ReportSummary } from "@happyrobot-challenge/shared";
import { formatBookRate, formatMoney, getBookedCount } from "../lib/format";
import { KpiStat } from "./KpiStat";

type KpiBandProps = {
  summary: ReportSummary;
};

export function KpiBand({ summary }: KpiBandProps) {
  const booked = getBookedCount(summary);
  const bookRate = formatBookRate(summary);
  const { negotiations } = summary;

  return (
    <div className="kpi-band hr-enter">
      <div className="kpi-feature" aria-label={`${summary.totalCalls} total finalized calls`}>
        <p className="kpi-label">Total calls</p>
        <p className="kpi-value kpi-value--hero">{summary.totalCalls}</p>
        <p className="kpi-hint">Finalized conversations</p>
      </div>
      <div className="kpi-stats">
        <KpiStat label="Booked" value={String(booked)} hint={`${bookRate} of calls`} />
        <KpiStat
          label="Avg. agreed rate"
          value={formatMoney(summary.averageAgreedRate)}
          hint="When a rate was captured"
        />
        <KpiStat
          label="Negotiations"
          value={String(negotiations.total)}
          hint={`${negotiations.accepted} accepted · ${negotiations.countered} countered`}
        />
      </div>
    </div>
  );
}
