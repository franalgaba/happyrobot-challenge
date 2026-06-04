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
      subtitle="Outcome, sentiment, lane, and agreed rate from finalize-call"
      isEmpty={calls.length === 0}
      emptyTitle="No calls recorded yet"
      emptyBody="Run the HappyRobot Web Call workflow, then finalize a conversation to see rows here."
    >
      <table className="data-table">
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
              <td className="mono">{formatDateTime(call.createdAt)}</td>
              <td className="mono">{call.mcNumber ?? EMPTY_VALUE}</td>
              <td className="mono">{call.loadId ?? EMPTY_VALUE}</td>
              <td>
                <Badge value={call.outcome} />
              </td>
              <td>
                <Badge value={call.sentiment} />
              </td>
              <td>
                <AnimatedMoney value={call.agreedRate} />
              </td>
              <td>{call.summary ?? EMPTY_VALUE}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </ReportTableSection>
  );
}
