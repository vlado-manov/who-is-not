/**
 * Remote image prefetch: Android uses React Native Image.prefetch only (Fresco);
 * iOS uses expo-image (shared disk cache with AppImage).
 */
import { Image } from "expo-image";
import { Image as RNImage, Platform } from "react-native";

/** Many CDNs behave better with an explicit Accept / UA (expo-image path). */
export const EXPO_IMAGE_PREFETCH_OPTIONS = {
  cachePolicy: "memory-disk" as const,
  headers: {
    Accept: "image/webp,image/avif,image/*;q=0.8,*/*;q=0.5",
    "User-Agent": `WhoIsNot/1.0 Expo (React Native; ${Platform.OS})`,
  },
};

const RETRY_MS = [0, 250, 500, 900];

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

async function prefetchAndroidRnOnly(
  url: string,
  maxAttempts: number,
): Promise<boolean> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (attempt > 0) await sleep(RETRY_MS[attempt] ?? 400 * attempt);
    try {
      const ok = await RNImage.prefetch(url);
      if (ok === true) return true;
    } catch {
      /* retry */
    }
  }
  return false;
}

async function prefetchIosExpo(
  url: string,
  maxAttempts: number,
): Promise<boolean> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (attempt > 0) await sleep(RETRY_MS[attempt] ?? 400 * attempt);
    try {
      const ok = await Image.prefetch(url, EXPO_IMAGE_PREFETCH_OPTIONS);
      if (ok === true) {
        try {
          await RNImage.prefetch(url);
        } catch {
          /* warm RN cache too */
        }
        return true;
      }
    } catch {
      /* retry */
    }
  }
  return false;
}

/**
 * Prefetch until success or attempts exhausted.
 * Android: only RN Image.prefetch (matches RN Image in curtain UI).
 */
export async function prefetchExpoImageUri(
  url: string,
  maxAttempts = 4,
): Promise<boolean> {
  if (Platform.OS === "android") {
    return prefetchAndroidRnOnly(url, maxAttempts);
  }
  return prefetchIosExpo(url, maxAttempts);
}

export async function prefetchExpoImageUris(urls: string[]): Promise<boolean> {
  const results = await Promise.all(urls.map((u) => prefetchExpoImageUri(u)));
  return results.every(Boolean);
}
