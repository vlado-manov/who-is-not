// src/services/subscriptionManagement.ts
import { Linking, Platform } from "react-native";

/** Android application id (app.json `android.package`). */
const ANDROID_PACKAGE = "com.vladimirmanov.whoisnot";

/**
 * The store page where the player manages or cancels their subscription. An
 * app cannot cancel a subscription itself: Apple and Google own it.
 */
export function getManageSubscriptionUrl(): string {
  if (Platform.OS === "ios") return "https://apps.apple.com/account/subscriptions";
  return `https://play.google.com/store/account/subscriptions?package=${ANDROID_PACKAGE}`;
}

export async function openManageSubscription(): Promise<void> {
  try {
    await Linking.openURL(getManageSubscriptionUrl());
  } catch {
    // No store app / browser: nothing more we can do from here.
  }
}
