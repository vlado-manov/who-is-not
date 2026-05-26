import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { fetchCharacters } from "../heroes";
import { queryKeys } from "../queryKeys";
import { useAuthStore } from "../../store/useUserStore";

export function useCharactersQuery() {
  const { i18n } = useTranslation();
  const lang = i18n.language?.slice(0, 2) || "en";
  const userId = useAuthStore((s) => s.user.id);
  return useQuery({
    queryKey: [...queryKeys.characters, lang, userId],
    queryFn: () => fetchCharacters(lang, userId),
    staleTime: 5 * 60_000,
  });
}

