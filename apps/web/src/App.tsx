import { CallsTable } from "./components/CallsTable";
import { DashboardSummary } from "./components/DashboardSummary";
import { ErrorBanner } from "./components/ErrorBanner";
import { LoadsTable } from "./components/LoadsTable";
import { NegotiationsTable } from "./components/NegotiationsTable";
import { SiteHeader } from "./components/SiteHeader";
import { useDashboardData } from "./hooks/useDashboardData";
import { resolveConnectionStatus } from "./lib/connection-status";
import { useTheme } from "./theme";

const CLIENT_NAME = import.meta.env.VITE_CLIENT_NAME ?? "Acme Logistics";

export function App() {
  const { theme, toggleTheme } = useTheme();
  const { data, loading, refreshing, error, lastUpdated, refetch } = useDashboardData();

  const connectionStatus = resolveConnectionStatus({
    loading,
    refreshing,
    error,
    hasData: data != null,
  });

  return (
    <>
      <a className="skip-link" href="#dashboard-main">
        Skip to metrics
      </a>

      <SiteHeader
        clientName={CLIENT_NAME}
        theme={theme}
        onToggleTheme={toggleTheme}
        lastUpdated={lastUpdated}
        connectionStatus={connectionStatus}
      />

      <main id="dashboard-main" className="dashboard" tabIndex={-1}>
        <section className="hero hr-enter" aria-labelledby="dashboard-title">
          <div className="hero-inner">
            <h1 id="dashboard-title">Inbound carrier sales</h1>
            <p className="hero-lede">
              Automated carrier calls for {CLIENT_NAME}—verification, load matching, negotiation,
              and finalized outcomes.
            </p>
          </div>
        </section>

        {error ? (
          <ErrorBanner message={error} onRetry={() => void refetch()} retrying={refreshing} />
        ) : null}

        {loading && !data ? (
          <div className="state-banner state-banner--loading hr-enter" role="status">
            Loading metrics…
          </div>
        ) : null}

        {data?.summary ? <DashboardSummary summary={data.summary} /> : null}

        <CallsTable calls={data?.calls ?? []} />
        <LoadsTable loads={data?.loads ?? []} />
        <NegotiationsTable negotiations={data?.negotiations ?? []} />
      </main>

      <footer className="site-footer">
        <span>
          Powered by <strong>HappyRobot</strong> · Built for {CLIENT_NAME}
        </span>
        <span>Inbound carrier sales POC · Metrics from custom reporting API</span>
      </footer>
    </>
  );
}
