type KpiStatProps = {
  label: string;
  value: string;
  hint?: string;
};

export function KpiStat({ label, value, hint }: KpiStatProps) {
  return (
    <article className="kpi-stat">
      <p className="kpi-label">{label}</p>
      <p className="kpi-value">{value}</p>
      {hint ? <p className="kpi-hint">{hint}</p> : null}
    </article>
  );
}
