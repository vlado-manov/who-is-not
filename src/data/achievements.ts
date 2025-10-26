import { achievement_images } from "../../assets/images";
import { IAchievement } from "../types/achievement";

export const ACHIEVEMENTS: IAchievement[] = [
  {
    id: 1,
    name: "Early Bird, or Just Bored?",
    slug: "login_3_days",
    description:
      "Log in 3 days in a row. We admire your consistency... or your insomnia.",
    summary: "",
    isDone: false,
    count: 0,
    target: 3,
    image: achievement_images.achievement01,
  },
  {
    id: 2,
    name: "Serial Winner",
    slug: "win_3_games",
    description: "Win 3 games. You’re either good... or your friends are bad.",
    summary: "",
    isDone: false,
    count: 0,
    target: 3,
    image: achievement_images.achievement02,
  },
  {
    id: 3,
    name: "Certified Dominator",
    slug: "win_10_games",
    description: "Win 10 games. Are you proud, or just unemployed?",
    summary: "",
    isDone: false,
    count: 0,
    target: 10,
    image: achievement_images.achievement03,
  },
  {
    id: 4,
    name: "Flawless Mindreader",
    slug: "perfect_round_5",
    description:
      "Stay flawless for 5 rounds straight. Telepathy? Witchcraft? We don’t judge.",
    summary: "",
    isDone: false,
    count: 0,
    target: 5,
    image: achievement_images.achievement01,
  },
  {
    id: 5,
    name: "The Comeback Meme",
    slug: "comeback_win",
    description: "Lose horribly, then win the next match. Classic movie arc.",
    summary: "",
    isDone: false,
    count: 0,
    target: 1,
    image: achievement_images.achievement03,
  },
  {
    id: 6,
    name: "No Friends Left",
    slug: "betray_friends",
    description:
      "Successfully betray a friend three times. Hope they still like you.",
    summary: "",
    isDone: false,
    count: 0,
    target: 3,
    image: achievement_images.achievement02,
  },
];
