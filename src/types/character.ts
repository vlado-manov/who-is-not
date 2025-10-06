export interface ICharacter {
  id: string;
  name: string;
  slug: string;
  free: boolean;
  adFree: boolean;
  price: number;
  unlocked: boolean;
  discountPrice: number;
  background: string;
  main_image: string;
  secondaryImage: string;
  profileImage: string;
  winImages: string[];
  loseImages: string[];
  quotes_selected: string[];
  winQuotes: string[];
  loseQuotes: string[];
  conditions?: { minLevel?: number; premiumOnly?: boolean };
}
