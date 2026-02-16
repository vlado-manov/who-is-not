import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { ApiError } from "./types";
import { reportApiError } from "./errorHandler";
import { queryKeys } from "./queryKeys";

function isRetriable(error: unknown) {
  if (!(error instanceof ApiError)) return true;
  if (error.code === "RATE_LIMITED") return false;
  if (error.code === "UNAUTHORIZED" || error.code === "FORBIDDEN") return false;
  if (error.status !== null && error.status >= 400 && error.status < 500) {
    return false;
  }
  return true;
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => reportApiError(error),
  }),
  mutationCache: new MutationCache({
    onError: (error) => reportApiError(error),
  }),
    defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (failureCount >= 1) return false;
        return isRetriable(error);
      },
      staleTime: 60_000,
      gcTime: 10 * 60_000,
      refetchOnWindowFocus: false,
    },
    mutations: {
      // Write operations should not auto-retry by default.
      retry: false,
    },
  },
});

queryClient.setQueryDefaults(queryKeys.characters, {
  retry: (failureCount, error) => {
    if (failureCount >= 2) return false;
    return isRetriable(error);
  },
  staleTime: 5 * 60_000,
  gcTime: 30 * 60_000,
});

queryClient.setQueryDefaults(queryKeys.analyticsGlobal, {
  retry: (failureCount, error) => {
    if (failureCount >= 1) return false;
    return isRetriable(error);
  },
  staleTime: 30_000,
  gcTime: 5 * 60_000,
});

queryClient.setQueryDefaults(queryKeys.analyticsKpis, {
  retry: (failureCount, error) => {
    if (failureCount >= 1) return false;
    return isRetriable(error);
  },
  staleTime: 30_000,
  gcTime: 5 * 60_000,
});
