import { EMPTY_VALUE, formatDateTime } from "../lib/format";
import { findLoadForCall, findNegotiationForCall, formatLane } from "../lib/call-details";
import { AnimatedMoney } from "./AnimatedMoney";
import { INTEGER_FORMAT } from "../lib/number-flow";
import { AnimatedNumber } from "./AnimatedNumber";
import type { CallRecord, LoadRecord, NegotiationRecord } from "@happyrobot-challenge/shared";
import { Badge } from "./Badge";

type CallsTableProps = {
  calls: CallRecord[];
  loads: LoadRecord[];
  negotiations: NegotiationRecord[];
  emptyTitle: string;
  emptyBody: string;
};

export function CallsTable({
  calls,
  loads,
  negotiations,
  emptyTitle,
  emptyBody,
}: CallsTableProps) {
  if (calls.length === 0) {
    return (
      <div className="report-section-body report-section-body--empty">
        <div className="empty-state">
          <strong>{emptyTitle}</strong>
          <p>{emptyBody}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="report-section-body report-section-scroll">
      <table className="data-table data-table--stack">
        <thead>
          <tr>
            <th>When</th>
            <th>MC</th>
            <th>Lane</th>
            <th>Outcome</th>
            <th>Sentiment</th>
            <th>Negotiation</th>
            <th>Agreed</th>
            <th>Summary</th>
          </tr>
        </thead>
        <tbody>
          {calls.map((call) => {
            const load = findLoadForCall(loads, call.loadId);
            const lane = formatLane(load) ?? call.loadId ?? EMPTY_VALUE;
            const negotiation = findNegotiationForCall(negotiations, call);

            return (
              <tr key={call.id}>
                <td className="mono" data-label="When">
                  {formatDateTime(call.createdAt)}
                </td>
                <td className="mono" data-label="MC">
                  {call.mcNumber ?? EMPTY_VALUE}
                </td>
                <td data-label="Lane">{lane}</td>
                <td data-label="Outcome">
                  <Badge kind="outcome" value={call.outcome} />
                </td>
                <td data-label="Sentiment">
                  <Badge kind="sentiment" value={call.sentiment} />
                </td>
                <td data-label="Negotiation">
                  {negotiation ? (
                    <span className="call-negotiation">
                      <Badge kind="negotiation" value={negotiation.status} />
                      <span className="mono call-negotiation-meta">
                        <AnimatedNumber value={negotiation.roundCount} format={INTEGER_FORMAT} />{" "}
                        rnd
                      </span>
                    </span>
                  ) : (
                    EMPTY_VALUE
                  )}
                </td>
                <td data-label="Agreed">
                  <AnimatedMoney value={call.agreedRate} />
                </td>
                <td className="cell-summary" data-label="Summary" title={call.summary ?? undefined}>
                  {call.summary ?? EMPTY_VALUE}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
