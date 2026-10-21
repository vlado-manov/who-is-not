import { ImageSourcePropType } from "react-native";

/** How a premium hero or a skin is unlocked (decided by the server). */
export type UnlockMode = "FREE" | "BUY" | "ACTION" | "BUY_OR_ACTION";

export interface IUnlockInfo {
  mode: UnlockMode;
  /** Backend product id (purchases), and the Apple/Google id once it exists. */
  productId: string | null;
  storeProductId: string | null;
  /** In cents. */
  price: number | null;
  discountPrice: number | null;
  /** For ACTION / BUY_OR_ACTION: e.g. games played to the end, 3 of 10. */
  action: { type: "GAMES_COMPLETED"; target: number; progress: number } | null;
}

export interface ICharacter {
  id: string;
  name: string;
  description?: string;
  slug: string;
  premium?: boolean;
  isSeasonal?: boolean;
  isPromo?: boolean;
  free: boolean;
  adFree: boolean;
  isActive: boolean;
  media?: string;
  price: number;
  discountPrice: number;
  unlocked: boolean;
  color?: string;
  background: ImageSourcePropType;
  main_image: ImageSourcePropType;
  secondaryImage?: ImageSourcePropType | null;
  standingImage?: ImageSourcePropType;
  standingBackground?: ImageSourcePropType;
  profileImage: ImageSourcePropType;
  /** Rate/number question result image. Fallback to Silent Vanessa if missing. */
  rateImage?: ImageSourcePropType | null;
  /** Optional image shown when the character wins a round (RevealScreen WINNER pose). */
  winnerImage?: ImageSourcePropType | null;
  /** Optional end-game winner image. Empty when not uploaded. */
  finalWinnerImage?: ImageSourcePropType | null;
  /** Optional end-game loser image. Empty when not uploaded. */
  finalLoserImage?: ImageSourcePropType | null;
  /** Optional image shown during the deathmatch guessing game. */
  deathmatch_image?: ImageSourcePropType | null;
  /** Optional ghost/death image shown on the PlayerDeath screen. */
  deathImage?: ImageSourcePropType | null;
  winImages: ImageSourcePropType[];
  winVideo?: any;
  loseImages: ImageSourcePropType[];
  loseVideo?: any;
  /** Shown after player selects hero (before name input). Prefer nameSelected from API. */
  quotes_nameSelected: string[];
  /** Shown after player enters name. Random one from selected. */
  quotes_selected: string[];
  winQuotes: string[];
  loseQuotes: string[];
  /** Win quotes by variant (PERFECT_BLUFF, BARELY_SOLD_IT, NORMAL). Used for reveal screen. */
  winQuotesByVariant?: Record<string, string[]>;
  /** Lose quotes by variant (COOKED, NEARLY_THERE, NORMAL). Used for reveal screen. */
  loseQuotesByVariant?: Record<string, string[]>;
  /** Win images by variant (PERFECT_BLUFF, BARELY_SOLD_IT, NORMAL). Used for reveal screen. */
  winImagesByVariant?: Record<string, ImageSourcePropType[]>;
  /** Lose images by variant (COOKED, NEARLY_THERE, NORMAL). Used for reveal screen. */
  loseImagesByVariant?: Record<string, ImageSourcePropType[]>;
  playedWith?: number;
  /** How it unlocks (missing on old cached data: treat as FREE / BUY by `premium`). */
  unlock?: IUnlockInfo;
  /** Alternative looks of this hero. Picking one still takes the whole hero. */
  skins?: ICharacter[];
  /** Set on a skin: the hero it belongs to. */
  parentCharacterId?: string;
}
