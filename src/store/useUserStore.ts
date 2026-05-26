// state/authStore.ts

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { IUser } from "../types/user";
import { AvatarId } from "../../assets/characters";
import { useHeroesStore } from "./useHeroesStore";
import { loginWithEmailPassword } from "../api/users";
import { HEROES } from "../data/heroes";

export type AuthStatus = "guest" | "loggedIn";

export type Settings = {
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  musicLevel: number;
  sfxLevel: number;
  /** After any completed game — used so Round tutorial only shows for first-time players. */
  hasCompletedAnyGame?: boolean;
  /** User dismissed the Round screen tutorial overlay. */
  hasSeenRoundTutorial?: boolean;
};

const DEFAULT_AVATAR_ID = "silent_vanessa" as AvatarId;

const rndFrom = <T>(a: T[]) => a[Math.floor(Math.random() * a.length)];
const rndGuestName = () => `Guest${Math.floor(10000 + Math.random() * 900000)}`;

const WORDS_A = ["Sunny", "Brave", "Clever", "Happy", "Mighty", "Lucky"];
const WORDS_B = ["Panda", "Fox", "Koala", "Eagle", "Otter", "Tiger"];
const rndUserName = () => `${rndFrom(WORDS_A)}${rndFrom(WORDS_B)}`;

/** Returns the slug of a random free (non-premium) hero, or the default. */
const rndFreeAvatarId = (): AvatarId => {
  const remoteHeroes = useHeroesStore.getState().heroes;
  const source = remoteHeroes.length > 0 ? remoteHeroes : HEROES;
  const freeHeroes = source.filter(
    (h) => h.free === true && h.premium !== true && !!h.profileImage,
  );
  if (freeHeroes.length === 0) return DEFAULT_AVATAR_ID;
  return rndFrom(freeHeroes).slug as AvatarId;
};

/**
 * For a logged-in user: keep the default avatar inside the free hero pool.
 */
const avatarIdForUnlocked = (unlockedCharacterIds: string[]): AvatarId => {
  if (unlockedCharacterIds.length > 0) {
    const remoteHeroes = useHeroesStore.getState().heroes;
    const heroes = remoteHeroes.length > 0 ? remoteHeroes : HEROES;
    const match = heroes.find(
      (h) =>
        unlockedCharacterIds.includes(h.id) &&
        h.free === true &&
        h.premium !== true &&
        !!h.profileImage,
    );
    if (match) return match.slug as AvatarId;
  }
  return rndFreeAvatarId();
};

function nowTs() {
  return Date.now();
}

function makeGuest(): IUser {
  const ts = nowTs();
  return {
    id: `${Math.random().toString(36).slice(2, 10)}`,
    name: rndGuestName(),
    email: undefined,
    avatarId: rndFreeAvatarId(),
    provider: undefined,
    isGuest: true,
    isPremium: false,
    purchasedProductIds: [],
    unlockedCharacterIds: [],
    lastLoggedIn: ts,
    createdAt: ts,
  };
}

function makeLoggedUser(provider: "google" | "apple"): IUser {
  const ts = nowTs();
  return {
    id: `${provider}_${Math.random().toString(36).slice(2, 10)}`,
    name: rndUserName(),
    email: `${Math.random().toString(36).slice(2, 8)}@example.com`,
    avatarId: rndFreeAvatarId(),
    provider,
    isGuest: false,
    isPremium: false,
    lastLoggedIn: ts,
    createdAt: ts,
    customQuestions: [],
    purchasedProductIds: [],
    unlockedCharacterIds: [],
    purchases: [],
    achievements: [],
  };
}

type AuthStore = {
  authStatus: AuthStatus;
  user: IUser;
  settings: Settings;

  signInAsGuest: () => void;
  signInGoogle: () => void;
  signInApple: () => void;
  signInEmailPassword: (email: string, password: string) => Promise<void>;
  signOut: () => void;

  updateName: (name: string) => void;
  updateAvatar: (avatarId: AvatarId) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  /** Shallow-merge a partial user update (or a function that receives the current user). */
  patchUser: (
    patch: Partial<IUser> | ((prev: IUser) => Partial<IUser>),
  ) => void;
};

const DEFAULT_SETTINGS: Settings = {
  notificationsEnabled: false,
  soundEnabled: true,
  musicLevel: 0.7,
  sfxLevel: 0.8,
  hasCompletedAnyGame: false,
  hasSeenRoundTutorial: false,
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      authStatus: "guest",
      user: makeGuest(),
      settings: DEFAULT_SETTINGS,

      signInAsGuest: () => set({ user: makeGuest(), authStatus: "guest" }),
      signInGoogle: () =>
        set({ user: makeLoggedUser("google"), authStatus: "loggedIn" }),
      signInApple: () =>
        set({ user: makeLoggedUser("apple"), authStatus: "loggedIn" }),
      signInEmailPassword: async (email, password) => {
        const res = await loginWithEmailPassword(email, password);
        const createdAt = Date.parse(res.createdAt);
        const lastLoggedIn = Date.parse(res.lastLoggedIn);
        set({
          authStatus: "loggedIn",
          user: {
            id: res.id,
            name: res.name,
            email: res.email ?? undefined,
            avatarId: avatarIdForUnlocked(res.unlockedCharacterIds ?? []),
            provider: "local",
            isGuest: false,
            isPremium: res.isPremium,
            lang: (res.lang as "bg" | "en" | "fr" | "es" | undefined) ?? "en",
            purchasedProductIds: res.purchasedProductIds ?? [],
            unlockedCharacterIds: res.unlockedCharacterIds ?? [],
            lastLoggedIn: Number.isFinite(lastLoggedIn)
              ? lastLoggedIn
              : nowTs(),
            createdAt: Number.isFinite(createdAt) ? createdAt : nowTs(),
            customQuestions: [],
            purchases: [],
            achievements: [],
          },
        });
      },
      signOut: () => set({ user: makeGuest(), authStatus: "guest" }),

      updateName: (name) => set({ user: { ...get().user, name } }),
      updateAvatar: (avatarId) => set({ user: { ...get().user, avatarId } }),
      updateSettings: (patch) =>
        set({ settings: { ...get().settings, ...patch } }),
      patchUser: (patch) => {
        const current = get().user;
        const delta = typeof patch === "function" ? patch(current) : patch;
        set({ user: { ...current, ...delta } });
      },
    }),
    {
      name: "auth-store",
      storage: createJSONStorage(() => AsyncStorage),
      merge: (persisted, current) => {
        if (!persisted) return current;
        const p = persisted as Partial<AuthStore>;
        const merged: AuthStore = {
          ...current,
          ...p,
          user: p.user ? { ...current.user, ...p.user } : current.user,
          settings: p.settings
            ? { ...current.settings, ...p.settings }
            : current.settings,
        };
        merged.authStatus = merged.user?.isGuest ? "guest" : "loggedIn";
        return merged;
      },
      partialize: (s) => ({
        authStatus: s.authStatus,
        user: s.user,
        settings: s.settings,
      }),
      version: 1,
    },
  ),
);
