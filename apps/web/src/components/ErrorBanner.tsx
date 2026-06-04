import { parseDashboardError } from "../lib/parse-dashboard-error";

type ErrorBannerProps = {
  message: string;
  onRetry: () => void;
  retrying?: boolean;
};

export function ErrorBanner({ message, onRetry, retrying = false }: ErrorBannerProps) {
  const { title, message: clientMessage } = parseDashboardError(message);

  return (
    <section className="error-banner-section hr-enter" aria-labelledby="error-banner-title">
      <div className="error-banner" role="alert" aria-live="polite">
        <div className="error-banner-copy">
          <h2 id="error-banner-title" className="error-banner-title">
            {title}
          </h2>
          <p className="error-banner-message">{clientMessage}</p>
        </div>
        <button
          type="button"
          className="error-banner-action"
          onClick={onRetry}
          disabled={retrying}
        >
          {retrying ? "Refreshing…" : "Refresh"}
        </button>
      </div>
    </section>
  );
}
