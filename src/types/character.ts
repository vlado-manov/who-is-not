import { ImageSourcePropType } from "react-native";

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
}
