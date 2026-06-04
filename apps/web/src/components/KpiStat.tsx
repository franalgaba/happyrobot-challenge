import type { ReactNode } from "react";
import type { NumberFlowProps } from "@number-flow/react";
import { EMPTY_VALUE } from "../lib/format";
import { AnimatedNumber } from "./AnimatedNumber";

type KpiStatProps = {
  label: string;
  value: number | null;
  format?: NumberFlowProps["format"];
  hint?: ReactNode;
};

export function KpiStat({ label, value, format, hint }: KpiStatProps) {
  return (
    <article className="kpi-stat">
      <p className="kpi-label">{label}</p>
      {value == null ? (
        <p className="kpi-value">{EMPTY_VALUE}</p>
      ) : (
        <AnimatedNumber className="kpi-value" value={value} format={format} />
      )}
      {hint ? <p className="kpi-hint">{hint}</p> : null}
    </article>
  );
}
