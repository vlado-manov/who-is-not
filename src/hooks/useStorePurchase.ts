/**
 * useStorePurchase — the store connection and "Restore purchases".
 * Buying goes through services/purchases.ts (purchaseItem), the one purchase
 * path for heroes, skins, bundles and membership; restoring applies grants the
 * same way (membership tier, heroes) through the auth store.
 */
import { useState, useCallback, useEffect } from "react";
import { IAPService } from "../services/iapService";
import { restorePurchases } from "../services/purchases";
import { useAuthStore } from "../store/useUserStore";

type RestoreState = "idle" | "loading" | "success" | "error";

export function useStorePurchase() {
  const [state, setState] = useState<RestoreState>("idle");
  const userId = useAuthStore((s) => s.user.id);

  useEffect(() => {
    // In a real EAS build this initialises the native IAP SDK.
    // In Expo Go / development it's a no-op.
    void IAPService.init();
  }, []);

  const restore = useCallback(async () => {
    setState("loading");
    try {
      const restored = await restorePurchases(userId);
      setState(restored ? "success" : "idle");
    } catch {
      setState("error");
    }
  }, [userId]);

  return { state, restore, isLoading: state === "loading" };
}
