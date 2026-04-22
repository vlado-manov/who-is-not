import { create } from "zustand";

type State = {
  message: string | null;
  show: (message: string) => void;
  clear: () => void;
};

export const useRoomNotificationStore = create<State>((set) => ({
  message: null,
  show: (message: string) => set({ message }),
  clear: () => set({ message: null }),
}));
