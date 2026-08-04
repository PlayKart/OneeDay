// src/services/habitService.ts

import { apiClient } from "../api/client";
import { Habit } from "../types";
import { safeArray, normalizeCompletedDates } from "../utils";

export const habitService = {
  async getHabits(): Promise<Habit[]> {
    console.log("[Habit Service] Fetching GET /api/habits...");
    const res = await apiClient.get<Habit[] | { habits: Habit[] }>("/api/habits");
    const rawList = Array.isArray(res.data)
      ? res.data
      : (res.data as any)?.habits || [];

    const today = new Date().toISOString().split("T")[0];

    const habits = safeArray<any>(rawList).map((h) => {
      const completedDates = normalizeCompletedDates(h.completedDates || h.completed_dates || h.completed);
      
      const rawCompletedToday = h.completedToday ?? h.completed_today;
      const isCompletedTodayByField = rawCompletedToday !== undefined && rawCompletedToday !== null
        ? Boolean(rawCompletedToday === true || rawCompletedToday === "true" || rawCompletedToday === 1)
        : false;

      const isCompletedTodayByDates = completedDates.includes(today);
      const finalCompletedToday = isCompletedTodayByField || isCompletedTodayByDates;

      const finalCompletedDates = finalCompletedToday && !completedDates.includes(today)
        ? [...completedDates, today]
        : completedDates;

      return {
        id: String(h.id || h._id),
        name: String(h.name || "Untitled Habit"),
        completedToday: finalCompletedToday,
        completedDates: finalCompletedDates,
        repeatType: h.repeatType || h.repeat_type || "every_day",
        customDays: safeArray<string>(h.customDays || h.custom_days),
        difficulty: h.difficulty || "Medium",
        notes: h.notes || "",
        icon: h.icon || "dumbbell",
        category: h.category || "emerald",
        reminderTime: h.reminderTime || h.reminder_time || "",
      };
    });

    console.log("[Habit Service] Received habits from GET /api/habits:", habits);
    return habits;
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

    console.log("POST /api/habits request payload:", payload);

    let res: any;
    try {
      res = await apiClient.post("/api/habits", payload);
    } catch (err: any) {
      if (err?.response?.status === 404 || err?.message?.includes("404")) {
        console.warn("POST /api/habits returned 404, falling back to POST /api/habit");
        res = await apiClient.post("/api/habit", payload);
      } else {
        console.error("API POST error:", err);
        throw err;
      }
    }

    const body = res.data;
    if (body && body.success === false) {
      const errMsg = body.error?.message || (typeof body.error === "string" ? body.error : "Failed to create habit");
      console.error("API error response:", body.error || errMsg);
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

    const today = new Date().toISOString().split("T")[0];
    const completedDates = normalizeCompletedDates(h?.completedDates || h?.completed_dates);
    const rawCompletedToday = h?.completedToday ?? h?.completed_today;
    const finalCompletedToday = rawCompletedToday !== undefined && rawCompletedToday !== null
      ? Boolean(rawCompletedToday === true || rawCompletedToday === "true" || rawCompletedToday === 1)
      : completedDates.includes(today);

    return {
      id: String(h?.id || h?._id || `habit_${Date.now()}`),
      name: h?.name || payload.name,
      completedToday: finalCompletedToday,
      completedDates: finalCompletedToday && !completedDates.includes(today) ? [...completedDates, today] : completedDates,
      repeatType: h?.repeatType || h?.repeat_type || payload.repeatType,
      customDays: safeArray<string>(h?.customDays || h?.custom_days || payload.customDays),
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
        console.error("API PUT error:", err);
        throw err;
      }
    }

    const body = res.data;
    if (body && body.success === false) {
      const errMsg = body.error?.message || (typeof body.error === "string" ? body.error : "Failed to update habit");
      console.error("API error response:", body.error || errMsg);
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

    const today = new Date().toISOString().split("T")[0];
    const completedDates = normalizeCompletedDates(h?.completedDates || h?.completed_dates);
    const rawCompletedToday = h?.completedToday ?? h?.completed_today;
    const finalCompletedToday = rawCompletedToday !== undefined && rawCompletedToday !== null
      ? Boolean(rawCompletedToday === true || rawCompletedToday === "true" || rawCompletedToday === 1)
      : completedDates.includes(today);

    return {
      id: String(h?.id || habitId),
      name: h?.name || payload.name,
      completedToday: finalCompletedToday,
      completedDates: finalCompletedToday && !completedDates.includes(today) ? [...completedDates, today] : completedDates,
      repeatType: h?.repeatType || h?.repeat_type || payload.repeatType,
      customDays: safeArray<string>(h?.customDays || h?.custom_days || payload.customDays),
      difficulty: h?.difficulty || payload.difficulty,
      notes: h?.notes ?? payload.notes,
      icon: h?.icon || payload.icon,
      category: h?.category || payload.category,
      reminderTime: h?.reminderTime || h?.reminder_time || payload.reminderTime,
    };
  },

  async deleteHabit(habitId: string): Promise<void> {
    console.log(`DELETE /api/habits/${habitId}...`);
    await apiClient.delete(`/api/habits/${habitId}`);
  },

  async completeHabit(habitId: string): Promise<any> {
    const today = new Date().toISOString().split("T")[0];
    console.log(`POST /api/habits/${habitId}/complete with date ${today}...`);
    const res = await apiClient.post(`/api/habits/${habitId}/complete`, {
      date: today,
    });
    console.log(`POST /api/habits/${habitId}/complete response:`, res.data);
    return res.data;
  },

  async undoHabit(habitId: string): Promise<any> {
    const today = new Date().toISOString().split("T")[0];
    console.log(`POST /api/habits/${habitId}/undo with date ${today}...`);
    const res = await apiClient.post(`/api/habits/${habitId}/undo`, {
      date: today,
    });
    console.log(`POST /api/habits/${habitId}/undo response:`, res.data);
    return res.data;
  },
};

