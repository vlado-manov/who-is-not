/**
 * IAP Service stub — the real native purchase flow (react-native-iap or
 * react-native-purchases) is only available in EAS / bare-workflow builds.
 *
 * In Expo Go this stub is used so the store UI renders correctly.
 * Purchases call the backend verify endpoint directly (useful for testing
 * admin-granted purchases). Wire up a real IAP SDK here when building for
 * App Store / Google Play.
 */
import { Platform } from "react-native";
import { type IapSku } from "./iapConstants";
import { verifyIapReceipt } from "../api/store";

export type IAPPurchaseResult = {
  success: boolean;
  sku: string;
  grant?: {
    type: "character" | "bundle" | "subscription";
    unlockedCharacterIds?: string[];
    isPremium?: boolean;
  };
  error?: string;
};

class _IAPService {
  /** Always false in Expo Go / development; set to true in a bare EAS build. */
  readonly available = false;

  async init(): Promise<void> {
    // No-op — native IAP SDK not present.
  }

  getLocalizedPrice(_sku: string): string | null {
    return null;
  }

  /**
   * In a production EAS build this triggers the native purchase sheet.
   * Here it calls the backend directly so admin-granted test purchases work.
   */
  async purchase(sku: IapSku, userId: string): Promise<IAPPurchaseResult> {
    try {
      // In development we skip receipt validation and ask the backend to
      // grant the item for the user (admin-grant path).
      const result = await verifyIapReceipt({
        userId,
        sku,
        platform: Platform.OS === "ios" ? "APPLE" : "GOOGLE",
        receipt: "__DEV_STUB__",
        transactionId: `dev_${Date.now()}`,
      });
      return { success: result.success, sku, grant: result.grant, error: result.error };
    } catch {
      return {
        success: false,
        sku,
        error:
          "In-app purchases require an App Store / Google Play build. " +
          "Use EAS Build to enable real purchases.",
      };
    }
  }

  async restorePurchases(userId: string): Promise<IAPPurchaseResult[]> {
    try {
      const result = await verifyIapReceipt({
        userId,
        sku: "restore" as IapSku,
        platform: Platform.OS === "ios" ? "APPLE" : "GOOGLE",
        receipt: "__RESTORE__",
        transactionId: "",
        restore: true,
      });
      return [{ success: result.success, sku: "restore", grant: result.grant }];
    } catch {
      return [{ success: false, sku: "restore", error: "Restore not available in Expo Go." }];
    }
  }

  async disconnect(): Promise<void> {
    // No-op.
  }
}

export const IAPService = new _IAPService();
