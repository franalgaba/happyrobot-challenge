import type { NumberFlowProps } from "@number-flow/react";

export const INTEGER_FORMAT = {
  maximumFractionDigits: 0,
} satisfies NumberFlowProps["format"];

export const MONEY_FORMAT = {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
} satisfies NumberFlowProps["format"];

export const NUMBER_FLOW_TIMINGS = {
  transformTiming: { duration: 650, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
  spinTiming: { duration: 650, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
  opacityTiming: { duration: 320, easing: "ease-out" },
} satisfies Pick<NumberFlowProps, "transformTiming" | "spinTiming" | "opacityTiming">;
