import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { fetchCharacters } from "../heroes";
import { queryKeys } from "../queryKeys";

export function useCharactersQuery() {
  const { i18n } = useTranslation();
  const lang = i18n.language?.slice(0, 2) || "en";
  return useQuery({
    queryKey: [...queryKeys.characters, lang],
    queryFn: () => fetchCharacters(lang),
    staleTime: 5 * 60_000,
  });
}

