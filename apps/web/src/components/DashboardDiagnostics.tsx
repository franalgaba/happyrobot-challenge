import { NumberFlowGroup } from "@number-flow/react";
import type { ReportSummary } from "@happyrobot-challenge/shared";
import {
  SENTIMENT_COLORS,
  SENTIMENT_LABELS,
} from "../config/display-maps";
import { sortCountEntries } from "../lib/format";
import { getNegotiationCloseRate } from "../lib/dashboard-metrics";
import { INTEGER_FORMAT } from "../lib/number-flow";
import { DistributionList } from "./DistributionList";
import { AnimatedNumber } from "./AnimatedNumber";

type DashboardDiagnosticsProps = {
  summary: ReportSummary;
};

export function DashboardDiagnostics({ summary }: DashboardDiagnosticsProps) {
  const { negotiations, carrierVerification } = summary;
  const closeRate = getNegotiationCloseRate(summary);
  const verificationTotal = carrierVerification.liveFmcsa + carrierVerification.fallbackSeeded;

  return (
    <details className="dashboard-diagnostics hr-enter">
      <summary className="dashboard-diagnostics-summary">
        <span className="dashboard-diagnostics-title">Policy, sentiment, and verification</span>
        <span className="dashboard-diagnostics-hint">Expand for coaching and demo detail</span>
      </summary>
      <NumberFlowGroup>
        <div className="diagnostics-body">
          <section className="diagnostics-column" aria-labelledby="diagnostics-sentiment">
            <h3 id="diagnostics-sentiment" className="diagnostics-column-title">
              Carrier sentiment
            </h3>
            <p className="diagnostics-column-desc">Classified tone from finalized calls</p>
            <DistributionList
              entries={sortCountEntries(summary.bySentiment)}
              total={summary.totalCalls}
              colors={SENTIMENT_COLORS}
              labels={SENTIMENT_LABELS}
              emptyMessage="No sentiment data yet."
            />
          </section>
          <section className="diagnostics-column" aria-labelledby="diagnostics-negotiation">
            <h3 id="diagnostics-negotiation" className="diagnostics-column-title">
              Negotiation policy
            </h3>
            <p className="diagnostics-column-desc">Auto-approve band and round limits</p>
            <dl className="stat-rows">
              <div className="stat-row">
                <dt className="stat-row-label">Accepted</dt>
                <dd className="stat-row-value mono">
                  <AnimatedNumber value={negotiations.accepted} format={INTEGER_FORMAT} />
                </dd>
              </div>
              <div className="stat-row">
                <dt className="stat-row-label">Countered</dt>
                <dd className="stat-row-value mono">
                  <AnimatedNumber value={negotiations.countered} format={INTEGER_FORMAT} />
                </dd>
              </div>
              <div className="stat-row">
                <dt className="stat-row-label">Rejected</dt>
                <dd className="stat-row-value mono">
                  <AnimatedNumber value={negotiations.rejected} format={INTEGER_FORMAT} />
                </dd>
              </div>
            </dl>
            <p className="diagnostics-footnote kpi-hint">
              {negotiations.total === 0 ? (
                "No rate discussions yet."
              ) : (
                <>
                  <AnimatedNumber
                    className="pulse-meta"
                    value={closeRate}
                    suffix="%"
                    format={INTEGER_FORMAT}
                  />{" "}
                  of negotiations accepted within policy.
                </>
              )}
            </p>
          </section>
          <section className="diagnostics-column" aria-labelledby="diagnostics-verification">
            <h3 id="diagnostics-verification" className="diagnostics-column-title">
              Carrier verification
            </h3>
            <p className="diagnostics-column-desc">FMCSA live checks vs demo seed data</p>
            <dl className="stat-rows">
              <div className="stat-row">
                <dt className="stat-row-label">Live FMCSA</dt>
                <dd className="stat-row-value mono">
                  <AnimatedNumber
                    value={carrierVerification.liveFmcsa}
                    format={INTEGER_FORMAT}
                  />
                </dd>
              </div>
              <div className="stat-row">
                <dt className="stat-row-label">Demo seed</dt>
                <dd className="stat-row-value mono">
                  <AnimatedNumber
                    value={carrierVerification.fallbackSeeded}
                    format={INTEGER_FORMAT}
                  />
                </dd>
              </div>
            </dl>
            <p className="diagnostics-footnote kpi-hint">
              {verificationTotal === 0
                ? "Demo with live FMCSA MC 585242 (Corbin & Whetstone Trucking LLC)."
                : "Use live FMCSA in production; demo MC 585242 verifies against FMCSA directly."}
            </p>
          </section>
        </div>
      </NumberFlowGroup>
    </details>
  );
}
