// src/services/purchases.ts
import { IAPService } from "./iapService";
import { TIER_PLANS, type TierPlan } from "./iapConstants";
import { useDemoUnlocks } from "../store/useDemoUnlocks";
import { useAuthStore } from "../store/useUserStore";
import { useHeroesStore } from "../store/useHeroesStore";

/** Every hero and outfit (Expert unlocks them all). */
function allHeroAndSkinIds(): string[] {
  return useHeroesStore
    .getState()
    .heroes.reduce<string[]>(
      (ids, hero) => ids.concat(hero.id, (hero.skins ?? []).map((s) => s.id)),
      [],
    );
}

/**
 * Demo purchases: every purchase succeeds without payment and unlocks for this
 * session only. ON until the Apple / Google accounts exist; set
 * EXPO_PUBLIC_DEMO_PURCHASES=false to use the real store flow.
 * Must be OFF in any build sent to the App Store / Google Play.
 */
export const DEMO_PURCHASES = process.env.EXPO_PUBLIC_DEMO_PURCHASES !== "false";

const DEMO_DELAY_MS = 700;

export type PurchaseItem =
  | {
      kind: "HERO" | "SKIN" | "BUNDLE";
      /** Heroes / skins the purchase unlocks. */
      characterIds: string[];
      /** Backend product id and the Apple / Google id, when they exist. */
      productId: string | null;
      storeProductId: string | null;
    }
  | {
      /** A membership: Premium monthly, Expert monthly or Expert lifetime. */
      kind: "TIER";
      plan: TierPlan;
    };

export type PurchaseOutcome = {
  success: boolean;
  unlockedIds: string[];
  error?: string;
};

/** Merges a real purchase's grant into the signed-in user, then re-reads it. */
function applyGrant(grant: {
  unlockedCharacterIds?: string[];
  isPremium?: boolean;
  tier?: "PREMIUM" | "EXPERT";
  lifetime?: boolean;
}) {
  const auth = useAuthStore.getState();
  auth.patchUser((prev) => {
    const next = { ...prev };
    if (grant.unlockedCharacterIds?.length) {
      next.unlockedCharacterIds = [
        ...new Set([...(prev.unlockedCharacterIds ?? []), ...grant.unlockedCharacterIds]),
      ];
    }
    if (grant.tier) {
      next.premiumTier = grant.tier;
      next.premiumLifetime = !!grant.lifetime;
      next.isPremium = true;
    } else if (grant.isPremium) {
      next.isPremium = true;
      next.premiumTier = prev.premiumTier === "EXPERT" ? "EXPERT" : "PREMIUM";
    }
    return next;
  });
  void auth.refreshEntitlements();
}

/**
 * The one way the app buys something (hero picker, store, premium sheets). The
 * UI never knows whether it was a demo or a real store purchase.
 */
export async function purchaseItem(
  item: PurchaseItem,
  userId: string,
): Promise<PurchaseOutcome> {
  if (DEMO_PURCHASES) {
    await new Promise<void>((resolve) => setTimeout(() => resolve(), DEMO_DELAY_MS));
    const demo = useDemoUnlocks.getState();
    if (item.kind === "TIER") {
      const plan = TIER_PLANS[item.plan];
      // A cheaper plan never replaces a better one.
      const keep = demo.tier === "EXPERT" && plan.tier === "PREMIUM";
      if (!keep) demo.setTier(plan.tier, plan.lifetime || (demo.tier === plan.tier && demo.lifetime));
      // Expert opens every hero and outfit (not "bought": no online place).
      const unlockedIds = plan.tier === "EXPERT" ? allHeroAndSkinIds() : [];
      if (unlockedIds.length) demo.add(unlockedIds);
      return { success: true, unlockedIds };
    }
    // Heroes and bundles bought one by one count for the online place.
    demo.add(item.characterIds, { purchased: item.kind !== "SKIN" });
    return { success: true, unlockedIds: item.characterIds };
  }

  const sku =
    item.kind === "TIER"
      ? TIER_PLANS[item.plan].sku
      : item.storeProductId ?? item.productId;
  if (!sku) {
    // No message: the screen shows its translated "purchase failed" text.
    return { success: false, unlockedIds: [] };
  }
  const result = await IAPService.purchase(sku, userId);
  if (result.success && result.grant) applyGrant(result.grant);
  return {
    success: result.success,
    unlockedIds: result.grant?.unlockedCharacterIds ?? [],
    error: result.error,
  };
}

/** Restores real purchases (the store's "Restore" link). */
export async function restorePurchases(userId: string): Promise<boolean> {
  if (DEMO_PURCHASES) return false;
  const results = await IAPService.restorePurchases(userId);
  results.forEach((r) => {
    if (r.success && r.grant) applyGrant(r.grant);
  });
  return results.some((r) => r.success);
}
