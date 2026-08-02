// src/store/achievementStore.ts

import { create } from "zustand";
import { Achievement } from "../types";

interface AchievementState {
  achievements: Achievement[];
  setAchievements: (achievements: Achievement[]) => void;
  checkAndUnlock: (streak: number, completedCount: number, totalHabits: number) => void;
}

export const useAchievementStore = create<AchievementState>((set) => ({
  achievements: [
    { id: "1", title: "First Step", description: "Complete your first habit", unlocked: false },
    { id: "2", title: "Unstoppable", description: "Reach a 7-day streak", unlocked: false, progress: 0, maxProgress: 7 },
    { id: "3", title: "Master System", description: "Maintain 5 active habits", unlocked: false, progress: 0, maxProgress: 5 },
    { id: "4", title: "Apex Disciplinarian", description: "Reach level 5", unlocked: false, progress: 1, maxProgress: 5 },
  ],
  setAchievements: (achievements) => set({ achievements }),
  checkAndUnlock: (streak, completedCount, totalHabits) => {
    set((state) => ({
      achievements: state.achievements.map((a) => {
        if (a.id === "1") return { ...a, unlocked: completedCount > 0 };
        if (a.id === "2") return { ...a, unlocked: streak >= 7, progress: streak };
        if (a.id === "3") return { ...a, unlocked: totalHabits >= 5, progress: totalHabits };
        return a;
      }),
    }));
  },
}));
