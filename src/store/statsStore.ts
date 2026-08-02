// src/store/statsStore.ts

import { create } from "zustand";
import { Statistics } from "../types";

interface StatsState {
  stats: Statistics;
  updateStats: (habits: any[], streak: number) => void;
}

export const useStatsStore = create<StatsState>((set) => ({
  stats: {
    totalHabits: 0,
    completedToday: 0,
    currentStreak: 0,
    longestStreak: 0,
    completionRate: 0,
    weeklyHistory: [],
  },
  updateStats: (habits, streak) => {
    const safeList = Array.isArray(habits) ? habits : [];
    const completedCount = safeList.filter((h) => h.completedToday).length;
    const rate = safeList.length > 0 ? Math.round((completedCount / safeList.length) * 100) : 0;

    set({
      stats: {
        totalHabits: safeList.length,
        completedToday: completedCount,
        currentStreak: streak,
        longestStreak: Math.max(streak, 7),
        completionRate: rate,
        weeklyHistory: [],
      },
    });
  },
}));
