// src/hooks/useHabits.ts

import { useHabitStore } from "../store/habitStore";

export function useHabits() {
  const {
    habits,
    loading,
    fetchHabits,
    addHabit,
    editHabit,
    deleteHabit,
    completeHabit,
    undoHabit,
  } = useHabitStore();

  const completedTodayCount = habits.filter((h) => h.completedToday).length;

  return {
    habits,
    loading,
    completedTodayCount,
    totalHabitsCount: habits.length,
    fetchHabits,
    addHabit,
    editHabit,
    deleteHabit,
    completeHabit,
    undoHabit,
  };
}
