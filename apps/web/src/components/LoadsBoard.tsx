import { formatDateTime } from "../lib/format";
import { AnimatedMoney } from "./AnimatedMoney";
import type { LoadRecord } from "@happyrobot-challenge/shared";

type LoadsBoardProps = {
  loads: LoadRecord[];
};

export function LoadsBoard({ loads }: LoadsBoardProps) {
  const activeLoads = loads.filter((load) => load.active);

  if (activeLoads.length === 0) {
    return (
      <div className="collapsible-board-empty">
        <strong>No active loads</strong>
        <p>Active freight ready for carrier matching will show up here.</p>
      </div>
    );
  }

  return (
    <div className="report-section-scroll">
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
    </div>
  );
}
