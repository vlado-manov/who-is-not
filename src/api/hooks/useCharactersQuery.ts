import { useQuery } from "@tanstack/react-query";
import { fetchCharacters } from "../heroes";
import { queryKeys } from "../queryKeys";

export function useCharactersQuery() {
  return useQuery({
    queryKey: queryKeys.characters,
    queryFn: fetchCharacters,
    staleTime: 5 * 60_000,
  });
}

