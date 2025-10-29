import { ImageSourcePropType } from "react-native";

export interface ICharacter {
  id: string;
  name: string;
  slug: string;
  free: boolean;
  adFree: boolean;
  isActive: boolean;
  media?: string;
  price: number;
  discountPrice: number;
  unlocked: boolean;
  background: ImageSourcePropType;
  main_image: ImageSourcePropType;
  secondaryImage?: ImageSourcePropType | null;
  profileImage: ImageSourcePropType;
  winImages: ImageSourcePropType[];
  loseImages: ImageSourcePropType[];
  quotes_selected: string[];
  winQuotes: string[];
  loseQuotes: string[];
  playedWith?: number;
}
