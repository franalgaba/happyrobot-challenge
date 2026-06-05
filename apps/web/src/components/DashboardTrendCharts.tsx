import { useMemo, useState, type ReactNode } from "react";
import type { CallRecord, NegotiationRecord } from "@happyrobot-challenge/shared";
import { formatMoney } from "../lib/format";
import {
  axisLabelPositions,
  linePath,
  linePoint,
  maxValue,
  stackedBarRects,
  CHART_HEIGHT,
  type TrendChartInteraction,
} from "../lib/trend-chart-layout";
import {
  buildDailyCallTrend,
  buildDailyNegotiationTrend,
  trendHasActivity,
  type DailyCallBucket,
  type DailyNegotiationBucket,
} from "../lib/trend-series";
import { TrendChartFrame } from "./TrendChartFrame";

type DashboardTrendChartsProps = {
  calls: CallRecord[];
  negotiations: NegotiationRecord[];
};

function ChartAxisLabels({ labels, count }: { labels: string[]; count: number }) {
  return (
    <>
      {axisLabelPositions(labels, count).map(({ label, x, index }) => (
        <text key={`${label}-${index}`} x={x} y={CHART_HEIGHT - 4} textAnchor="middle" className="trend-chart-axis">
          {label}
        </text>
      ))}
    </>
  );
}

function TrendPanel({
  title,
  description,
  emptyMessage,
  hasData,
  children,
}: {
  title: string;
  description: string;
  emptyMessage: string;
  hasData: boolean;
  children: ReactNode;
}) {
  return (
    <article className="trend-panel">
      <header className="trend-panel-head">
        <h3>{title}</h3>
        <p>{description}</p>
      </header>
      {hasData ? children : <p className="trend-panel-empty">{emptyMessage}</p>}
    </article>
  );
}

function CallVolumeChart({
  buckets,
  interaction,
}: {
  buckets: DailyCallBucket[];
  interaction: TrendChartInteraction;
}) {
  const maxCalls = maxValue(buckets.map((bucket) => bucket.totalCalls));
  const labels = buckets.map((bucket) => bucket.label);

  return (
    <TrendChartFrame
      buckets={buckets}
      interaction={interaction}
      ariaLabel="Daily call volume for the last two weeks"
      tooltip={(bucket) => (
        <>
          <strong>{bucket.label}</strong>
          <span>
            {bucket.totalCalls} call{bucket.totalCalls === 1 ? "" : "s"}
            {bucket.totalCalls > 0 ? (
              <>
                {" "}
                · {bucket.bookedCalls} booked · {bucket.totalCalls - bucket.bookedCalls} other
              </>
            ) : null}
          </span>
        </>
      )}
    >
      {(activeIndex) => (
        <>
          {buckets.map((bucket, index) => {
            if (bucket.totalCalls === 0) return null;
            const rects = stackedBarRects(index, bucket.totalCalls, bucket.bookedCalls, maxCalls, buckets.length);
            const isActive = activeIndex === index;

            return (
              <g key={bucket.dateKey} pointerEvents="none">
                <path d={rects.track} className="trend-chart-bar trend-chart-bar--track" />
                {rects.other ? (
                  <path
                    d={rects.other}
                    className="trend-chart-bar trend-chart-bar--other"
                    data-active={isActive ? "true" : undefined}
                  />
                ) : null}
                {rects.booked ? (
                  <path
                    d={rects.booked}
                    className="trend-chart-bar trend-chart-bar--booked"
                    data-active={isActive ? "true" : undefined}
                  />
                ) : null}
              </g>
            );
          })}
          <ChartAxisLabels labels={labels} count={buckets.length} />
        </>
      )}
    </TrendChartFrame>
  );
}

function BookingRateChart({
  buckets,
  interaction,
}: {
  buckets: DailyCallBucket[];
  interaction: TrendChartInteraction;
}) {
  const max = 100;
  const labels = buckets.map((bucket) => bucket.label);
  const values = buckets.map((bucket) => bucket.bookingRate);

  return (
    <TrendChartFrame
      buckets={buckets}
      interaction={interaction}
      ariaLabel="Daily booking rate trend"
      tooltip={(bucket) => (
        <>
          <strong>{bucket.label}</strong>
          <span>
            {bucket.totalCalls === 0
              ? "No calls"
              : `${bucket.bookingRate}% booked (${bucket.bookedCalls}/${bucket.totalCalls})`}
          </span>
        </>
      )}
    >
      {(activeIndex) => (
        <>
          <path d={linePath(values, max, buckets.length)} className="trend-chart-line" fill="none" pointerEvents="none" />
          {buckets.map((bucket, index) => {
            if (bucket.totalCalls === 0) return null;
            const { x, y } = linePoint(index, buckets.length, bucket.bookingRate, max);
            return (
              <circle
                key={bucket.dateKey}
                cx={x}
                cy={y}
                r={activeIndex === index ? 5 : 3}
                className="trend-chart-dot"
                data-active={activeIndex === index ? "true" : undefined}
                pointerEvents="none"
              />
            );
          })}
          <ChartAxisLabels labels={labels} count={buckets.length} />
        </>
      )}
    </TrendChartFrame>
  );
}

