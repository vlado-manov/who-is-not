import { AVPlaybackSource } from "expo-av";
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
  main_sound?: AVPlaybackSource;
  secondaryImage?: ImageSourcePropType | null;
  standingImage?: ImageSourcePropType;
  standingBackground?: ImageSourcePropType;
  profileImage: ImageSourcePropType;
  winImages: ImageSourcePropType[];
  winVideo?: any;
  loseImages: ImageSourcePropType[];
  loseVideo?: any;
  quotes_selected: string[];
  winQuotes: string[];
  loseQuotes: string[];
  playedWith?: number;
}
