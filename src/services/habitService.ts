// src/services/habitService.ts

import { apiClient } from "../api/client";
import { Habit } from "../types";
import { safeArray, normalizeCompletedDates } from "../utils";

export const habitService = {
  async getHabits(): Promise<Habit[]> {
    const res = await apiClient.get<Habit[] | { habits: Habit[] }>("/api/habits");
    const rawList = Array.isArray(res.data)
      ? res.data
      : (res.data as any)?.habits || [];
    
    return safeArray<any>(rawList).map((h) => ({
      ...h,
      completedToday: Boolean(h.completedToday || h.completed_today),
      completedDates: normalizeCompletedDates(h.completedDates || h.completed_dates),
      repeatType: h.repeatType || h.repeat_type || "every_day",
      customDays: safeArray(h.customDays || h.custom_days),
    }));
  },

  async createHabit(habitData: Partial<Habit>): Promise<Habit> {
    const payload = {
      name: habitData.name,
      repeatType: habitData.repeatType || "every_day",
      repeat_type: habitData.repeatType || "every_day",
      customDays: habitData.customDays || [],
      custom_days: habitData.customDays || [],
      difficulty: habitData.difficulty || "Medium",
      notes: habitData.notes || "",
      icon: habitData.icon || "dumbbell",
      category: habitData.category || "emerald",
      reminderTime: habitData.reminderTime || "",
      reminder_time: habitData.reminderTime || "",
    };
    console.log("Posting POST /api/habits payload:", payload);

    const res = await apiClient.post<Habit | { habit: Habit }>("/api/habits", payload);

    const h: any = (res.data as any)?.habit || res.data;
    return {
      ...h,
      completedToday: Boolean(h.completedToday || h.completed_today),
      completedDates: normalizeCompletedDates(h.completedDates || h.completed_dates),
      repeatType: h.repeatType || h.repeat_type || "every_day",
      customDays: safeArray(h.customDays || h.custom_days),
    };
  },

  async updateHabit(habitId: string, habitData: Partial<Habit>): Promise<Habit> {
    const payload = {
      name: habitData.name,
      repeatType: habitData.repeatType,
      repeat_type: habitData.repeatType,
      customDays: habitData.customDays,
      custom_days: habitData.customDays,
      difficulty: habitData.difficulty,
      notes: habitData.notes,
      icon: habitData.icon,
      category: habitData.category,
      reminderTime: habitData.reminderTime,
      reminder_time: habitData.reminderTime,
    };
    console.log(`Posting PUT /api/habits/${habitId} payload:`, payload);

    const res = await apiClient.put<Habit | { habit: Habit }>(`/api/habits/${habitId}`, payload);

    const h: any = (res.data as any)?.habit || res.data;
    return {
      ...h,
      completedToday: Boolean(h.completedToday || h.completed_today),
      completedDates: normalizeCompletedDates(h.completedDates || h.completed_dates),
      repeatType: h.repeatType || h.repeat_type || "every_day",
      customDays: safeArray(h.customDays || h.custom_days),
    };
  },

  async deleteHabit(habitId: string): Promise<void> {
    await apiClient.delete(`/api/habits/${habitId}`);
  },

  async completeHabit(habitId: string): Promise<any> {
    const res = await apiClient.post(`/api/habits/${habitId}/complete`, {
      date: new Date().toISOString().split("T")[0],
    });
    return res.data;
  },

  async undoHabit(habitId: string): Promise<any> {
    const res = await apiClient.post(`/api/habits/${habitId}/undo`, {
      date: new Date().toISOString().split("T")[0],
    });
    return res.data;
  },
};
