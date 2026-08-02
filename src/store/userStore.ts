// src/store/userStore.ts

import { create } from "zustand";
import { User } from "../types";
import { userService } from "../services/userService";

interface UserState {
  user: User | null;
  loading: boolean;
  backendError: string | null;
  setUser: (user: User | null) => void;
  fetchUser: () => Promise<User | null>;
  freezeStreak: (days: number) => Promise<void>;
  deactivateFreeze: () => Promise<void>;
  resetProgress: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  loading: false,
  backendError: null,
  setUser: (user) => set({ user }),
  fetchUser: async () => {
    set({ loading: true, backendError: null });
    try {
      const user = await userService.getUserProfile();
      set({ user, loading: false });
      return user;
    } catch (err: any) {
      set({ backendError: err.message || "Failed to fetch profile", loading: false });
      return null;
    }
  },
  freezeStreak: async (days: number) => {
    try {
      const updatedUser = await userService.freezeStreak(days);
      set({ user: updatedUser });
    } catch (e: any) {
      throw e;
    }
  },
  deactivateFreeze: async () => {
    try {
      const updatedUser = await userService.deactivateFreeze();
      set({ user: updatedUser });
    } catch (e: any) {
      throw e;
    }
  },
  resetProgress: async () => {
    await userService.resetProgress();
    set((state) => ({
      user: state.user
        ? { ...state.user, xp: 0, streak: 0, level: 1, levelProgress: 0 }
        : null,
    }));
  },
  deleteAccount: async () => {
    await userService.deleteAccount();
    set({ user: null });
  },
}));
