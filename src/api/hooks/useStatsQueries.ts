import { useQuery } from "@tanstack/react-query";
import { getGlobalStats, getKpis } from "../stats";
import { queryKeys } from "../queryKeys";

export function useGlobalStatsQuery() {
  return useQuery({
    queryKey: queryKeys.analyticsGlobal,
    queryFn: getGlobalStats,
    staleTime: 30_000,
  });
}

export function useKpisQuery() {
  return useQuery({
    queryKey: queryKeys.analyticsKpis,
    queryFn: getKpis,
    staleTime: 30_000,
  });
}

