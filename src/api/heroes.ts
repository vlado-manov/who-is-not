import { Image } from "expo-image";
import { apiGet, getApiBaseUrl } from "./client";
import { ApiError } from "./types";
import { ICharacter, IUnlockInfo } from "../types/character";
import { backgrounds } from "../../assets/backgrounds";
import type { ImageSourcePropType } from "react-native";

type MediaDto = { type: string; url: string; variant?: string | null };

type CharacterDto = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  displayOrder: number;
  isActive: boolean;
  premium: boolean;
  unlocked?: boolean;
  isSeasonal: boolean;
  isPromo: boolean;
  price: number | null;
  discountPrice: number | null;
  profileImageUrl: string | null;
  rateImageUrl?: string | null;
  mainImageUrl: string | null;
  secondaryImageUrl?: string | null;
  winnerImageUrl?: string | null;
  finalWinnerImageUrl?: string | null;
  finalLoserImageUrl?: string | null;
  deathmatchImageUrl?: string | null;
  deathImageUrl?: string | null;
  medias?: MediaDto[];
  winImages: Array<{ url: string; variant: string | null }>;
  loseImages: Array<{ url: string; variant: string | null }>;
  quotes: {
    selected: string[];
    nameSelected: string[];
    /** Backend returns by variant: { NORMAL: string[], PERFECT_BLUFF: string[], ... } */
    win: Record<string, string[]> | string[];
    lose: Record<string, string[]> | string[];
  };
  /** Newer backends: how it unlocks, and the hero's skins (same shape). */
  unlock?: IUnlockInfo;
  skins?: CharacterDto[];
  parentCharacterId?: string;
};

/** Resolves media URL - prepends API base when path is relative (e.g. /storage/...). */
function resolveMediaUri(url?: string | null): string | null {
  if (!url?.trim()) return null;
  if (url.startsWith("/")) {
    return `${getApiBaseUrl()}${url}`;
  }
  return url;
}

function asImage(url?: string | null, fallback?: any) {
  const uri = resolveMediaUri(url);
  return uri ? { uri } : fallback;
}

const VANESSA_SLUGS = ["silent_vanessa", "silent-vanessa", "vanessa"];
const SILENT_VANESSA_ID = "cmlt8yz96000etbesm149mii8";

function isVanessa(slug?: string | null): boolean {
  const s = slug?.toLowerCase().replace(/-/g, "_") ?? "";
  return VANESSA_SLUGS.some((v) => s === v || s.includes("vanessa"));
}

function getRateUrlFromRow(row: CharacterDto): string | null {
  return (
    row.rateImageUrl ?? row.medias?.find((m) => m.type === "RATE")?.url ?? null
  );
}

function parseCharactersPayload(input: unknown): CharacterDto[] {
  if (!Array.isArray(input)) {
    throw new ApiError({
      code: "UNKNOWN_ERROR",
      message: "Invalid /characters payload: expected array",
    });
  }
  return input as CharacterDto[];
}

