import { AvatarId } from "../../assets/characters";
import { IAchievement } from "./achievement";
import { IPurchase } from "./purchase";

export interface IUser {
  id: string;
  name: string;
  email?: string;
  avatarId: AvatarId;
  provider?: "google" | "apple";
  isGuest: boolean;
  lang?: "bg" | "en" | "fr" | "es";
  isPremium?: boolean;
  lastLoggedIn: number;
  createdAt: number;
  notificationsEnabled?: boolean;
  soundEnabled?: boolean;
  musicLevel?: number;
  sfxLevel?: number;
  customQuestions?: string[];
  purchases?: IPurchase[];
  achievements?: IAchievement[];
}
