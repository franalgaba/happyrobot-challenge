import { EMPTY_VALUE } from "../lib/format";
import { MONEY_FORMAT } from "../lib/number-flow";
import { AnimatedNumber } from "./AnimatedNumber";

type AnimatedMoneyProps = {
  value: number | null | undefined;
  className?: string;
};

export function AnimatedMoney({ value, className = "mono" }: AnimatedMoneyProps) {
  if (value == null) {
    return <span className={className}>{EMPTY_VALUE}</span>;
  }

  return <AnimatedNumber className={className} value={value} format={MONEY_FORMAT} />;
}
