// src/store/useDemoUnlocks.ts
import { create } from "zustand";
import type { PremiumTier } from "../types/user";

/**
 * What was "bought" in demo mode (see services/purchases.ts): heroes and
 * skins, and a membership tier. Kept in memory only — never saved and never
 * sent to the backend — so a demo unlock lasts until the app is closed and is
 * never a real entitlement.
 */
type DemoUnlocksState = {
  ids: Set<string>;
  /** Of `ids`, the ones paid for one by one (they add an online place). */
  purchasedIds: Set<string>;
  tier: PremiumTier;
  lifetime: boolean;
  add: (ids: string[], opts?: { purchased?: boolean }) => void;
  setTier: (tier: PremiumTier, lifetime: boolean) => void;
  clearTier: () => void;
};

export const useDemoUnlocks = create<DemoUnlocksState>((set) => ({
  ids: new Set(),
  purchasedIds: new Set(),
  tier: "NONE",
  lifetime: false,
  add: (ids, opts) =>
    set((s) => {
      const next = new Set(s.ids);
      ids.forEach((id) => next.add(id));
      if (!opts?.purchased) return { ids: next };
      const bought = new Set(s.purchasedIds);
      ids.forEach((id) => bought.add(id));
      return { ids: next, purchasedIds: bought };
    }),
  setTier: (tier, lifetime) => set({ tier, lifetime }),
  clearTier: () => set({ tier: "NONE", lifetime: false }),
}));
