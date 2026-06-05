export function DashboardIntelligenceFallback() {
  return (
    <section className="dashboard-intelligence" aria-busy="true" aria-label="Loading network and trends">
      <div className="intelligence-grid intelligence-grid--loading">
        <div className="panel panel-skeleton" />
        <div className="panel panel-skeleton" />
      </div>
    </section>
  );
}
