// src/store/useEntitlements.ts
import { useEffect, useMemo } from "react";
import { useAuthStore } from "./useUserStore";
import { useDemoUnlocks } from "./useDemoUnlocks";
import { useHeroesStore } from "./useHeroesStore";
import type { PremiumTier } from "../types/user";

const RANK: Record<PremiumTier, number> = { NONE: 0, PREMIUM: 1, EXPERT: 2 };

function higher(a: PremiumTier, b: PremiumTier): PremiumTier {
  return RANK[a] >= RANK[b] ? a : b;
}

export type Entitlements = {
  /** Server membership merged with a demo purchase this session. */
  tier: PremiumTier;
  isPremium: boolean;
  isExpert: boolean;
  lifetime: boolean;
  /** Base heroes this player can pick (Expert: all). */
  unlockedHeroIds: ReadonlySet<string>;
  /** Heroes paid for one by one (bundles included). */
  purchasedHeroIds: ReadonlySet<string>;
  /** Owns a bought hero or Expert: adds one place to an online room. */
  hasOnlinePerk: boolean;
  totalHeroCount: number;
  /** Membership as the backend knows it: for anything the backend checks again
   * (custom questions), never the demo tier. */
  server: {
    tier: PremiumTier;
    isPremium: boolean;
    manageable: boolean;
    /** A bought monthly subscription is still billed, even under a lifetime tier. */
    hasActiveStoreSubscription: boolean;
  };
};

/**
 * The one place screens read membership and owned heroes from. Use `tier` /
 * `isPremium` for what the app itself gates (player counts, packs, question
 * types, heroes); use `server` where the backend gates the feature too.
 */
/** Re-reads membership when a screen that depends on it opens. */
export function useRefreshEntitlementsOnMount(): void {
  useEffect(() => {
    void useAuthStore.getState().refreshEntitlements();
  }, []);
}

export function useEntitlements(): Entitlements {
  const user = useAuthStore((s) => s.user);
  const heroes = useHeroesStore((s) => s.heroes);
  const demoIds = useDemoUnlocks((s) => s.ids);
  const demoPurchasedIds = useDemoUnlocks((s) => s.purchasedIds);
  const demoTier = useDemoUnlocks((s) => s.tier);
  const demoLifetime = useDemoUnlocks((s) => s.lifetime);

  return useMemo(() => {
    const serverTier: PremiumTier =
      user.premiumTier ?? (user.isPremium ? "PREMIUM" : "NONE");
    const tier = higher(serverTier, demoTier);
    const isExpert = tier === "EXPERT";
    const lifetime =
      (serverTier === tier && !!user.premiumLifetime) ||
      (demoTier === tier && demoLifetime);

    const userUnlocked = new Set(user.unlockedCharacterIds ?? []);
    const unlockedHeroIds = new Set<string>();
    for (const hero of heroes) {
      if (
        isExpert ||
        hero.unlocked ||
        userUnlocked.has(hero.id) ||
        demoIds.has(hero.id)
      ) {
        unlockedHeroIds.add(hero.id);
      }
    }

    const purchasedHeroIds = new Set<string>([
      ...(user.purchasedCharacterIds ?? []),
      ...demoPurchasedIds,
    ]);

    return {
      tier,
      isPremium: tier !== "NONE",
      isExpert,
      lifetime,
      unlockedHeroIds,
      purchasedHeroIds,
      hasOnlinePerk: isExpert || purchasedHeroIds.size > 0,
      totalHeroCount: heroes.length,
      server: {
        tier: serverTier,
        isPremium: serverTier !== "NONE",
        manageable: !!user.premiumManageable,
        hasActiveStoreSubscription: !!(
          user.hasActiveStoreSubscription ?? user.premiumManageable
        ),
      },
    };
  }, [user, heroes, demoIds, demoPurchasedIds, demoTier, demoLifetime]);
}
