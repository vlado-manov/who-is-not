import { apiGet, apiPost } from "./client";
import type { PremiumTier } from "../types/user";

/** Membership fields every user response carries. */
export type MembershipFields = {
  isPremium: boolean;
  premiumTier?: PremiumTier;
  premiumLifetime?: boolean;
  premiumExpiresAt?: string | null;
  premiumManageable?: boolean;
  hasActiveStoreSubscription?: boolean;
  purchasedCharacterIds?: string[];
};

export type LoginUserResponse = MembershipFields & {
  id: string;
  name: string;
  email?: string | null;
  provider?: string | null;
  isGuest: boolean;
  lang?: string | null;
  isPremium: boolean;
  createdAt: string;
  lastLoggedIn: string;
  unlockedCharacterIds: string[];
  purchasedProductIds: string[];
};

/** The user's current membership (for refreshing after a purchase or on focus). */
export async function fetchMembership(userId: string) {
  return apiGet<MembershipFields>(`/users/${encodeURIComponent(userId)}`);
}

export async function loginWithEmailPassword(email: string, password: string) {
  return apiPost<LoginUserResponse>(
    "/users/login",
    { email, password },
    { skipAuth: true },
  );
}

export async function fetchDevLoginUsers() {
  return apiGet<{ items: Array<{ name: string; email: string }> }>(
    "/users/dev-login-users",
    { skipAuth: true },
  );
}
