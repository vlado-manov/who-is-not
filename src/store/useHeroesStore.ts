import { create } from "zustand";
import { fetchCharacters } from "../api/heroes";
import { ICharacter } from "../types/character";

type HeroesState = {
  heroes: ICharacter[];
  loading: boolean;
  loaded: boolean;
  error: string | null;
  loadHeroes: () => Promise<void>;
  setRemoteState: (input: {
    heroes: ICharacter[];
    loading: boolean;
    loaded: boolean;
    error: string | null;
  }) => void;
};

export const useHeroesStore = create<HeroesState>((set, get) => ({
  heroes: [],
  loading: false,
  loaded: false,
  error: null,
  loadHeroes: async () => {
    if (get().loading) return;
    set({ loading: true, error: null });
    try {
      const rows = await fetchCharacters();
      if (rows.length > 0) {
        set({ heroes: rows, loaded: true, loading: false, error: null });
      } else {
        set({
          heroes: [],
          loaded: true,
          loading: false,
          error: "No active characters returned from /characters",
        });
      }
    } catch (e) {
      set({
        heroes: [],
        loading: false,
        loaded: true,
        error: e instanceof Error ? e.message : "Failed to load heroes",
      });
    }
  },
  setRemoteState: ({ heroes, loading, loaded, error }) => {
    set({ heroes, loading, loaded, error });
  },
}));
