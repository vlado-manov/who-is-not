import { useEffect, useState } from "react";
import { ICharacter } from "../../../types/character";
import { Image, ImageSourcePropType } from "react-native";

const preloadedHeroUris = new Set<string>();

function getUri(source: ImageSourcePropType | undefined) {
  if (!source || typeof source === "number") return null;
  if (Array.isArray(source)) return source[0]?.uri ?? null;
  return source.uri ?? null;
}

export function useHeroAssets(availableHeroes: ICharacter[]) {
  const [assetsReady, setAssetsReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        if (availableHeroes.length > 0) {
          const uris: string[] = [];
          for (const hero of availableHeroes) {
            const uri = getUri(hero.main_image);
            if (uri && !preloadedHeroUris.has(uri)) {
              uris.push(uri);
            }
          }

          if (uris.length > 0) {
            await Promise.all(
              uris.map((uri) =>
                Image.prefetch(uri)
                  .then(() => preloadedHeroUris.add(uri))
                  .catch(() => false)
              )
            );
          }
        }
      } finally {
        mounted && setAssetsReady(true);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [availableHeroes]);

  return assetsReady;
}
