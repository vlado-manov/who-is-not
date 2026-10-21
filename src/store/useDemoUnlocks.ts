// src/store/useDemoUnlocks.ts
import { create } from "zustand";

/**
 * Heroes and skins "bought" in demo mode (see services/purchases.ts). Kept in
 * memory only — never saved and never sent to the backend — so a demo unlock
 * lasts until the app is closed and is never a real entitlement.
 */
type DemoUnlocksState = {
  ids: Set<string>;
  add: (ids: string[]) => void;
};

export const useDemoUnlocks = create<DemoUnlocksState>((set) => ({
  ids: new Set(),
  add: (ids) =>
    set((s) => {
      const next = new Set(s.ids);
      ids.forEach((id) => next.add(id));
      return { ids: next };
    }),
}));
