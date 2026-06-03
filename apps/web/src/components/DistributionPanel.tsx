import { formatPercent } from "../lib/format";

type DistributionPanelProps = {
  title: string;
  subtitle: string;
  entries: [string, number][];
  total: number;
  colors: Record<string, string>;
  labels: Record<string, string>;
  className?: string;
};

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
    <article className={["panel", className].filter(Boolean).join(" ")}>
      <header className="panel-head">
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </header>
      <div className="panel-body">
        {entries.length === 0 ? (
          <p className="kpi-hint">No data yet—run a demo call to populate metrics.</p>
        ) : (
          <ul className="dist-list">
            {entries.map(([key, count]) => {
              const widthPercent = total > 0 ? (count / total) * 100 : 0;
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
                    <span className="mono">
                      {count} · {formatPercent(count, total)}
                    </span>
                  </div>
                  <div className="dist-track" aria-hidden>
                    <div className="dist-fill" style={{ width: `${widthPercent}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </article>
  );
}
