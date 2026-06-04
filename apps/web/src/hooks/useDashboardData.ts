import { useQuery } from "@tanstack/react-query";
import { fetchDashboardData } from "../api";
import { DASHBOARD_REFETCH_INTERVAL_MS } from "../lib/query-client";

const DASHBOARD_QUERY_KEY = ["dashboard"] as const;

export type DashboardQueryState = {
  data: Awaited<ReturnType<typeof fetchDashboardData>> | undefined;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refetch: () => void;
};

export function useDashboardData(): DashboardQueryState {
  const query = useQuery({
    queryKey: DASHBOARD_QUERY_KEY,
    queryFn: fetchDashboardData,
    refetchInterval: (dashboardQuery) =>
      dashboardQuery.state.error ? false : DASHBOARD_REFETCH_INTERVAL_MS,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: false,
  });

  const errorMessage =
    query.error instanceof Error ? query.error.message : query.error ? String(query.error) : null;

  return {
    data: query.data,
    loading: query.isPending,
    refreshing: query.isFetching && !query.isPending,
    error: errorMessage,
    lastUpdated: query.dataUpdatedAt ? new Date(query.dataUpdatedAt) : null,
    refetch: () => {
      void query.refetch();
    },
  };
}
