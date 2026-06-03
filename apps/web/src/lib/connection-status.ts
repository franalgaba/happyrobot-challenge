import type { ConnectionStatus } from "../components/ConnectionStatus";

type ConnectionInput = {
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  hasData: boolean;
};

export function resolveConnectionStatus({
  loading,
  refreshing,
  error,
  hasData,
}: ConnectionInput): ConnectionStatus {
  if (error) return "error";
  if (loading && !hasData) return "loading";
  if (refreshing) return "syncing";
  return "live";
}
