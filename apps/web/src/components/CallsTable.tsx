import { EMPTY_VALUE, formatDateTime } from "../lib/format";
import { AnimatedMoney } from "./AnimatedMoney";
import type { CallRecord } from "@happyrobot-challenge/shared";
import { Badge } from "./Badge";
import { ReportTableSection } from "./ReportTableSection";

type CallsTableProps = {
  calls: CallRecord[];
};

export function CallsTable({ calls }: CallsTableProps) {
  return (
    <ReportTableSection
      headingId="calls-heading"
      title="Recent calls"
      subtitle="Outcome, sentiment, lane, and agreed rate per finalized call"
      isEmpty={calls.length === 0}
      emptyTitle="No calls recorded yet"
      emptyBody="When a carrier conversation is finalized, outcomes and rates will appear here."
    >
      <table className="data-table data-table--stack">
        <thead>
          <tr>
            <th>When</th>
            <th>MC</th>
            <th>Load</th>
            <th>Outcome</th>
            <th>Sentiment</th>
            <th>Agreed</th>
            <th>Summary</th>
          </tr>
        </thead>
        <tbody>
          {calls.map((call) => (
            <tr key={call.id}>
              <td className="mono" data-label="When">
                {formatDateTime(call.createdAt)}
              </td>
              <td className="mono" data-label="MC">
                {call.mcNumber ?? EMPTY_VALUE}
              </td>
              <td className="mono" data-label="Load">
                {call.loadId ?? EMPTY_VALUE}
              </td>
              <td data-label="Outcome">
                <Badge value={call.outcome} />
              </td>
              <td data-label="Sentiment">
                <Badge value={call.sentiment} />
              </td>
              <td data-label="Agreed">
                <AnimatedMoney value={call.agreedRate} />
              </td>
              <td className="cell-summary" data-label="Summary" title={call.summary ?? undefined}>
                {call.summary ?? EMPTY_VALUE}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </ReportTableSection>
  );
}
