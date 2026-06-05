import { useCallback, type KeyboardEvent, type ReactNode } from "react";
import {
  CHART_HEIGHT,
  CHART_WIDTH,
  CHART_PAD,
  activeDayIndex,
  columnGeometry,
  chartInnerSize,
  type ChartDayBucket,
  type TrendChartInteraction,
} from "../lib/trend-chart-layout";

type TrendChartFrameProps<T extends ChartDayBucket> = {
  buckets: T[];
  interaction: TrendChartInteraction;
  ariaLabel: string;
  tooltip: (bucket: T, index: number) => ReactNode | null;
  children: (activeIndex: number | null) => ReactNode;
};

export function TrendChartFrame<T extends ChartDayBucket>({
  buckets,
  interaction,
  ariaLabel,
  tooltip,
  children,
}: TrendChartFrameProps<T>) {
  const { activeDayKey, pinnedDayKey, onDayHover, onDayLeave, onDaySelect } = interaction;
  const activeIndex = activeDayIndex(buckets, activeDayKey);
  const activeBucket = activeIndex != null ? buckets[activeIndex] : null;
  const tooltipContent = activeBucket && activeIndex != null ? tooltip(activeBucket, activeIndex) : null;
  const { height: innerHeight } = chartInnerSize();
  const highlightColumn = activeIndex != null ? columnGeometry(activeIndex, buckets.length) : null;

  const moveDay = useCallback(
    (direction: -1 | 1) => {
      if (buckets.length === 0) return;

      const startIndex = activeIndex ?? (direction > 0 ? -1 : buckets.length);
      const nextIndex = Math.min(Math.max(startIndex + direction, 0), buckets.length - 1);
      onDayHover(buckets[nextIndex].dateKey);
    },
    [activeIndex, buckets, onDayHover],
  );

  function handleChartKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      moveDay(1);
      return;
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      moveDay(-1);
      return;
    }
    if (event.key === "Home") {
      event.preventDefault();
      if (buckets[0]) onDayHover(buckets[0].dateKey);
      return;
    }
    if (event.key === "End") {
      event.preventDefault();
      if (buckets[buckets.length - 1]) onDayHover(buckets[buckets.length - 1].dateKey);
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      if (activeDayKey) {
        event.preventDefault();
        onDaySelect(activeDayKey);
      }
    }
  }

  function handleChartFocus() {
    if (!activeDayKey && buckets.length > 0) {
      onDayHover(buckets[buckets.length - 1].dateKey);
    }
  }

  return (
    <div
      className="trend-chart-wrap"
      data-pinned={pinnedDayKey != null ? "true" : undefined}
      onMouseLeave={onDayLeave}
    >
      {tooltipContent ? (
        <div className="trend-chart-tooltip" role="status" aria-live="polite">
          {tooltipContent}
        </div>
      ) : null}

      <div
        className="trend-chart-focus-target"
        tabIndex={0}
        role="group"
        aria-label={`${ariaLabel}. Arrow keys move between days; Enter or Space pins the selected day.`}
        onKeyDown={handleChartKeyDown}
        onFocus={handleChartFocus}
      >
        <svg
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          className="trend-chart"
          aria-hidden="true"
        >
          {highlightColumn ? (
            <rect
              x={highlightColumn.slotX}
              y={CHART_PAD.top}
              width={highlightColumn.slot}
              height={innerHeight}
              className="trend-chart-highlight"
              pointerEvents="none"
            />
          ) : null}

          {buckets.map((bucket, index) => {
            const { slot, slotX } = columnGeometry(index, buckets.length);
            const isActive = activeIndex === index;

            return (
              <rect
                key={`hit-${bucket.dateKey}`}
                x={slotX}
                y={CHART_PAD.top}
                width={slot}
                height={innerHeight}
                className="trend-chart-hit"
                data-active={isActive ? "true" : undefined}
                onMouseEnter={() => onDayHover(bucket.dateKey)}
                onClick={() => onDaySelect(bucket.dateKey)}
              />
            );
          })}

          {children(activeIndex)}
        </svg>
      </div>
    </div>
  );
}
