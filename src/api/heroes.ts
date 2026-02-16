import { apiGet } from "./client";
import { ApiError } from "./types";
import { ICharacter } from "../types/character";
import { backgrounds } from "../../assets/backgrounds";
import { characters, character_avatars } from "../../assets/characters";

type CharacterDto = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  displayOrder: number;
  isActive: boolean;
  premium: boolean;
  isSeasonal: boolean;
  isPromo: boolean;
  price: number | null;
  discountPrice: number | null;
  profileImageUrl: string | null;
  mainImageUrl: string | null;
  winImages: Array<{ url: string; variant: string | null }>;
  loseImages: Array<{ url: string; variant: string | null }>;
  quotes: {
    selected: string[];
    nameSelected: string[];
    win: string[];
    lose: string[];
  };
};

function asImage(url?: string | null, fallback?: any) {
  return url ? { uri: url } : fallback;
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

export async function fetchCharacters(): Promise<ICharacter[]> {
  const rows = await apiGet<CharacterDto[]>("/characters", {
    skipAuth: true,
    parse: parseCharactersPayload,
  });

  return rows.map((row) => {
    const winImages = row.winImages.map((m) => ({ uri: m.url }));
    const loseImages = row.loseImages.map((m) => ({ uri: m.url }));

    const fallbackAvatar = character_avatars.screena;
    const fallbackMain = characters.screena;

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
      unlocked: !row.premium,
      background: backgrounds.bg007,
      main_image: asImage(row.mainImageUrl, fallbackMain),
      profileImage: asImage(row.profileImageUrl, fallbackAvatar),
      winImages: winImages.length ? winImages : [fallbackMain],
      loseImages: loseImages.length ? loseImages : [fallbackMain],
      quotes_selected:
        row.quotes.nameSelected.length > 0
          ? row.quotes.nameSelected
          : row.quotes.selected,
      winQuotes: row.quotes.win,
      loseQuotes: row.quotes.lose,
    };
  });
}
