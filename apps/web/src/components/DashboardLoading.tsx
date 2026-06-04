export function DashboardLoading() {
  return (
    <div
      className="dashboard-skeleton hr-enter"
      role="status"
      aria-busy="true"
      aria-label="Loading metrics"
    >
      <div className="panel skeleton-panel skeleton-panel--pulse" />
      <div className="panel skeleton-panel skeleton-panel--flat" />
      <div className="report-section skeleton-report-section" />
    </div>
  );
}
