// src/hooks/useStatistics.ts

import { useStatsStore } from "../store/statsStore";

export function useStatistics() {
  const { stats, updateStats } = useStatsStore();

  return {
    stats,
    updateStats,
  };
}