function AgreedRateChart({
  buckets,
  interaction,
}: {
  buckets: DailyCallBucket[];
  interaction: TrendChartInteraction;
}) {
  const activeValues = buckets
    .map((bucket) => bucket.avgAgreedRate)
    .filter((value): value is number => value != null);

  if (activeValues.length === 0) {
    return <p className="trend-panel-empty">Booked calls with agreed rates will chart here.</p>;
  }

  const min = Math.min(...activeValues);
  const max = Math.max(...activeValues);
  const range = Math.max(max - min, 1);
  const normalized = buckets.map((bucket) =>
    bucket.avgAgreedRate == null ? null : ((bucket.avgAgreedRate - min) / range) * 100,
  );
  const pathValues = normalized.map((value) => (value == null ? 0 : value));
  const labels = buckets.map((bucket) => bucket.label);

  return (
    <>
      <TrendChartFrame
        buckets={buckets}
        interaction={interaction}
        ariaLabel="Average agreed rate trend"
        tooltip={(bucket) => (
          <>
            <strong>{bucket.label}</strong>
            <span>
              {bucket.avgAgreedRate == null
                ? "No booked rate"
                : `${formatMoney(bucket.avgAgreedRate)} avg · ${bucket.bookedCalls} booking${bucket.bookedCalls === 1 ? "" : "s"}`}
            </span>
          </>
        )}
      >
        {(activeIndex) => (
          <>
            <path
              d={linePath(pathValues, 100, buckets.length)}
              className="trend-chart-line trend-chart-line--rate"
              fill="none"
              pointerEvents="none"
            />
            {buckets.map((bucket, index) => {
              if (bucket.avgAgreedRate == null) return null;
              const { x, y } = linePoint(index, buckets.length, pathValues[index], 100);
              return (
                <circle
                  key={bucket.dateKey}
                  cx={x}
                  cy={y}
                  r={activeIndex === index ? 5 : 3}
                  className="trend-chart-dot trend-chart-dot--rate"
                  data-active={activeIndex === index ? "true" : undefined}
                  pointerEvents="none"
                />
              );
            })}
            <ChartAxisLabels labels={labels} count={buckets.length} />
          </>
        )}
      </TrendChartFrame>
      <p className="trend-panel-footnote">
        Latest booked avg <strong>{formatMoney(activeValues[activeValues.length - 1])}</strong>
        {activeValues.length > 1 ? (
          <>
            {" "}
            · range {formatMoney(min)}–{formatMoney(max)}
          </>
        ) : null}
      </p>
    </>
  );
}

function NegotiationCloseChart({
  buckets,
  interaction,
}: {
  buckets: DailyNegotiationBucket[];
  interaction: TrendChartInteraction;
}) {
  const labels = buckets.map((bucket) => bucket.label);
  const values = buckets.map((bucket) => bucket.closeRate);

  return (
    <TrendChartFrame
      buckets={buckets}
      interaction={interaction}
      ariaLabel="Daily negotiation close rate"
      tooltip={(bucket) => (
        <>
          <strong>{bucket.label}</strong>
          <span>
            {bucket.total === 0
              ? "No negotiations"
              : `${bucket.closeRate}% closed (${bucket.accepted}/${bucket.total} accepted)`}
          </span>
        </>
      )}
    >
      {(activeIndex) => (
        <>
          <path
            d={linePath(values, 100, buckets.length)}
            className="trend-chart-line trend-chart-line--negotiation"
            fill="none"
            pointerEvents="none"
          />
          {buckets.map((bucket, index) => {
            if (bucket.total === 0) return null;
            const { x, y } = linePoint(index, buckets.length, bucket.closeRate, 100);
            return (
              <circle
                key={bucket.dateKey}
                cx={x}
                cy={y}
                r={activeIndex === index ? 5 : 3}
                className="trend-chart-dot trend-chart-dot--negotiation"
                data-active={activeIndex === index ? "true" : undefined}
                pointerEvents="none"
              />
            );
          })}
          <ChartAxisLabels labels={labels} count={buckets.length} />
        </>
      )}
    </TrendChartFrame>
  );
}

