import type { ReactNode } from "react";
import type { ReportSummary } from "@happyrobot-challenge/shared";
import { EMPTY_VALUE, getBookedCount, sharePercent } from "../lib/format";
import { INTEGER_FORMAT, MONEY_FORMAT } from "../lib/number-flow";
import { AnimatedNumber } from "./AnimatedNumber";
import { KpiStat } from "./KpiStat";

type KpiBandProps = {
  summary: ReportSummary;
};

function BookedHint({ booked, totalCalls }: { booked: number; totalCalls: number }): ReactNode {
  if (totalCalls === 0) {
    return `${EMPTY_VALUE} of calls`;
  }

  const bookPercent = sharePercent(booked, totalCalls);
  return (
    <>
      <AnimatedNumber
        className="kpi-hint-flow"
        value={bookPercent}
        suffix="%"
        format={INTEGER_FORMAT}
      />{" "}
      of calls
    </>
  );
}

function NegotiationsHint({
  accepted,
  countered,
}: {
  accepted: number;
  countered: number;
}): ReactNode {
  return (
    <>
      <AnimatedNumber className="kpi-hint-flow" value={accepted} format={INTEGER_FORMAT} /> accepted ·{" "}
      <AnimatedNumber className="kpi-hint-flow" value={countered} format={INTEGER_FORMAT} /> countered
    </>
  );
}

export function KpiBand({ summary }: KpiBandProps) {
  const booked = getBookedCount(summary);
  const { negotiations } = summary;

  return (
    <div className="kpi-band hr-enter">
      <div className="kpi-feature" aria-label={`${summary.totalCalls} total finalized calls`}>
        <p className="kpi-label">Total calls</p>
        <AnimatedNumber
          className="kpi-value kpi-value--hero"
          value={summary.totalCalls}
          format={INTEGER_FORMAT}
        />
        <p className="kpi-hint">Finalized conversations</p>
      </div>
      <div className="kpi-stats">
        <KpiStat
          label="Booked"
          value={booked}
          hint={<BookedHint booked={booked} totalCalls={summary.totalCalls} />}
        />
        <KpiStat
          label="Avg. agreed rate"
          value={summary.averageAgreedRate}
          format={MONEY_FORMAT}
          hint="When a rate was captured"
        />
        <KpiStat
          label="Negotiations"
          value={negotiations.total}
          hint={
            <NegotiationsHint
              accepted={negotiations.accepted}
              countered={negotiations.countered}
            />
          }
        />
      </div>
    </div>
  );
}
