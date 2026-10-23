import { AvatarId } from "../../assets/characters";
import { IAchievement } from "./achievement";
import { IPurchase } from "./purchase";

export type PremiumTier = "NONE" | "PREMIUM" | "EXPERT";

export interface IUser {
  id: string;
  name: string;
  email?: string;
  avatarId: AvatarId;
  provider?: "google" | "apple" | "local";
  isGuest: boolean;
  lang?: "bg" | "en" | "fr" | "es";
  isPremium?: boolean;
  /** Membership from the backend (NONE / PREMIUM / EXPERT). */
  premiumTier?: PremiumTier;
  premiumLifetime?: boolean;
  premiumExpiresAt?: string | null;
  /** A bought subscription that can be cancelled in the App Store / Google Play. */
  premiumManageable?: boolean;
  /** A bought monthly subscription is still billed (also under Expert forever). */
  hasActiveStoreSubscription?: boolean;
  /** Paid-for heroes (bundles included); owning one adds an online place. */
  purchasedCharacterIds?: string[];
  lastLoggedIn: number;
  createdAt: number;
  notificationsEnabled?: boolean;
  soundEnabled?: boolean;
  musicLevel?: number;
  sfxLevel?: number;
  customQuestions?: string[];
  purchases?: IPurchase[];
  purchasedProductIds?: string[];
  unlockedCharacterIds?: string[];
  achievements?: IAchievement[];
}
