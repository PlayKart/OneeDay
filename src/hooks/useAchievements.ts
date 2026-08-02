// src/hooks/useAchievements.ts

import { useAchievementStore } from "../store/achievementStore";

export function useAchievements() {
  const { achievements, setAchievements, checkAndUnlock } = useAchievementStore();

  return {
    achievements,
    unlockedCount: achievements.filter((a) => a.unlocked).length,
    setAchievements,
    checkAndUnlock,
  };
}
