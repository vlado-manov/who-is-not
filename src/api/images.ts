import { apiGet, getApiBaseUrl } from "./client";
import { ApiError } from "./types";

export type GalleryImage = {
  id: string;
  name: string;
  slug: string;
  folder: string;
  url: string;
  mimeType: string;
  width: number | null;
  height: number | null;
  bytes: number | null;
  createdAt: string;
  updatedAt: string;
};

function resolveMediaUri(url: string): string {
  if (url.startsWith("/")) {
    return `${getApiBaseUrl()}${url}`;
  }
  return url;
}

function parseGalleryPayload(input: unknown): GalleryImage[] {
  if (!Array.isArray(input)) {
    throw new ApiError({
      code: "UNKNOWN_ERROR",
      message: "Invalid /images payload: expected array",
    });
  }
  return (input as GalleryImage[]).map((row) => ({
    ...row,
    url: resolveMediaUri(row.url),
  }));
}

export async function fetchGalleryImages(folder?: string): Promise<GalleryImage[]> {
  const path = folder ? `/images?folder=${encodeURIComponent(folder)}` : "/images";
  return apiGet<GalleryImage[]>(path, {
    skipAuth: true,
    parse: parseGalleryPayload,
  });
}

export async function fetchGalleryImageBySlug(slug: string): Promise<GalleryImage> {
  const row = await apiGet<GalleryImage>(`/images/${encodeURIComponent(slug)}`, {
    skipAuth: true,
  });
  return {
    ...row,
    url: resolveMediaUri(row.url),
  };
}
