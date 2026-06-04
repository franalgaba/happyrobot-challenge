import { CallsTable } from "./components/CallsTable";
import { DemoCallLauncher } from "./components/DemoCallLauncher";
import { DashboardLoading } from "./components/DashboardLoading";
import { DashboardSummary } from "./components/DashboardSummary";
import { ErrorBanner } from "./components/ErrorBanner";
import { LoadsTable } from "./components/LoadsTable";
import { NegotiationsTable } from "./components/NegotiationsTable";
import { SiteHeader } from "./components/SiteHeader";
import { DashboardMotionProvider } from "./context/dashboard-motion";
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

  const showLoading = loading && data == null;
  const showTables = data != null;
  const subtleNumbers = refreshing && data != null;

  function handleRetry() {
    void refetch();
  }

  return (
    <DashboardMotionProvider subtleNumbers={subtleNumbers}>
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
        <div className="page-intro hr-enter">
          <section className="intro-card" aria-labelledby="dashboard-title">
            <h1 id="dashboard-title">Inbound carrier sales</h1>
            <p className="page-intro-lede">
              Operations view for {CLIENT_NAME}—finalized calls, negotiation outcomes, and load
              coverage in one place.
            </p>
          </section>
          <DemoCallLauncher onCallEnded={refetch} />
        </div>

        {error ? (
          <ErrorBanner message={error} onRetry={handleRetry} retrying={refreshing} />
        ) : null}

        {showLoading ? <DashboardLoading /> : null}

        {data?.summary ? <DashboardSummary summary={data.summary} /> : null}

        {showTables ? (
          <>
            <CallsTable calls={data.calls} />
            <LoadsTable loads={data.loads} />
            <NegotiationsTable negotiations={data.negotiations} />
          </>
        ) : null}
      </main>

      <footer className="site-footer">
        <span>
          Powered by <strong>HappyRobot</strong> · Built for {CLIENT_NAME}
        </span>
        <span>Operations reporting · Live metrics from your API</span>
      </footer>
    </DashboardMotionProvider>
  );
}
