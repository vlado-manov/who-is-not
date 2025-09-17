import { create } from "zustand";

type UserState = {
  id?: string;
  nickname?: string;
  premium: boolean;
  locale: "en" | "bg" | "fr" | "es";
  set: (p: Partial<UserState>) => void;
  reset: () => void;
};

export const useUserStore = create<UserState>((set) => ({
  premium: false,
  locale: "en",
  set: (p) => set(p),
  reset: () =>
    set({ id: undefined, nickname: undefined, premium: false, locale: "en" }),
}));
