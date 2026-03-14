import { useEffect, useState } from "react";
import { Image } from "expo-image";
import { backgrounds } from "../../../../assets/backgrounds";
import { game_images } from "../../../../assets/images";
import i18n from "../../../i18n";
import { useAuthStore } from "../../../store/useUserStore";

function getUri(source: { uri?: string } | string | undefined): string | null {
  if (!source) return null;
  if (typeof source === "string") return source;
  return source.uri ?? null;
}

/** Prefetch URLs needed for PassDeviceScreen – bg023, passDevice, current lang logo. */
export function usePassDeviceAssetsReady(): boolean {
  const [ready, setReady] = useState(false);
  const soundEnabled = useAuthStore((s) => s.settings.soundEnabled);

  useEffect(() => {
    let mounted = true;
    const sound = soundEnabled ? "MusicOn" : "MusicOff";
    const lang = i18n.language ?? "en";
    let logoKey: keyof typeof game_images;
    switch (lang) {
      case "fr":
        logoKey = `logoFr${sound}` as keyof typeof game_images;
        break;
      case "es":
        logoKey = `logoEs${sound}` as keyof typeof game_images;
        break;
      case "bg":
        logoKey = `logoBg${sound}` as keyof typeof game_images;
        break;
      default:
        logoKey = `logo${sound}` as keyof typeof game_images;
        break;
    }
    const logo = game_images[logoKey];
    const urls = [
      getUri(backgrounds.bg023),
      getUri(game_images.passDevice),
      getUri(logo),
    ].filter((u): u is string => Boolean(u));

    Promise.all(urls.map((u) => Image.prefetch(u).catch(() => false)))
      .then(() => mounted && setReady(true))
      .catch(() => mounted && setReady(true));

    return () => {
      mounted = false;
    };
  }, [soundEnabled]);

  return ready;
}