export async function fetchCharacters(lang?: string, userId?: string): Promise<ICharacter[]> {
  const parts: string[] = [];
  if (lang) parts.push(`lang=${encodeURIComponent(lang)}`);
  if (userId) parts.push(`userId=${encodeURIComponent(userId)}`);
  const path = parts.length ? `/characters?${parts.join("&")}` : "/characters";
  const rows = await apiGet<CharacterDto[]>(path, {
    skipAuth: true,
    parse: parseCharactersPayload,
  });

  const vanessaRow = rows.find((r) => isVanessa(r.slug));
  const silentVanessaFallbackRow =
    rows.find((r) => r.id === SILENT_VANESSA_ID) ??
    rows.find((r) => r.name === "Silent Vanessa") ??
    vanessaRow;
  const vanessaRateUrl = vanessaRow ? getRateUrlFromRow(vanessaRow) : null;
  const fallbackAvatarFromDb = asImage(
    silentVanessaFallbackRow?.profileImageUrl
  );
  const fallbackMainFromDb = asImage(silentVanessaFallbackRow?.mainImageUrl);

  const mapRow = (row: CharacterDto): ICharacter => {
    const fallbackAvatar = fallbackAvatarFromDb;
    const fallbackMain = fallbackMainFromDb;

    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      description: row.description ?? "",
      isActive: row.isActive,
      free: !row.premium,
      adFree: false,
      premium: row.premium,
      isSeasonal: row.isSeasonal,
      isPromo: row.isPromo,
      price: row.price ?? 0,
      discountPrice: row.discountPrice ?? 0,
      unlocked: row.unlocked ?? !row.premium,
      background: backgrounds.bg023,
      main_image: asImage(row.mainImageUrl, fallbackMain),
      secondaryImage: asImage(row.secondaryImageUrl),
      profileImage: asImage(row.profileImageUrl, fallbackAvatar),
      winnerImage: asImage(row.winnerImageUrl, null),
      finalWinnerImage: asImage(row.finalWinnerImageUrl, null),
      finalLoserImage: asImage(row.finalLoserImageUrl, null),
      deathmatch_image: asImage(row.deathmatchImageUrl, null),
      deathImage: asImage(row.deathImageUrl, null),
      rateImage: (() => {
        const rateUrl = getRateUrlFromRow(row) ?? vanessaRateUrl;
        return asImage(rateUrl, null);
      })(),
      winImages: (() => {
        const arr = row.winImages
          .map((m) => resolveMediaUri(m.url))
          .filter((u): u is string => Boolean(u));
        return arr.length ? arr.map((uri) => ({ uri })) : [fallbackMain];
      })(),
      loseImages: (() => {
        const arr = row.loseImages
          .map((m) => resolveMediaUri(m.url))
          .filter((u): u is string => Boolean(u));
        return arr.length ? arr.map((uri) => ({ uri })) : [fallbackMain];
      })(),
      winImagesByVariant: (() => {
        if (!row.winImages?.length) return undefined;
        const map: Record<string, ImageSourcePropType[]> = {};
        for (const media of row.winImages) {
          const uri = resolveMediaUri(media.url);
          if (!uri) continue;
          const key = media.variant ?? "NORMAL";
          if (!map[key]) {
            map[key] = [];
          }
          map[key].push({ uri });
        }
        return Object.keys(map).length ? map : undefined;
      })(),
      loseImagesByVariant: (() => {
        if (!row.loseImages?.length) return undefined;
        const map: Record<string, ImageSourcePropType[]> = {};
        for (const media of row.loseImages) {
          const uri = resolveMediaUri(media.url);
          if (!uri) continue;
          const key = media.variant ?? "NORMAL";
          if (!map[key]) {
            map[key] = [];
          }
          map[key].push({ uri });
        }
        return Object.keys(map).length ? map : undefined;
      })(),
      quotes_nameSelected: row.quotes.nameSelected?.length
        ? row.quotes.nameSelected
        : [],
      quotes_selected: row.quotes.selected?.length ? row.quotes.selected : [],
      winQuotes: Array.isArray(row.quotes.win)
        ? row.quotes.win
        : Object.values(row.quotes.win as Record<string, string[]>).reduce<
            string[]
          >((acc, list) => acc.concat(list), []),
      loseQuotes: Array.isArray(row.quotes.lose)
        ? row.quotes.lose
        : Object.values(row.quotes.lose as Record<string, string[]>).reduce<
            string[]
          >((acc, list) => acc.concat(list), []),
      winQuotesByVariant:
        typeof row.quotes.win === "object" && !Array.isArray(row.quotes.win)
          ? (row.quotes.win as Record<string, string[]>)
          : undefined,
      loseQuotesByVariant:
        typeof row.quotes.lose === "object" && !Array.isArray(row.quotes.lose)
          ? (row.quotes.lose as Record<string, string[]>)
          : undefined,
      unlock: row.unlock,
    };
  };

  return rows.map((row) => {
    const hero = mapRow(row);
    hero.skins = (row.skins ?? []).map((skinRow) =>
      completeSkin(hero, skinRow, mapRow(skinRow)),
    );
    return hero;
  });
}

/**
 * A skin with everything it did not upload taken from its hero, media type by
 * media type and quotes category by category, so every screen can use it as a
 * full hero.
 */
