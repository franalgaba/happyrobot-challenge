import { NumberFlowGroup } from "@number-flow/react";
import type { ReportSummary } from "@happyrobot-challenge/shared";
import { EMPTY_VALUE, getBookedCount } from "../lib/format";
import { getBookingRate } from "../lib/dashboard-metrics";
import { INTEGER_FORMAT } from "../lib/number-flow";
import { AnimatedMoney } from "./AnimatedMoney";
import { AnimatedNumber } from "./AnimatedNumber";
import { OutcomeStackBar } from "./OutcomeStackBar";

type DashboardPulseProps = {
  summary: ReportSummary;
};

export function DashboardPulse({ summary }: DashboardPulseProps) {
  const booked = getBookedCount(summary);
  const bookingRate = getBookingRate(summary);
  const hasCalls = summary.totalCalls > 0;

  return (
    <section className="dashboard-pulse panel panel--contain hr-enter" aria-label="Performance pulse">
      <NumberFlowGroup>
        <div className="dashboard-pulse-body">
          <div className="pulse-layout">
            <p className="pulse-label pulse-label--primary">Booking rate</p>
            <p className="pulse-label pulse-label--outcomes">Where calls ended</p>

            <div className="pulse-hero">
              {hasCalls ? (
                <AnimatedNumber
                  className="pulse-rate"
                  value={bookingRate}
                  suffix="%"
                  format={INTEGER_FORMAT}
                />
              ) : (
                <p className="pulse-rate">{EMPTY_VALUE}</p>
              )}
              <p className="pulse-subline">
                {hasCalls ? (
                  <>
                    <AnimatedNumber className="pulse-meta" value={booked} format={INTEGER_FORMAT} /> of{" "}
                    <AnimatedNumber
                      className="pulse-meta"
                      value={summary.totalCalls}
                      format={INTEGER_FORMAT}
                    />{" "}
                    booked
                    <span aria-hidden> · </span>
                    {summary.averageAgreedRate == null ? (
                      <>avg agreed {EMPTY_VALUE}</>
                    ) : (
                      <>
                        avg agreed <AnimatedMoney value={summary.averageAgreedRate} />
                      </>
                    )}
                  </>
                ) : (
                  "No finalized calls yet"
                )}
              </p>
            </div>

            <div className="pulse-outcomes">
              <OutcomeStackBar byOutcome={summary.byOutcome} total={summary.totalCalls} />
            </div>
          </div>
        </div>
      </NumberFlowGroup>
    </section>
  );
}
