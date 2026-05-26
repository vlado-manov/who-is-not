import { backgrounds } from "../../assets/backgrounds";
import { IBundle } from "../types/bundle";

export const BUNDLES: IBundle[] = [
  {
    id: "bundle_troublemakers",
    productId: "com.whoisnot.bundle.troublemakers",
    slug: "bundle_troublemakers",
    title: "The Troublemakers",
    summary: "Dr. Wrong · Tedimechov · Mr. Goodtime",
    description:
      "Unlock the three most chaotic heroes in one shot. Perfect for parties that like it spicy.",
    image: "",
    characterImage: "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/819c285c-31e5-4e09-a006-744eade32863-troublemakers.webp",
    background: backgrounds.bg007,
    price: 5.97,
    currency: "USD",
    discountPrice: 3.99,
    discountPercentage: 33,
    priceNote: "1 Hero Free! 🎁",
    active: true,
    position: 1,
    isBestOffer: false,
    isFeatured: true,
  },
  {
    id: "bundle_all_heroes",
    productId: "com.whoisnot.bundle.all_heroes",
    slug: "bundle_all_heroes",
    title: "All Heroes Pack",
    summary: "Every premium hero — now & future drops",
    description:
      "The ultimate collector's bundle. Unlock every premium hero in the game at the best possible price.",
    image: "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/d9bcc35d-ea42-42ba-8e18-b6aaf3595f0f-bundleImage.webp",
    closedImage: "https://pub-ec31b9c7bbbc404ebb58e9011a72c729.r2.dev/images/gallery/f75f9d31-a4b4-4e50-85fe-8a61282c762f-bundleImageClosed.webp",
    background: backgrounds.bg006,
    price: 15.92,
    currency: "USD",
    discountPrice: 10.99,
    discountPercentage: 31,
    priceNote: "Save 31%",
    active: true,
    position: 2,
    isBestOffer: true,
    isFeatured: true,
  },
];
