// src/store/habitStore.ts

import { create } from "zustand";
import { Habit } from "../types";
import { habitService } from "../services/habitService";
import { safeArray } from "../utils";

interface HabitState {
  habits: Habit[];
  loading: boolean;
  offlineQueue: { type: string; payload: any }[];
  setHabits: (habits: Habit[]) => void;
  fetchHabits: () => Promise<Habit[]>;
  addHabit: (habitData: Partial<Habit>) => Promise<void>;
  editHabit: (habitId: string, habitData: Partial<Habit>) => Promise<void>;
  deleteHabit: (habitId: string) => Promise<void>;
  completeHabit: (habitId: string) => Promise<void>;
  undoHabit: (habitId: string) => Promise<void>;
}

export const useHabitStore = create<HabitState>((set, get) => ({
  habits: [],
  loading: false,
  offlineQueue: [],
  setHabits: (habits) => set({ habits: safeArray(habits) }),
  fetchHabits: async () => {
    set({ loading: true });
    try {
      const habits = await habitService.getHabits();
      set({ habits: safeArray(habits), loading: false });
      return habits;
    } catch (e) {
      set({ loading: false });
      return get().habits;
    }
  },
  addHabit: async (habitData) => {
    const tempId = `temp_${Date.now()}`;
    const optimisticHabit: Habit = {
      id: tempId,
      name: habitData.name || "New Habit",
      completedToday: false,
      repeatType: habitData.repeatType || "every_day",
      customDays: habitData.customDays || [],
      icon: habitData.icon || "dumbbell",
      category: habitData.category || "emerald",
      difficulty: habitData.difficulty || "Medium",
      notes: habitData.notes || "",
    };

    set((state) => ({ habits: [optimisticHabit, ...state.habits] }));

    try {
      const created = await habitService.createHabit(habitData);
      set((state) => ({
        habits: state.habits.map((h) => (h.id === tempId ? created : h)),
      }));
    } catch (e) {
      set((state) => ({
        habits: state.habits.filter((h) => h.id !== tempId),
      }));
      throw e;
    }
  },
  editHabit: async (habitId, habitData) => {
    const original = get().habits.find((h) => h.id === habitId);
    if (!original) return;

    set((state) => ({
      habits: state.habits.map((h) => (h.id === habitId ? { ...h, ...habitData } : h)),
    }));

    try {
      const updated = await habitService.updateHabit(habitId, habitData);
      set((state) => ({
        habits: state.habits.map((h) => (h.id === habitId ? updated : h)),
      }));
    } catch (e) {
      if (original) {
        set((state) => ({
          habits: state.habits.map((h) => (h.id === habitId ? original : h)),
        }));
      }
      throw e;
    }
  },
  deleteHabit: async (habitId) => {
    const original = get().habits.find((h) => h.id === habitId);
    set((state) => ({
      habits: state.habits.filter((h) => h.id !== habitId),
    }));

    try {
      await habitService.deleteHabit(habitId);
    } catch (e) {
      if (original) {
        set((state) => ({ habits: [...state.habits, original] }));
      }
      throw e;
    }
  },
  completeHabit: async (habitId) => {
    const today = new Date().toISOString().split("T")[0];
    set((state) => ({
      habits: state.habits.map((h) =>
        h.id === habitId
          ? {
              ...h,
              completedToday: true,
              completedDates: h.completedDates?.includes(today)
                ? h.completedDates
                : [...(h.completedDates || []), today],
            }
          : h
      ),
    }));

    try {
      await habitService.completeHabit(habitId);
    } catch (e) {
      console.warn("Optimistic habit completion recorded locally:", e);
    }
  },
  undoHabit: async (habitId) => {
    const today = new Date().toISOString().split("T")[0];
    set((state) => ({
      habits: state.habits.map((h) =>
        h.id === habitId
          ? {
              ...h,
              completedToday: false,
              completedDates: (h.completedDates || []).filter((d) => d !== today),
            }
          : h
      ),
    }));

    try {
      await habitService.undoHabit(habitId);
    } catch (e) {
      console.warn("Optimistic habit undo recorded locally:", e);
    }
  },
}));
