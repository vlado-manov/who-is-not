import { useEffect, useRef } from "react";
import { Image, ImageSourcePropType } from "react-native";
import { useCharactersQuery } from "./useCharactersQuery";

function getUri(source: ImageSourcePropType | undefined) {
  if (!source || typeof source === "number") return null;
  if (Array.isArray(source)) return source[0]?.uri ?? null;
  return source.uri ?? null;
}

export function usePrefetchCharacterMedia() {
  const { data } = useCharactersQuery();
  const prefetched = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!data || data.length === 0) return;
    const uris: string[] = [];
    for (const hero of data) {
      const mainUri = getUri(hero.main_image);
      const profileUri = getUri(hero.profileImage);
      if (mainUri && !prefetched.current.has(mainUri)) uris.push(mainUri);
      if (profileUri && !prefetched.current.has(profileUri)) uris.push(profileUri);
    }
    if (uris.length === 0) return;

    void Promise.all(
      uris.map((uri) =>
        Image.prefetch(uri)
          .then(() => prefetched.current.add(uri))
          .catch(() => false)
      )
    );
  }, [data]);
}

