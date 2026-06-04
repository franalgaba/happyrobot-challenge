import { formatDateTime } from "../lib/format";
import { INTEGER_FORMAT } from "../lib/number-flow";
import { AnimatedMoney } from "./AnimatedMoney";
import { AnimatedNumber } from "./AnimatedNumber";
import type { NegotiationRecord } from "@happyrobot-challenge/shared";
import { Badge } from "./Badge";

type NegotiationsBoardProps = {
  negotiations: NegotiationRecord[];
};

export function NegotiationsBoard({ negotiations }: NegotiationsBoardProps) {
  if (negotiations.length === 0) {
    return (
      <div className="collapsible-board-empty">
        <strong>No negotiations yet</strong>
        <p>Rate discussions during a carrier call will appear here once offers are exchanged.</p>
      </div>
    );
  }

  return (
    <div className="report-section-scroll">
      <table className="data-table data-table--stack">
        <thead>
          <tr>
            <th>Updated</th>
            <th>Load</th>
            <th>MC</th>
            <th>Rounds</th>
            <th>Status</th>
            <th>Last offer</th>
            <th>Last counter</th>
            <th>Agreed</th>
          </tr>
        </thead>
        <tbody>
          {negotiations.map((negotiation) => (
            <tr key={negotiation.id}>
              <td className="mono" data-label="Updated">
                {formatDateTime(negotiation.updatedAt)}
              </td>
              <td className="mono" data-label="Load">
                {negotiation.loadId}
              </td>
              <td className="mono" data-label="MC">
                {negotiation.mcNumber}
              </td>
              <td data-label="Rounds">
                <AnimatedNumber
                  className="mono"
                  value={negotiation.roundCount}
                  format={INTEGER_FORMAT}
                />
              </td>
              <td data-label="Status">
                <Badge kind="negotiation" value={negotiation.status} />
              </td>
              <td data-label="Last offer">
                <AnimatedMoney value={negotiation.lastOfferRate} />
              </td>
              <td data-label="Last counter">
                <AnimatedMoney value={negotiation.lastCounterRate} />
              </td>
              <td data-label="Agreed">
                <AnimatedMoney value={negotiation.agreedRate} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
