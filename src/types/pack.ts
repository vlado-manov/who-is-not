export interface IPack {
  id: string;
  productId: string;
  title: string;
  slug: string;
  summary: string;
  description: string;
  image: string;
  background: string;
  questionsNum: number;
  price: number;
  currency: "USD" | "EUR";
  priceNote?: string;
  isActive: boolean;
  isSeasonal: boolean;
  position: number;
  availableFrom?: Date;
  availableTo?: Date;
  timesBought?: number;
  lastBought?: Date;
}
