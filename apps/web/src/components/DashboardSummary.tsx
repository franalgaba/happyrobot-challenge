import { NumberFlowGroup } from "@number-flow/react";
import {
  OUTCOME_COLORS,
  OUTCOME_LABELS,
  SENTIMENT_COLORS,
  SENTIMENT_LABELS,
} from "../config/display-maps";
import { sortCountEntries } from "../lib/format";
import { INTEGER_FORMAT } from "../lib/number-flow";
import type { ReportSummary } from "@happyrobot-challenge/shared";
import { AnimatedNumber } from "./AnimatedNumber";
import { DistributionPanel } from "./DistributionPanel";
import { KpiBand } from "./KpiBand";

type DashboardSummaryProps = {
  summary: ReportSummary;
};

type OperationsDetailPanelProps = {
  summary: ReportSummary;
};

function OperationsDetailPanel({ summary }: OperationsDetailPanelProps) {
  const { negotiations, carrierVerification } = summary;

  return (
    <article className="panel panel--contain panel--operations hr-enter">
      <header className="panel-head">
        <h2>Operations detail</h2>
        <p>Carrier verification sources and negotiation outcomes</p>
      </header>
      <div className="panel-body panel-body--split">
        <div className="metric-group">
          <h3 className="metric-group-title">Carrier verification</h3>
          <p className="metric-group-sub">FMCSA vs seeded fallback during demos</p>
          <ul className="dist-list">
            <li className="dist-row">
              <div className="dist-meta">
                <span className="dist-label">Live FMCSA checks</span>
                <AnimatedNumber
                  className="mono"
                  value={carrierVerification.liveFmcsa}
                  format={INTEGER_FORMAT}
                />
              </div>
            </li>
            <li className="dist-row">
              <div className="dist-meta">
                <span className="dist-label">Seeded fallback carriers</span>
                <AnimatedNumber
                  className="mono"
                  value={carrierVerification.fallbackSeeded}
                  format={INTEGER_FORMAT}
                />
              </div>
            </li>
          </ul>
        </div>
        <div className="metric-group">
          <h3 className="metric-group-title">Negotiation policy</h3>
          <p className="metric-group-sub">Up to three rounds per load with target and max auto rates</p>
          <ul className="dist-list">
            <li className="dist-row">
              <div className="dist-meta">
                <span className="dist-label">Accepted</span>
                <AnimatedNumber className="mono" value={negotiations.accepted} format={INTEGER_FORMAT} />
              </div>
            </li>
            <li className="dist-row">
              <div className="dist-meta">
                <span className="dist-label">Countered</span>
                <AnimatedNumber className="mono" value={negotiations.countered} format={INTEGER_FORMAT} />
              </div>
            </li>
            <li className="dist-row">
              <div className="dist-meta">
                <span className="dist-label">Rejected</span>
                <AnimatedNumber className="mono" value={negotiations.rejected} format={INTEGER_FORMAT} />
              </div>
            </li>
          </ul>
        </div>
      </div>
    </article>
  );
}

export function DashboardSummary({ summary }: DashboardSummaryProps) {
  return (
    <section className="dashboard-summary" aria-label="Summary metrics">
      <NumberFlowGroup>
        <KpiBand summary={summary} />

        <div className="panel-grid panel-grid--distributions hr-enter">
          <DistributionPanel
            title="Call outcomes"
            subtitle="How conversations ended after the agent workflow"
            entries={sortCountEntries(summary.byOutcome)}
            total={summary.totalCalls}
            colors={OUTCOME_COLORS}
            labels={OUTCOME_LABELS}
            className="panel--wide panel--contain"
          />
          <DistributionPanel
            title="Carrier sentiment"
            subtitle="Classified tone from finalized calls"
            entries={sortCountEntries(summary.bySentiment)}
            total={summary.totalCalls}
            colors={SENTIMENT_COLORS}
            labels={SENTIMENT_LABELS}
            className="panel--contain"
          />
        </div>

        <OperationsDetailPanel summary={summary} />
      </NumberFlowGroup>
    </section>
  );
}
