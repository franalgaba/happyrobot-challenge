import { useQuery } from "@tanstack/react-query";
import { fetchDashboardData } from "../api";
import { DASHBOARD_REFETCH_INTERVAL_MS } from "../lib/query-client";

export const dashboardQueryKey = ["dashboard"] as const;

function toErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Failed to load dashboard data.";
}

/** Server state via TanStack Query — no fetch/useEffect in components (see React docs). */
export function useDashboardData() {
  const query = useQuery({
    queryKey: dashboardQueryKey,
    queryFn: fetchDashboardData,
    refetchInterval: DASHBOARD_REFETCH_INTERVAL_MS,
    refetchIntervalInBackground: true,
  });

  const error = query.error ? toErrorMessage(query.error) : null;
  const lastUpdated = query.dataUpdatedAt > 0 ? new Date(query.dataUpdatedAt) : null;

  return {
    data: query.data ?? null,
    loading: query.isPending,
    refreshing: query.isFetching && !query.isPending,
    error,
    lastUpdated,
    refetch: query.refetch,
  };
}
