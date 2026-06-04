export function DashboardLoading() {
  return (
    <div
      className="dashboard-skeleton hr-enter"
      role="status"
      aria-busy="true"
      aria-label="Loading metrics"
    >
      <div className="kpi-band kpi-band--skeleton">
        <div className="kpi-feature skeleton-block" />
        <div className="kpi-stats kpi-stats--skeleton">
          <div className="skeleton-block" />
          <div className="skeleton-block" />
          <div className="skeleton-block" />
        </div>
      </div>
      <div className="panel-grid panel-grid--distributions">
        <div className="panel skeleton-panel skeleton-panel--wide" />
        <div className="panel skeleton-panel" />
      </div>
      <div className="panel skeleton-panel skeleton-panel--flat" />
    </div>
  );
}
