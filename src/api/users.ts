import { apiGet, apiPost } from "./client";

export type LoginUserResponse = {
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
