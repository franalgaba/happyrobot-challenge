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

const STATUS_ARIA: Record<ConnectionStatus, string> = {
  live: "Dashboard connection live",
  loading: "Dashboard connecting",
  syncing: "Dashboard syncing latest metrics",
  error: "Dashboard connection unavailable",
};

export function ConnectionStatusPill({ status }: ConnectionStatusProps) {
  return (
    <span
      className={`live-pill live-pill--${status}`}
      role="status"
      aria-label={STATUS_ARIA[status]}
    >
      <span className="live-dot" aria-hidden />
      <span aria-hidden>{STATUS_COPY[status]}</span>
    </span>
  );
}
