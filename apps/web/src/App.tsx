import { CallsWorkSection } from "./components/CallsWorkSection";
import { CollapsibleBoard } from "./components/CollapsibleBoard";
import { DemoCallLauncher } from "./components/DemoCallLauncher";
import { DashboardLoading } from "./components/DashboardLoading";
import { DashboardOverview } from "./components/DashboardOverview";
import { ErrorBanner } from "./components/ErrorBanner";
import { LoadsBoard } from "./components/LoadsBoard";
import { NegotiationsBoard } from "./components/NegotiationsBoard";
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
  const showWork = data != null;
  const subtleNumbers = refreshing && data != null;
  const activeLoadCount = data?.loads.filter((load) => load.active).length ?? 0;

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
              Operations view for {CLIENT_NAME}—booking performance, call outcomes, and auditable
              carrier conversations.
            </p>
          </section>
          <DemoCallLauncher onCallEnded={refetch} />
        </div>

        {error ? (
          <ErrorBanner message={error} onRetry={handleRetry} retrying={refreshing} />
        ) : null}

        {showLoading ? <DashboardLoading /> : null}

        {data?.summary ? <DashboardOverview summary={data.summary} /> : null}

        {showWork ? (
          <div className="dashboard-work">
            <CallsWorkSection
              calls={data.calls}
              loads={data.loads}
              negotiations={data.negotiations}
            />
            <CollapsibleBoard
              id="loads-board"
              title="Active loads"
              count={activeLoadCount}
              hint="Coverage available for matching"
            >
              <LoadsBoard loads={data.loads} />
            </CollapsibleBoard>
            <CollapsibleBoard
              id="negotiations-board"
              title="All negotiations"
              count={data.negotiations.length}
              hint="Full offer history across sessions"
            >
              <NegotiationsBoard negotiations={data.negotiations} />
            </CollapsibleBoard>
          </div>
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
