import { QueryClient } from "@tanstack/react-query";

export const DASHBOARD_REFETCH_INTERVAL_MS = 30_000;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      retry: 1,
    },
  },
});
