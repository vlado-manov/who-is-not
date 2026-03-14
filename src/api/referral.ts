import { apiGet, apiPost } from "./client";

export type ReferralMeResponse = {
  code: string;
  link: string;
  campaigns: Array<{
    id: string;
    slug: string;
    title: string;
    description?: string;
    rewardType: string;
    requiredCount: number;
    currentCount: number;
    rewardUnlocked: boolean;
  }>;
};

export type ReferralStatsResponse = {
  clicks: number;
  conversions: number;
  rewardsUnlocked: number;
  byCampaign: Array<{
    slug: string;
    title: string;
    currentCount: number;
    requiredCount: number;
    rewardUnlocked: boolean;
  }>;
};

export type ReferralClickPayload = {
  code: string;
  deviceId?: string;
  platform?: string;
  metadata?: Record<string, unknown>;
};

const PENDING_REFERRAL_KEY = "pending_referral_code";

export async function getReferralMe(userId: string) {
  return apiGet<ReferralMeResponse>(`/referral/me/${userId}`, { skipAuth: true });
}

export async function getReferralStats(userId: string) {
  return apiGet<ReferralStatsResponse>(`/referral/stats/${userId}`, { skipAuth: true });
}

export async function postReferralClick(payload: ReferralClickPayload) {
  return apiPost<{ ok: boolean }>("/referral/click", payload, { skipAuth: true });
}

export function getStoredReferralCode(): Promise<string | null> {
  return import("@react-native-async-storage/async-storage").then(
    (AsyncStorage) =>
      AsyncStorage.default.getItem(PENDING_REFERRAL_KEY) as Promise<string | null>
  );
}

export function setStoredReferralCode(code: string): Promise<void> {
  return import("@react-native-async-storage/async-storage").then((AsyncStorage) =>
    AsyncStorage.default.setItem(PENDING_REFERRAL_KEY, code)
  );
}

export function clearStoredReferralCode(): Promise<void> {
  return import("@react-native-async-storage/async-storage").then((AsyncStorage) =>
    AsyncStorage.default.removeItem(PENDING_REFERRAL_KEY)
  );
}
