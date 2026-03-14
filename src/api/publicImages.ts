import { Image } from "expo-image";
import { apiRequest } from "./client";
import { ApiError } from "./types";

export type PublicImageAsset = {
  id: string;
  name: string;
  slug: string;
  folder: string;
  url: string;
  mimeType: string;
  width?: number;
  height?: number;
  bytes?: number;
};

const imageUrlCache: Record<string, string> = {};

async function fetchPublicImageBySlug(slug: string): Promise<PublicImageAsset> {
  return apiRequest<PublicImageAsset>(`/images/${encodeURIComponent(slug)}`, {
    skipAuth: true,
  });
}

function normalizeLang(input?: string | null): "en" | "bg" | "fr" | "es" {
  const code = (input ?? "en").slice(0, 2).toLowerCase();
  if (code === "bg" || code === "fr" || code === "es") return code;
  return "en";
}

/**
 * Returns gallery URL for the "time to vote" image for given language.
 * Slugs in gallery are expected to be: timetovote-en, timetovote-bg, timetovote-fr, timetovote-es.
 */
export async function getTimeToVoteImageUrlForLang(
  lang?: string | null
): Promise<string | null> {
  const code = normalizeLang(lang);
  const slug = `timetovote-${code}`;

  if (imageUrlCache[slug]) return imageUrlCache[slug];

  try {
    const asset = await fetchPublicImageBySlug(slug);
    if (asset?.url) {
      imageUrlCache[slug] = asset.url;
      return asset.url;
    }
    return null;
  } catch (e) {
    if (e instanceof ApiError) {
      console.warn("Failed to load gallery image", slug, e.message);
    } else {
      console.warn("Failed to load gallery image", slug, e);
    }
    return null;
  }
}

const VOTE_MARK_URLS: Record<"en" | "bg" | "fr" | "es", string> = {
  en: "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/64f52559-9e57-46a9-9675-a34871a00cf2-voteMark.webp",
  bg: "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/0ddc2b45-99ef-4ec4-a178-0c99c4f8fca7-voteMark_bg.webp",
  fr: "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/0fe65544-5e2f-47a8-8da4-cc23127d3085-voteMark_fr.webp",
  es: "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/d70787f6-97e3-4e6f-a08e-05d471e31612-voteMark_es.webp",
};

/**
 * Returns the localized "vote mark" image URL for given language (sync, no API).
 */
export function getVoteMarkImageUrlForLang(lang?: string | null): string {
  const code = normalizeLang(lang);
  return VOTE_MARK_URLS[code];
}

/**
 * Preloads all localized vote mark images. Call early (e.g. in hero picker) so they are cached before VoteNowScreen.
 */
export async function preloadVoteMarkImages(): Promise<void> {
  const urls = Object.values(VOTE_MARK_URLS);
  await Promise.all(urls.map((url) => Image.prefetch(url)));
}

