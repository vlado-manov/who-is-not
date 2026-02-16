import { useEffect } from "react";
import { useCharactersQuery } from "./useCharactersQuery";
import { useHeroesStore } from "../../store/useHeroesStore";

export function useSyncHeroesStore() {
  const query = useCharactersQuery();
  const setRemoteState = useHeroesStore((s) => s.setRemoteState);

  useEffect(() => {
    setRemoteState({
      heroes: query.data ?? [],
      loading: query.isLoading || query.isFetching,
      loaded: query.isSuccess || query.isError,
      error: query.error instanceof Error ? query.error.message : null,
    });
  }, [
    query.data,
    query.isError,
    query.isFetching,
    query.isLoading,
    query.isSuccess,
    query.error,
    setRemoteState,
  ]);

  return query;
}