function completeSkin(
  hero: ICharacter,
  row: CharacterDto,
  skin: ICharacter,
): ICharacter {
  const has = (url?: string | null) => Boolean(url?.trim());
  const pick = <T,>(own: boolean, mine: T, base: T): T => (own ? mine : base);
  return {
    ...skin,
    parentCharacterId: hero.id,
    background: hero.background,
    main_image: pick(has(row.mainImageUrl), skin.main_image, hero.main_image),
    secondaryImage: pick(has(row.secondaryImageUrl), skin.secondaryImage, hero.secondaryImage),
    profileImage: pick(has(row.profileImageUrl), skin.profileImage, hero.profileImage),
    rateImage: pick(has(getRateUrlFromRow(row)), skin.rateImage, hero.rateImage),
    winnerImage: pick(has(row.winnerImageUrl), skin.winnerImage, hero.winnerImage),
    finalWinnerImage: pick(has(row.finalWinnerImageUrl), skin.finalWinnerImage, hero.finalWinnerImage),
    finalLoserImage: pick(has(row.finalLoserImageUrl), skin.finalLoserImage, hero.finalLoserImage),
    deathmatch_image: pick(has(row.deathmatchImageUrl), skin.deathmatch_image, hero.deathmatch_image),
    deathImage: pick(has(row.deathImageUrl), skin.deathImage, hero.deathImage),
    winImages: pick(row.winImages.length > 0, skin.winImages, hero.winImages),
    winImagesByVariant: pick(row.winImages.length > 0, skin.winImagesByVariant, hero.winImagesByVariant),
    loseImages: pick(row.loseImages.length > 0, skin.loseImages, hero.loseImages),
    loseImagesByVariant: pick(row.loseImages.length > 0, skin.loseImagesByVariant, hero.loseImagesByVariant),
    quotes_nameSelected: pick(skin.quotes_nameSelected.length > 0, skin.quotes_nameSelected, hero.quotes_nameSelected),
    quotes_selected: pick(skin.quotes_selected.length > 0, skin.quotes_selected, hero.quotes_selected),
    winQuotes: pick(skin.winQuotes.length > 0, skin.winQuotes, hero.winQuotes),
    winQuotesByVariant: pick(skin.winQuotes.length > 0, skin.winQuotesByVariant, hero.winQuotesByVariant),
    loseQuotes: pick(skin.loseQuotes.length > 0, skin.loseQuotes, hero.loseQuotes),
    loseQuotesByVariant: pick(skin.loseQuotes.length > 0, skin.loseQuotesByVariant, hero.loseQuotesByVariant),
  };
}

function getImageUri(
  source: ImageSourcePropType | null | undefined
): string | null {
  if (!source || typeof source === "number") return null;
  if (Array.isArray(source)) return source[0]?.uri ?? null;
  return (source as { uri?: string }).uri ?? null;
}

function collectUrisFromImages(
  images: ImageSourcePropType[] | undefined
): string[] {
  if (!images?.length) return [];
  return images
    .map((img) => getImageUri(img))
    .filter((u): u is string => Boolean(u));
}

export function collectCharacterImageUris(list: ICharacter[]): string[] {
  const uris: string[] = [];
  for (const hero of list) {
    const main = getImageUri(hero.main_image);
    const profile = getImageUri(hero.profileImage);
    const rate = getImageUri(hero.rateImage);
    const winner = getImageUri(hero.winnerImage);
    const finalWinner = getImageUri(hero.finalWinnerImage);
    const finalLoser = getImageUri(hero.finalLoserImage);
    if (main) uris.push(main);
    if (profile) uris.push(profile);
    if (rate) uris.push(rate);
    if (winner) uris.push(winner);
    if (finalWinner) uris.push(finalWinner);
    if (finalLoser) uris.push(finalLoser);
    uris.push(...collectUrisFromImages(hero.winImages));
    uris.push(...collectUrisFromImages(hero.loseImages));
    if (hero.winImagesByVariant) {
      for (const arr of Object.values(hero.winImagesByVariant)) {
        uris.push(...collectUrisFromImages(arr));
      }
    }
    if (hero.loseImagesByVariant) {
      for (const arr of Object.values(hero.loseImagesByVariant)) {
        uris.push(...collectUrisFromImages(arr));
      }
    }
  }
  return [...new Set(uris)];
}

/** Prefetch all character media: profile, main, rate, win, lose. Call during app bootstrap. */
export async function prefetchCharacterImages(
  list: ICharacter[]
): Promise<void> {
  const unique = collectCharacterImageUris(list);
  await Promise.all(
    unique.map((uri) => Image.prefetch(uri).catch(() => false))
  );
}
