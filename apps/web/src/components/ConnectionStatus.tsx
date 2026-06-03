export type ConnectionStatus = "live" | "loading" | "syncing" | "error";

type ConnectionStatusProps = {
  status: ConnectionStatus;
};

const STATUS_COPY: Record<ConnectionStatus, string> = {
  live: "Live",
  loading: "Connecting",
  syncing: "Syncing",
  error: "Unavailable",
};

export function ConnectionStatusPill({ status }: ConnectionStatusProps) {
  return (
    <span className={`live-pill live-pill--${status}`} role="status">
      <span className="live-dot" aria-hidden />
      {STATUS_COPY[status]}
    </span>
  );
}
