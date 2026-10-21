// src/hooks/useProfileAvatarSource.ts
import type { ImageSourcePropType } from "react-native";

import { useHeroesStore } from "../store/useHeroesStore";
import { useAuthStore } from "../store/useUserStore";

const SILENT_VANESSA_ID = "cmlt8yz96000etbesm149mii8";

/**
 * The user's profile picture: the hero chosen as avatar, or Silent Vanessa
 * when none is set — the same rule as the Profile screen's picture.
 */
export function useProfileAvatarSource(): ImageSourcePropType | null {
  const avatarId = useAuthStore((s) => s.user.avatarId);
  const heroes = useHeroesStore((s) => s.heroes);
  const image =
    heroes.reduce<typeof heroes>(
      (all, h) => all.concat(h, h.skins ?? []),
      [],
    ).find(
      (h) => h.slug === avatarId,
    )?.profileImage ??
    heroes.find((h) => h.id === SILENT_VANESSA_ID)?.profileImage ??
    heroes.find((h) => h.name === "Silent Vanessa")?.profileImage;
  if (!image) return null;
  return typeof image === "string" ? { uri: image } : image;
}
