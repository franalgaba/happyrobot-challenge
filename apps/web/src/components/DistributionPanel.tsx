import { DistributionList } from "./DistributionList";

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
  const base = "panel panel--contain";
  return className ? `${base} ${className}` : base;
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
        <DistributionList
          entries={entries}
          total={total}
          colors={colors}
          labels={labels}
          emptyMessage="No activity yet—complete a carrier call to populate this chart."
        />
      </div>
    </article>
  );
}
