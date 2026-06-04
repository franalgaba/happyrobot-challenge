import { sharePercent } from "../lib/format";
import { INTEGER_FORMAT } from "../lib/number-flow";
import { AnimatedNumber } from "./AnimatedNumber";

type DistributionListProps = {
  entries: [string, number][];
  total: number;
  colors: Record<string, string>;
  labels: Record<string, string>;
  emptyMessage?: string;
};

export function DistributionList({
  entries,
  total,
  colors,
  labels,
  emptyMessage = "No activity yet.",
}: DistributionListProps) {
  if (entries.length === 0) {
    return <p className="kpi-hint">{emptyMessage}</p>;
  }

  return (
    <ul className="dist-list">
      {entries.map(([key, count]) => {
        const barScale = total > 0 ? count / total : 0;
        const displayPercent = sharePercent(count, total);

        return (
          <li key={key} className="dist-row">
            <div className="dist-meta">
              <span className="dist-label">
                <span
                  className="dist-swatch"
                  style={{ background: colors[key] ?? "var(--hr-fg)" }}
                  aria-hidden
                />
                {labels[key] ?? key}
              </span>
              <span className="mono dist-meta-counts">
                <AnimatedNumber value={count} format={INTEGER_FORMAT} />
                <span aria-hidden> · </span>
                <AnimatedNumber value={displayPercent} suffix="%" format={INTEGER_FORMAT} />
              </span>
            </div>
            <div className="dist-track" aria-hidden>
              <div className="dist-fill" style={{ transform: `scaleX(${barScale})` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
