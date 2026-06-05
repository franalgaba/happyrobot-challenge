export const CHART_WIDTH = 320;
export const CHART_HEIGHT = 96;
export const CHART_PAD = { top: 10, right: 6, bottom: 24, left: 6 };

export type ChartDayBucket = {
  dateKey: string;
  label: string;
};

export type TrendChartInteraction = {
  activeDayKey: string | null;
  pinnedDayKey: string | null;
  onDayHover: (dateKey: string) => void;
  onDayLeave: () => void;
  onDaySelect: (dateKey: string) => void;
};

export function chartInnerSize() {
  return {
    width: CHART_WIDTH - CHART_PAD.left - CHART_PAD.right,
    height: CHART_HEIGHT - CHART_PAD.top - CHART_PAD.bottom,
  };
}

export function activeDayIndex(buckets: ChartDayBucket[], activeDayKey: string | null): number | null {
  if (!activeDayKey) return null;
  const index = buckets.findIndex((bucket) => bucket.dateKey === activeDayKey);
  return index >= 0 ? index : null;
}

export function columnGeometry(index: number, count: number) {
  const { width: innerWidth, height: innerHeight } = chartInnerSize();
  const slot = innerWidth / count;
  const slotX = CHART_PAD.left + index * slot;
  const centerX = slotX + slot / 2;
  const baseY = CHART_PAD.top + innerHeight;

  return { slot, slotX, centerX, innerHeight, baseY };
}

export function barGeometry(index: number, count: number) {
  const column = columnGeometry(index, count);
  const barWidth = Math.max(4, column.slot * 0.55);
  const x = column.slotX + (column.slot - barWidth) / 2;

  return { ...column, barWidth, x };
}

export function linePoint(index: number, count: number, value: number, max: number) {
  const { centerX, innerHeight, slot, slotX } = columnGeometry(index, count);
  const y = CHART_PAD.top + innerHeight - (value / max) * innerHeight;

  return { x: centerX, y, slotWidth: slot, slotX };
}

export function linePath(values: number[], max: number, count: number): string {
  const { height: innerHeight } = chartInnerSize();

  return values
    .map((value, index) => {
      const { centerX } = columnGeometry(index, count);
      const y = CHART_PAD.top + innerHeight - (value / max) * innerHeight;
      return `${index === 0 ? "M" : "L"}${centerX},${y}`;
    })
    .join(" ");
}

export function axisLabelPositions(labels: string[], count: number) {
  const { width: innerWidth } = chartInnerSize();
  const slot = innerWidth / count;

  return labels
    .map((label, index) => {
      const x = CHART_PAD.left + index * slot + slot / 2;
      const show = index === 0 || index === count - 1 || index === Math.floor(count / 2);
      return show ? { label, x, index } : null;
    })
    .filter((entry): entry is { label: string; x: number; index: number } => entry != null);
}

export function stackedBarRects(
  index: number,
  total: number,
  booked: number,
  max: number,
  count: number,
): { track: string; booked: string | null; other: string | null } {
  const { barWidth, x, baseY, innerHeight } = barGeometry(index, count);

  const totalHeight = max === 0 ? 0 : (total / max) * innerHeight;
  const bookedHeight = max === 0 ? 0 : (booked / max) * innerHeight;
  const otherHeight = totalHeight - bookedHeight;

  const track = `M${x},${baseY} L${x},${baseY - totalHeight} L${x + barWidth},${baseY - totalHeight} L${x + barWidth},${baseY} Z`;

  const bookedPath =
    bookedHeight > 0
      ? `M${x},${baseY} L${x},${baseY - bookedHeight} L${x + barWidth},${baseY - bookedHeight} L${x + barWidth},${baseY} Z`
      : null;

  const otherPath =
    otherHeight > 0
      ? `M${x},${baseY - bookedHeight} L${x},${baseY - totalHeight} L${x + barWidth},${baseY - totalHeight} L${x + barWidth},${baseY - bookedHeight} Z`
      : null;

  return { track, booked: bookedPath, other: otherPath };
}

function maxValue(values: number[], floor = 1): number {
  return Math.max(floor, ...values);
}

export { maxValue };
