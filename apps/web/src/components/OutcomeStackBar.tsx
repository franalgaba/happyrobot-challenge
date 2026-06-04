import {
  OUTCOME_COLORS,
  OUTCOME_LABELS,
} from "../config/display-maps";
import { sharePercent, sortCountEntries } from "../lib/format";
import { sortOutcomeStackEntries } from "../lib/dashboard-metrics";
import { INTEGER_FORMAT } from "../lib/number-flow";
import { AnimatedNumber } from "./AnimatedNumber";

type OutcomeStackBarProps = {
  byOutcome: Record<string, number>;
  total: number;
};

export function OutcomeStackBar({ byOutcome, total }: OutcomeStackBarProps) {
  const stackEntries = sortOutcomeStackEntries(byOutcome);
  const legendEntries = sortCountEntries(byOutcome);

  if (total === 0) {
    return (
      <p className="outcome-stack-empty kpi-hint">
        Complete a carrier call to see how conversations ended.
      </p>
    );
  }

  const ariaLabel = legendEntries
    .map(([key, count]) => `${OUTCOME_LABELS[key] ?? key}: ${count}`)
    .join(", ");

  return (
    <div className="outcome-stack-wrap">
      <div className="outcome-stack" role="img" aria-label={`Call outcomes: ${ariaLabel}`}>
        {stackEntries.map(([key, count]) => (
          <div
            key={key}
            className="outcome-stack-segment"
            style={{
              flexGrow: count,
              background: OUTCOME_COLORS[key] ?? "var(--hr-dim)",
            }}
            title={`${OUTCOME_LABELS[key] ?? key}: ${count}`}
          />
        ))}
      </div>
      <ul className="outcome-stack-legend">
        {legendEntries.map(([key, count]) => (
          <li key={key}>
            <span
              className="category-label-swatch"
              style={{ background: OUTCOME_COLORS[key] ?? "var(--hr-dim)" }}
              aria-hidden
            />
            <span className="outcome-stack-legend-label">{OUTCOME_LABELS[key] ?? key}</span>
            <span className="mono outcome-stack-legend-count">
              <AnimatedNumber value={count} format={INTEGER_FORMAT} />
              <span aria-hidden> · </span>
              <AnimatedNumber
                value={sharePercent(count, total)}
                suffix="%"
                format={INTEGER_FORMAT}
              />
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
