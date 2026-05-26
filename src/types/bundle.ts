export interface IBundle {
  id: string;
  productId: string;
  title: string;
  slug: string;
  summary: string;
  description: string;
  image: string | { uri: string };
  background: string | { uri: string };
  price: number;
  currency: "USD" | "EUR";
  discountPrice: number;
  discountPercentage?: number;
  priceNote?: string;
  active: boolean;
  position: number;
  /** For chest-reveal bundles: the locked/closed state image shown before scroll-triggered reveal */
  closedImage?: string | { uri: string };
  /** For character-style bundles: vertical character art shown on the right side */
  characterImage?: string | { uri: string };
  isBestOffer: boolean;
  isFeatured: boolean;
  availableFrom?: Date;
  availableTo?: Date;
  timesBought?: number;
  lastBought?: Date;
}
