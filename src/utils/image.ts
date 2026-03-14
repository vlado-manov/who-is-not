/**
 * Centralized image utilities for CDN-backed images.
 * All images are served as .webp from the CDN.
 * Set EXPO_PUBLIC_CDN_BASE to override (e.g. for R2 or custom CDN).
 */
import { Image } from "expo-image";

/** Change to https://cdn.mydomain.com when assets are migrated. */
const CDN_BASE =
  "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev";

/**
 * Returns a CDN URL for the given path.
 * Automatically appends .webp extension.
 * @example cdn('icons/home') => 'https://cdn.mydomain.com/icons/home.webp'
 */
export const cdn = (path: string): string =>
  `${CDN_BASE}/${path.replace(/^\/+|\/+$/g, "").replace(/\.webp$/i, "")}.webp`;

/**
 * Preloads an array of image paths from CDN.
 * Uses expo-image Image.prefetch for efficient caching.
 * @param paths - Array of paths (e.g. ['home/banner', 'icons/profile'])
 */
export async function preloadImages(
  paths: string[],
  cachePolicy: "disk" | "memory" | "memory-disk" = "memory-disk"
): Promise<void> {
  const urls = paths.map(cdn);
  await Image.prefetch(urls, { cachePolicy });
}
