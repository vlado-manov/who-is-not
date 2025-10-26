import { ImageSourcePropType } from "react-native";

export interface ICharacter {
  id: string;
  name: string;
  slug: string;
  free: boolean;
  adFree: boolean;
  price: number;
  unlocked: boolean;
  discountPrice: number;
  background: ImageSourcePropType;
  main_image: ImageSourcePropType;
  secondaryImage?: ImageSourcePropType | null;
  profileImage: ImageSourcePropType;
  winImages: ImageSourcePropType[];
  loseImages: ImageSourcePropType[];
  quotes_selected: string[];
  winQuotes: string[];
  loseQuotes: string[];
  conditions?: { minLevel?: number; premiumOnly?: boolean };
  playedWith?: number;
}