function TrendDaySummary({
  dateKey,
  callBucket,
  negotiationBucket,
  onClear,
}: {
  dateKey: string;
  callBucket: DailyCallBucket | undefined;
  negotiationBucket: DailyNegotiationBucket | undefined;
  onClear: () => void;
}) {
  const label = callBucket?.label ?? negotiationBucket?.label ?? dateKey;

  return (
    <div className="trend-day-summary" role="status">
      <div className="trend-day-summary-copy">
        <strong>{label}</strong>
        <span>
          {callBucket && callBucket.totalCalls > 0
            ? `${callBucket.totalCalls} calls · ${callBucket.bookingRate}% booked`
            : "No calls"}
          {negotiationBucket && negotiationBucket.total > 0
            ? ` · ${negotiationBucket.closeRate}% negotiation close`
            : ""}
          {callBucket?.avgAgreedRate != null ? ` · ${formatMoney(callBucket.avgAgreedRate)} avg rate` : ""}
        </span>
      </div>
      <button type="button" className="trend-day-summary-clear" onClick={onClear}>
        Clear
      </button>
    </div>
  );
}

export function DashboardTrendCharts({ calls, negotiations }: DashboardTrendChartsProps) {
  const callTrend = useMemo(() => buildDailyCallTrend(calls), [calls]);
  const negotiationTrend = useMemo(() => buildDailyNegotiationTrend(negotiations), [negotiations]);
  const callsHaveActivity = trendHasActivity(callTrend);
  const negotiationsHaveActivity = trendHasActivity(negotiationTrend);

  const [hoveredDayKey, setHoveredDayKey] = useState<string | null>(null);
  const [pinnedDayKey, setPinnedDayKey] = useState<string | null>(null);
  const activeDayKey = hoveredDayKey ?? pinnedDayKey;

  const interaction: TrendChartInteraction = {
    activeDayKey,
    pinnedDayKey,
    onDayHover: setHoveredDayKey,
    onDayLeave: () => setHoveredDayKey(null),
    onDaySelect: (dateKey) => {
      setPinnedDayKey((current) => (current === dateKey ? null : dateKey));
      setHoveredDayKey(dateKey);
    },
  };

  const pinnedCallBucket = pinnedDayKey ? callTrend.find((bucket) => bucket.dateKey === pinnedDayKey) : undefined;
  const pinnedNegotiationBucket = pinnedDayKey
    ? negotiationTrend.find((bucket) => bucket.dateKey === pinnedDayKey)
    : undefined;

  return (
    <section className="panel panel--contain dashboard-trends hr-enter" aria-label="Historical performance trends">
      <header className="panel-head">
        <h2>14-day trends</h2>
        <p>Hover or click a day to inspect metrics across charts. Click again to unpin.</p>
      </header>

      <div className="panel-body dashboard-trends-body">
        {pinnedDayKey ? (
          <TrendDaySummary
            dateKey={pinnedDayKey}
            callBucket={pinnedCallBucket}
            negotiationBucket={pinnedNegotiationBucket}
            onClear={() => {
              setPinnedDayKey(null);
              setHoveredDayKey(null);
            }}
          />
        ) : null}

        <TrendPanel
          title="Call volume"
          description="Total finalized calls per day; green segments are booked."
          emptyMessage="Finalize carrier calls to see daily volume."
          hasData={callsHaveActivity}
        >
          <CallVolumeChart buckets={callTrend} interaction={interaction} />
        </TrendPanel>

        <TrendPanel
          title="Booking rate"
          description="Share of daily calls that ended in a booking."
          emptyMessage="Booking rate appears once calls are recorded."
          hasData={callsHaveActivity}
        >
          <BookingRateChart buckets={callTrend} interaction={interaction} />
        </TrendPanel>

        <TrendPanel
          title="Agreed rate"
          description="Average booked rate per day (when carriers accept)."
          emptyMessage="Booked calls with agreed rates will chart here."
          hasData={callTrend.some((bucket) => bucket.avgAgreedRate != null)}
        >
          <AgreedRateChart buckets={callTrend} interaction={interaction} />
        </TrendPanel>

        <TrendPanel
          title="Negotiation closes"
          description="Accepted negotiations as a share of rounds started."
          emptyMessage="Negotiation history will appear after carrier offers."
          hasData={negotiationsHaveActivity}
        >
          <NegotiationCloseChart buckets={negotiationTrend} interaction={interaction} />
        </TrendPanel>
      </div>
    </section>
  );
}
