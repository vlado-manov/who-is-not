export interface IPurchase {
  id: string;
  productId: string;
  title: string;
  price: number;
  currency: "USD" | "EUR";
  date: number;
}
