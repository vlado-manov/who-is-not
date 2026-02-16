import { useCallback } from "react";
import { GlobalStatsDto, KpisDto } from "../api/stats";
import { useGlobalStatsQuery, useKpisQuery } from "../api/hooks/useStatsQueries";

type BackendStatsState = {
  loading: boolean;
  error: string | null;
  global: GlobalStatsDto | null;
  kpis: KpisDto | null;
  refresh: () => Promise<void>;
};

export function useBackendStats(): BackendStatsState {
  const globalQuery = useGlobalStatsQuery();
  const kpiQuery = useKpisQuery();

  const refresh = useCallback(async () => {
    await Promise.all([globalQuery.refetch(), kpiQuery.refetch()]);
  }, [globalQuery, kpiQuery]);

  const errorMessage =
    (globalQuery.error instanceof Error && globalQuery.error.message) ||
    (kpiQuery.error instanceof Error && kpiQuery.error.message) ||
    null;

  return {
    loading: globalQuery.isLoading || kpiQuery.isLoading,
    error: errorMessage,
    global: (globalQuery.data ?? null) as GlobalStatsDto | null,
    kpis: (kpiQuery.data ?? null) as KpisDto | null,
    refresh,
  };
}
