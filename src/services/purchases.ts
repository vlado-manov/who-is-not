// src/services/purchases.ts
import { IAPService } from "./iapService";
import { useDemoUnlocks } from "../store/useDemoUnlocks";

/**
 * Demo purchases: every purchase succeeds without payment and unlocks for this
 * session only. ON until the Apple / Google accounts exist; set
 * EXPO_PUBLIC_DEMO_PURCHASES=false to use the real store flow.
 * Must be OFF in any build sent to the App Store / Google Play.
 */
export const DEMO_PURCHASES = process.env.EXPO_PUBLIC_DEMO_PURCHASES !== "false";

const DEMO_DELAY_MS = 700;

export type PurchaseItem = {
  kind: "HERO" | "SKIN" | "BUNDLE";
  /** Heroes / skins the purchase unlocks. */
  characterIds: string[];
  /** Backend product id and the Apple / Google id, when they exist. */
  productId: string | null;
  storeProductId: string | null;
};

export type PurchaseOutcome = {
  success: boolean;
  unlockedIds: string[];
  error?: string;
};

/**
 * The one way the picker and the store buy something. The UI never knows
 * whether it was a demo or a real store purchase.
 */
export async function purchaseItem(
  item: PurchaseItem,
  userId: string,
): Promise<PurchaseOutcome> {
  if (DEMO_PURCHASES) {
    await new Promise<void>((resolve) => setTimeout(() => resolve(), DEMO_DELAY_MS));
    useDemoUnlocks.getState().add(item.characterIds);
    return { success: true, unlockedIds: item.characterIds };
  }
  const sku = item.storeProductId ?? item.productId;
  if (!sku) {
    // No message: the screen shows its translated "purchase failed" text.
    return { success: false, unlockedIds: [] };
  }
  const result = await IAPService.purchase(sku, userId);
  return {
    success: result.success,
    unlockedIds: result.grant?.unlockedCharacterIds ?? [],
    error: result.error,
  };
}
