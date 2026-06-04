import { formatDateTime } from "../lib/format";
import { INTEGER_FORMAT } from "../lib/number-flow";
import { AnimatedMoney } from "./AnimatedMoney";
import { AnimatedNumber } from "./AnimatedNumber";
import type { NegotiationRecord } from "@happyrobot-challenge/shared";
import { Badge } from "./Badge";
import { ReportTableSection } from "./ReportTableSection";

type NegotiationsTableProps = {
  negotiations: NegotiationRecord[];
};

export function NegotiationsTable({ negotiations }: NegotiationsTableProps) {
  return (
    <ReportTableSection
      headingId="negotiations-heading"
      title="Negotiations"
      subtitle="Per-session offer history and current status"
      isEmpty={negotiations.length === 0}
      emptyTitle="No negotiations yet"
      emptyBody="Counter-offers during a call will appear here."
    >
      <table className="data-table">
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
              <td className="mono">{formatDateTime(negotiation.updatedAt)}</td>
              <td className="mono">{negotiation.loadId}</td>
              <td className="mono">{negotiation.mcNumber}</td>
              <td>
                <AnimatedNumber className="mono" value={negotiation.roundCount} format={INTEGER_FORMAT} />
              </td>
              <td>
                <Badge value={negotiation.status} />
              </td>
              <td>
                <AnimatedMoney value={negotiation.lastOfferRate} />
              </td>
              <td>
                <AnimatedMoney value={negotiation.lastCounterRate} />
              </td>
              <td>
                <AnimatedMoney value={negotiation.agreedRate} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </ReportTableSection>
  );
}
