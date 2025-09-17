export interface Character {
  id: string;
  name: string;
  free: boolean;
  background: string;
  mainImage: string;
  secondaryImage: string;
  winImages: string[];
  loseImages: string[];
  quotes: string[];
  winQuotes: string[];
  loseQuotes: string[];
  conditions?: { minLevel?: number; premiumOnly?: boolean };
}
