import NumberFlow, { type NumberFlowProps } from "@number-flow/react";
import { NUMBER_FLOW_TIMINGS } from "../lib/number-flow";

type AnimatedNumberProps = {
  value: number;
  className?: string;
  format?: NumberFlowProps["format"];
  prefix?: string;
  suffix?: string;
};

export function AnimatedNumber({
  value,
  className,
  format,
  prefix,
  suffix,
}: AnimatedNumberProps) {
  return (
    <NumberFlow
      className={className}
      value={value}
      locales="en-US"
      format={format}
      prefix={prefix}
      suffix={suffix}
      {...NUMBER_FLOW_TIMINGS}
    />
  );
}
