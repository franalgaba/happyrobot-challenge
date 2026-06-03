import {
  OUTCOME_COLORS,
  OUTCOME_LABELS,
  SENTIMENT_COLORS,
  SENTIMENT_LABELS,
} from "../config/display-maps";
import { sortCountEntries } from "../lib/format";
import type { ReportSummary } from "@happyrobot-challenge/shared";
import { DistributionPanel } from "./DistributionPanel";
import { KpiBand } from "./KpiBand";

type DashboardSummaryProps = {
  summary: ReportSummary;
};

type StatRow = {
  label: string;
  value: number;
};

function MetricListPanel({ title, subtitle, rows }: { title: string; subtitle: string; rows: StatRow[] }) {
  return (
    <article className="panel">
      <header className="panel-head">
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </header>
      <div className="panel-body">
        <ul className="dist-list">
          {rows.map((row) => (
            <li key={row.label} className="dist-row">
              <div className="dist-meta">
                <span className="dist-label">{row.label}</span>
                <span className="mono">{row.value}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}

export function DashboardSummary({ summary }: DashboardSummaryProps) {
  const { negotiations, carrierVerification } = summary;

  return (
    <>
      <KpiBand summary={summary} />

      <div className="panel-grid panel-grid--distributions hr-enter">
        <DistributionPanel
          title="Call outcomes"
          subtitle="How conversations ended after the agent workflow"
          entries={sortCountEntries(summary.byOutcome)}
          total={summary.totalCalls}
          colors={OUTCOME_COLORS}
          labels={OUTCOME_LABELS}
          className="panel--wide"
        />
        <DistributionPanel
          title="Carrier sentiment"
          subtitle="Classified tone from finalized calls"
          entries={sortCountEntries(summary.bySentiment)}
          total={summary.totalCalls}
          colors={SENTIMENT_COLORS}
          labels={SENTIMENT_LABELS}
        />
      </div>

      <div className="panel-grid hr-enter">
        <MetricListPanel
          title="Carrier verification"
          subtitle="FMCSA vs seeded fallback during demos"
          rows={[
            { label: "Live FMCSA checks", value: carrierVerification.liveFmcsa },
            { label: "Seeded fallback carriers", value: carrierVerification.fallbackSeeded },
          ]}
        />
        <MetricListPanel
          title="Negotiation policy"
          subtitle="Up to three rounds per load with target and max auto rates"
          rows={[
            { label: "Accepted", value: negotiations.accepted },
            { label: "Countered", value: negotiations.countered },
            { label: "Rejected", value: negotiations.rejected },
          ]}
        />
      </div>
    </>
  );
}
