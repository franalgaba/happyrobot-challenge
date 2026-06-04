import { sharePercent } from "../lib/format";
import { INTEGER_FORMAT } from "../lib/number-flow";
import { AnimatedNumber } from "./AnimatedNumber";

type DistributionPanelProps = {
  title: string;
  subtitle: string;
  entries: [string, number][];
  total: number;
  colors: Record<string, string>;
  labels: Record<string, string>;
  className?: string;
};

function panelClassName(className?: string): string {
  return className ? `panel ${className}` : "panel";
}

export function DistributionPanel({
  title,
  subtitle,
  entries,
  total,
  colors,
  labels,
  className,
}: DistributionPanelProps) {
  return (
    <article className={panelClassName(className)}>
      <header className="panel-head">
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </header>
      <div className="panel-body">
        {entries.length === 0 ? (
          <p className="kpi-hint">No data yet—run a demo call to populate metrics.</p>
        ) : (
          <ul className="dist-list">
            {entries.map(([key, count]) => (
              <DistributionRow
                key={key}
                count={count}
                label={labels[key] ?? key}
                swatchColor={colors[key] ?? "var(--hr-fg)"}
                total={total}
              />
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}

type DistributionRowProps = {
  count: number;
  label: string;
  swatchColor: string;
  total: number;
};

function DistributionRow({ count, label, swatchColor, total }: DistributionRowProps) {
  const barWidthPercent = total > 0 ? (count / total) * 100 : 0;
  const displayPercent = sharePercent(count, total);

  return (
    <li className="dist-row">
      <div className="dist-meta">
        <span className="dist-label">
          <span className="dist-swatch" style={{ background: swatchColor }} aria-hidden />
          {label}
        </span>
        <span className="mono dist-meta-counts">
          <AnimatedNumber value={count} format={INTEGER_FORMAT} />
          <span aria-hidden> · </span>
          <AnimatedNumber value={displayPercent} suffix="%" format={INTEGER_FORMAT} />
        </span>
      </div>
      <div className="dist-track" aria-hidden>
        <div className="dist-fill" style={{ width: `${barWidthPercent}%` }} />
      </div>
    </li>
  );
}
