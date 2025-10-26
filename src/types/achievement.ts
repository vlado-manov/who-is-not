import { ImageSourcePropType } from "react-native";

export interface IAchievement {
  id: number;
  name: string;
  slug: string;
  isDone: boolean;
  image: ImageSourcePropType;
  count: number;
  target: number;
  description: string;
  summary: string;
  unlockedAt?: number;
}
