import { formatDateTime, formatMoney } from "../lib/format";
import type { LoadRecord } from "@happyrobot-challenge/shared";
import { ReportTableSection } from "./ReportTableSection";

type LoadsTableProps = {
  loads: LoadRecord[];
};

export function LoadsTable({ loads }: LoadsTableProps) {
  const activeLoads = loads.filter((load) => load.active);

  return (
    <ReportTableSection
      headingId="loads-heading"
      title="Active loads"
      subtitle={`${activeLoads.length} loads available for matching`}
      isEmpty={activeLoads.length === 0}
      emptyTitle="No active loads"
      emptyBody="Seed the database or check load status in the API."
    >
      <table className="data-table">
        <thead>
          <tr>
            <th>Load ID</th>
            <th>Lane</th>
            <th>Equipment</th>
            <th>Pickup</th>
            <th>Board</th>
            <th>Target</th>
            <th>Max auto</th>
          </tr>
        </thead>
        <tbody>
          {activeLoads.map((load) => (
            <tr key={load.loadId}>
              <td className="mono">{load.loadId}</td>
              <td>
                {load.origin} → {load.destination}
              </td>
              <td>{load.equipmentType}</td>
              <td className="mono">{formatDateTime(load.pickupDatetime)}</td>
              <td className="mono">{formatMoney(load.loadboardRate)}</td>
              <td className="mono">{formatMoney(load.targetRate)}</td>
              <td className="mono">{formatMoney(load.maxAutoRate)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </ReportTableSection>
  );
}
