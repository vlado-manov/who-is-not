export interface IBundle {
  id: string;
  productId: string;
  title: string;
  slug: string;
  summary: string;
  description: string;
  image: string;
  background: string;
  price: number;
  currency: "USD" | "EUR";
  discountPrice: number;
  discountPercentage?: number;
  priceNote?: string;
  active: boolean;
  position: number;
  isBestOffer: boolean;
  isFeatured: boolean;
  availableFrom?: Date;
  availableTo?: Date;
  timesBought?: number;
  lastBought?: Date;
}
