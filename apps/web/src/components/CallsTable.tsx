import { Fragment, useId, useState } from "react";
import type { CallRecord, LoadRecord, NegotiationRecord } from "@happyrobot-challenge/shared";
import { findLoadForCall, findNegotiationForCall, formatLane } from "../lib/call-details";
import { EMPTY_VALUE, formatDateTime, formatMoney } from "../lib/format";
import { INTEGER_FORMAT } from "../lib/number-flow";
import { AnimatedMoney } from "./AnimatedMoney";
import { AnimatedNumber } from "./AnimatedNumber";
import { Badge } from "./Badge";

type CallsTableProps = {
  calls: CallRecord[];
  loads: LoadRecord[];
  negotiations: NegotiationRecord[];
  emptyTitle: string;
  emptyBody: string;
};

type CallDetailPanelProps = {
  call: CallRecord;
  load: LoadRecord | undefined;
  negotiation: NegotiationRecord | undefined;
};

function callHasExpandableDetails(
  call: CallRecord,
  load: LoadRecord | undefined,
  negotiation: NegotiationRecord | undefined,
): boolean {
  return Boolean(call.summary || negotiation || load || call.transferMock);
}

function CallDetailPanel({ call, load, negotiation }: CallDetailPanelProps) {
  return (
    <dl className="call-detail-panel">
      <div>
        <dt>Summary</dt>
        <dd>{call.summary ?? EMPTY_VALUE}</dd>
      </div>
      {load ? (
        <div>
          <dt>Load</dt>
          <dd className="mono">{load.loadId}</dd>
        </div>
      ) : null}
      {negotiation ? (
        <>
          <div>
            <dt>Last offer</dt>
            <dd>{formatMoney(negotiation.lastOfferRate)}</dd>
          </div>
          <div>
            <dt>Last counter</dt>
            <dd>{formatMoney(negotiation.lastCounterRate)}</dd>
          </div>
        </>
      ) : null}
      {call.transferMock ? (
        <div>
          <dt>Transfer</dt>
          <dd>Mock transfer recorded</dd>
        </div>
      ) : null}
    </dl>
  );
}

export function CallsTable({
  calls,
  loads,
  negotiations,
  emptyTitle,
  emptyBody,
}: CallsTableProps) {
  const detailPrefix = useId();
  const [expandedCallId, setExpandedCallId] = useState<string | null>(null);

  function toggleCallDetails(callId: string, expanded: boolean) {
    setExpandedCallId(expanded ? null : callId);
  }

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
            <th scope="col">
              <span className="visually-hidden">Expand call details</span>
            </th>
            <th scope="col">When</th>
            <th scope="col">MC</th>
            <th scope="col">Lane</th>
            <th scope="col">Outcome</th>
            <th scope="col">Sentiment</th>
            <th scope="col">Negotiation</th>
            <th scope="col">Agreed</th>
            <th scope="col">Summary</th>
          </tr>
        </thead>
        <tbody>
          {calls.map((call) => {
            const load = findLoadForCall(loads, call.loadId);
            const lane = formatLane(load) ?? call.loadId ?? EMPTY_VALUE;
            const negotiation = findNegotiationForCall(negotiations, call);
            const detailId = `${detailPrefix}-${call.id}`;
            const expanded = expandedCallId === call.id;
            const hasDetails = callHasExpandableDetails(call, load, negotiation);

            return (
              <Fragment key={call.id}>
                <tr className={expanded ? "call-row is-expanded" : "call-row"}>
                  <td data-label="Details">
                    {hasDetails ? (
                      <button
                        type="button"
                        className="call-row-toggle"
                        aria-expanded={expanded}
                        aria-controls={detailId}
                        onClick={() => toggleCallDetails(call.id, expanded)}
                      >
                        {expanded ? "Hide" : "Details"}
                      </button>
                    ) : (
                      EMPTY_VALUE
                    )}
                  </td>
                  <td className="mono" data-label="When">
                    {formatDateTime(call.createdAt)}
                  </td>
                  <td className="mono" data-label="MC">
                    {call.mcNumber ?? EMPTY_VALUE}
                  </td>
                  <td data-label="Lane">
                    <span className="call-lane">{lane}</span>
                  </td>
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
                          <AnimatedNumber value={negotiation.roundCount} format={INTEGER_FORMAT} /> rnd
                        </span>
                      </span>
                    ) : (
                      EMPTY_VALUE
                    )}
                  </td>
                  <td data-label="Agreed">
                    <AnimatedMoney value={call.agreedRate} />
                  </td>
                  <td className="cell-summary" data-label="Summary">
                    {call.summary ?? EMPTY_VALUE}
                  </td>
                </tr>
                {expanded ? (
                  <tr className="call-row-detail">
                    <td colSpan={9} id={detailId}>
                      <CallDetailPanel call={call} load={load} negotiation={negotiation} />
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
