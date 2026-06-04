import { formatDateTime } from "../lib/format";
import { AnimatedMoney } from "./AnimatedMoney";
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
      emptyBody="Active freight ready for carrier matching will show up here."
    >
      <table className="data-table data-table--stack">
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
              <td className="mono" data-label="Load ID">
                {load.loadId}
              </td>
              <td data-label="Lane">
                {load.origin} → {load.destination}
              </td>
              <td data-label="Equipment">{load.equipmentType}</td>
              <td className="mono" data-label="Pickup">
                {formatDateTime(load.pickupDatetime)}
              </td>
              <td data-label="Board">
                <AnimatedMoney value={load.loadboardRate} />
              </td>
              <td data-label="Target">
                <AnimatedMoney value={load.targetRate} />
              </td>
              <td data-label="Max auto">
                <AnimatedMoney value={load.maxAutoRate} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </ReportTableSection>
  );
}
