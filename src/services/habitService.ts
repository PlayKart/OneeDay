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
    // 1. Validate required fields
    if (!habitData.name || !habitData.name.trim()) {
      throw new Error("Habit name is required");
    }

    if (habitData.repeatType === "custom_days" && (!habitData.customDays || habitData.customDays.length === 0)) {
      throw new Error("At least one custom day must be selected");
    }

    // 2. Prepare payload matching both snake_case and camelCase
    const payload = {
      name: habitData.name.trim(),
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

    // 3. Log incoming request payload
    console.log("POST /api/habits request payload:", payload);

    let res: any;
    try {
      res = await apiClient.post("/api/habits", payload);
    } catch (err: any) {
      if (err?.response?.status === 404 || err?.message?.includes("404")) {
        console.warn("POST /api/habits returned 404, falling back to POST /api/habit");
        res = await apiClient.post("/api/habit", payload);
      } else {
        console.error("Supabase / API POST error:", err);
        throw err;
      }
    }

    const body = res.data;
    if (body && body.success === false) {
      const errMsg = body.error?.message || (typeof body.error === "string" ? body.error : "Failed to create habit");
      console.error("Supabase error response:", body.error || errMsg);
      throw new Error(errMsg);
    }

    let h: any;
    if (body?.success && body?.data) {
      h = body.data.habit || body.data;
    } else if (body?.data) {
      h = body.data.habit || body.data;
    } else if (body?.habit) {
      h = body.habit;
    } else {
      h = body;
    }

    return {
      id: h?.id || h?._id || `habit_${Date.now()}`,
      name: h?.name || payload.name,
      completedToday: Boolean(h?.completedToday || h?.completed_today),
      completedDates: normalizeCompletedDates(h?.completedDates || h?.completed_dates),
      repeatType: h?.repeatType || h?.repeat_type || payload.repeatType,
      customDays: safeArray(h?.customDays || h?.custom_days || payload.customDays),
      difficulty: h?.difficulty || payload.difficulty,
      notes: h?.notes ?? payload.notes,
      icon: h?.icon || payload.icon,
      category: h?.category || payload.category,
      reminderTime: h?.reminderTime || h?.reminder_time || payload.reminderTime,
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

    console.log(`PUT /api/habits/${habitId} request payload:`, payload);

    let res: any;
    try {
      res = await apiClient.put(`/api/habits/${habitId}`, payload);
    } catch (err: any) {
      if (err?.response?.status === 404 || err?.message?.includes("404")) {
        console.warn(`PUT /api/habits/${habitId} returned 404, falling back to PUT /api/habit/${habitId}`);
        res = await apiClient.put(`/api/habit/${habitId}`, payload);
      } else {
        console.error("Supabase / API PUT error:", err);
        throw err;
      }
    }

    const body = res.data;
    if (body && body.success === false) {
      const errMsg = body.error?.message || (typeof body.error === "string" ? body.error : "Failed to update habit");
      console.error("Supabase error response:", body.error || errMsg);
      throw new Error(errMsg);
    }

    let h: any;
    if (body?.success && body?.data) {
      h = body.data.habit || body.data;
    } else if (body?.data) {
      h = body.data.habit || body.data;
    } else if (body?.habit) {
      h = body.habit;
    } else {
      h = body;
    }

    return {
      id: h?.id || habitId,
      name: h?.name || payload.name,
      completedToday: Boolean(h?.completedToday || h?.completed_today),
      completedDates: normalizeCompletedDates(h?.completedDates || h?.completed_dates),
      repeatType: h?.repeatType || h?.repeat_type || payload.repeatType,
      customDays: safeArray(h?.customDays || h?.custom_days || payload.customDays),
      difficulty: h?.difficulty || payload.difficulty,
      notes: h?.notes ?? payload.notes,
      icon: h?.icon || payload.icon,
      category: h?.category || payload.category,
      reminderTime: h?.reminderTime || h?.reminder_time || payload.reminderTime,
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
