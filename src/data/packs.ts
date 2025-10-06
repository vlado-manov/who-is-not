import { backgrounds } from "../../assets/backgrounds";
import { images } from "../../assets/images";
import { IPack } from "../types/pack";

export const PACKS: IPack[] = [
  {
    id: "1",
    productId: "1a",
    title: "Festival pack",
    slug: "festival_pack",
    summary: "+40 NEW festival fun questions",
    description:
      "+40 NEW festival related fun questions. Elevate your festival experience to another level",
    image: images.spookyPack,
    background: backgrounds.bg002,
    questionsNum: 40,
    price: 3.99,
    currency: "USD",
    isActive: true,
    isSeasonal: false,
    position: 1,
  },
  {
    id: "2",
    productId: "2a",
    title: "Spooky pack",
    slug: "spooky_pack",
    summary: "+40 NEW spooky fun questions",
    description:
      "+40 NEW halloween related fun questions. Elevate your halloween experience to another level",
    image: images.spookyPack,
    background: backgrounds.bg017,
    questionsNum: 40,
    price: 3.99,
    currency: "USD",
    isActive: true,
    isSeasonal: false,
    position: 1,
  },
  {
    id: "3",
    productId: "3a",
    title: "Christmas pack",
    slug: "christmas_pack",
    summary: "+40 NEW Christmas fun questions",
    description:
      "+40 NEW christmas related fun questions. Elevate your christmas experience to another level",
    image: images.christmasPack,
    background: backgrounds.bg012,
    questionsNum: 40,
    price: 3.99,
    currency: "USD",
    isActive: true,
    isSeasonal: false,
    position: 1,
  },
];
