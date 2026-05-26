/**
 * useStorePurchase — encapsulates the IAP purchase flow:
 *   1. Ensure IAP connection is initialized
 *   2. Trigger native purchase sheet
 *   3. Validate with backend
 *   4. Update auth store (isPremium, unlockedCharacterIds)
 *   5. Return result to UI
 */
import { useState, useCallback, useEffect } from "react";
import { IAPService, type IAPPurchaseResult } from "../services/iapService";
import { type IapSku } from "../services/iapConstants";
import { useAuthStore } from "../store/useUserStore";

type PurchaseState = "idle" | "loading" | "success" | "error";

export function useStorePurchase() {
  const [state, setState] = useState<PurchaseState>("idle");
  const [lastResult, setLastResult] = useState<IAPPurchaseResult | null>(null);
  const userId = useAuthStore((s) => s.user.id);
  const patchUser = useAuthStore((s) => s.patchUser);

  useEffect(() => {
    // In a real EAS build this initialises the native IAP SDK.
    // In Expo Go / development it's a no-op.
    void IAPService.init();
  }, []);

  const purchase = useCallback(
    async (sku: IapSku): Promise<IAPPurchaseResult> => {
      setState("loading");
      try {
        const result = await IAPService.purchase(sku, userId);
        setLastResult(result);
        if (result.success && result.grant) {
          // Apply granted entitlements to the auth store
          const { grant } = result;
          const patch: Parameters<typeof patchUser>[0] = (prev) => {
            const next: typeof prev = { ...prev };
            if (grant.isPremium) next.isPremium = true;
            if (grant.unlockedCharacterIds?.length) {
              next.unlockedCharacterIds = [
                ...new Set([
                  ...(prev.unlockedCharacterIds ?? []),
                  ...(grant.unlockedCharacterIds ?? []),
                ]),
              ];
            }
            return next;
          };
          patchUser(patch);
          setState("success");
        } else {
          setState("error");
        }
        return result;
      } catch (e) {
        const result: IAPPurchaseResult = {
          success: false,
          sku,
          error: e instanceof Error ? e.message : "Unknown error",
        };
        setLastResult(result);
        setState("error");
        return result;
      }
    },
    [userId, patchUser]
  );

  const restore = useCallback(async () => {
    setState("loading");
    try {
      const results = await IAPService.restorePurchases(userId);
      const anySuccess = results.some((r) => r.success);
      // Merge all grants
      const allCharIds = results.reduce<string[]>(
        (acc, r) => acc.concat(r.grant?.unlockedCharacterIds ?? []),
        []
      );
      const hasPremium = results.some((r) => r.grant?.isPremium);
      if (anySuccess) {
        patchUser((prev) => {
          const next = { ...prev };
          if (hasPremium) next.isPremium = true;
          if (allCharIds.length) {
            next.unlockedCharacterIds = [
              ...new Set([...(prev.unlockedCharacterIds ?? []), ...allCharIds]),
            ];
          }
          return next;
        });
        setState("success");
      } else {
        setState("idle");
      }
    } catch {
      setState("error");
    }
  }, [userId, patchUser]);

  const reset = useCallback(() => {
    setState("idle");
    setLastResult(null);
  }, []);

  return { state, lastResult, purchase, restore, reset, isLoading: state === "loading" };
}
