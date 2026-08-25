import { Habit } from "../types";
import { safeArray, getLocalCalendarDate, getXpForDifficulty, calculateLevelProgress } from "../utils";
import { auth } from "../lib/firebase";
import { apiClient } from "../api/client";
import { useStore } from "../store/useStore";

export const habitService = {
  /**
   * Fetches habits from backend API (backed by Supabase).
   */
  async getHabits(): Promise<Habit[]> {
    const fbUser = auth.currentUser || useStore.getState().firebaseUser;
    if (!fbUser) return [];

    console.log(`[HABIT SERVICE] Fetching habits from backend API for userId: ${fbUser.uid}`);
    try {
      const habitsStart = performance.now();
      const response = await apiClient.get("/api/habits");
      const duration = Math.round(performance.now() - habitsStart);
      console.log(`[PERF] backend getHabits: ${duration}ms`);

      const rawData = response.data || {};
      const habitsList = Array.isArray(rawData)
        ? rawData
        : Array.isArray(rawData.data)
        ? rawData.data
        : Array.isArray(rawData.habits)
        ? rawData.habits
        : Array.isArray(rawData.data?.habits)
        ? rawData.data.habits
        : Array.isArray(rawData.data?.data)
        ? rawData.data.data
        : Array.isArray(rawData.result)
        ? rawData.result
        : Array.isArray(rawData.data?.result)
        ? rawData.data.result
        : [];

      const today = getLocalCalendarDate();

      return habitsList.map((h: any) => {
        const id = String(h.id || h.habitId || h.habit_id);
        const rawCompletedDates = safeArray<string>(h.completedDates || h.completed_dates);
        const completedDates = rawCompletedDates.map((d) => getLocalCalendarDate(d)).filter(Boolean);
        const completedToday = Boolean(h.completedToday || h.completed_today || completedDates.includes(today));

        return {
          id,
          name: h.title || h.name || "Unnamed Habit",
          completedToday,
          completedDates,
          repeatType: h.repeatType || h.repeat_type || "every_day",
          customDays: safeArray<string>(h.customDays || h.custom_days),
          difficulty: h.difficulty || "Medium",
          notes: h.notes ?? h.description ?? "",
          icon: h.icon || "dumbbell",
          category: h.category || h.color || "emerald",
          reminderTime: h.reminderTime || h.reminder_time || "",
        };
      });
    } catch (err: any) {
      console.warn(`[HABIT SERVICE] Backend getHabits failed:`, err?.message || err);
      return useStore.getState().habits || [];
    }
  },

  /**
   * Creates a habit via backend API & Supabase.
   */
  async createHabit(habitData: any): Promise<Habit> {
    const fbUser = auth.currentUser || useStore.getState().firebaseUser;
    if (!fbUser) throw new Error("Not authenticated");

    if (!habitData.name?.trim()) {
      throw new Error("Habit name is required");
    }

    const payload = {
      name: habitData.name.trim(),
      title: habitData.name.trim(),
      repeatType: habitData.repeatType || "every_day",
      customDays: habitData.customDays || [],
      difficulty: habitData.difficulty || "Medium",
      notes: habitData.notes || "",
      description: habitData.notes || "",
      icon: habitData.icon || "dumbbell",
      category: habitData.category || "emerald",
      color: habitData.category || "emerald",
      reminderTime: habitData.reminderTime || "",
    };

    const targetUrl = "/api/habit";
    const method = "POST";

    console.log("[HABIT CREATE] Starting");
    console.log("[HABIT CREATE] URL:", targetUrl);
    console.log("[HABIT CREATE] METHOD:", method);
    console.log("[HABIT CREATE] PAYLOAD:", payload);

    try {
      const response = await apiClient.post(targetUrl, payload);

      console.log("[HABIT CREATE] RESPONSE STATUS:", response.status);
      console.log("[HABIT CREATE] RESPONSE:", response.data);

      const rawData = response.data || {};
      const created = rawData.data || rawData.habit || rawData;

      return {
        id: String(created.id || created.habitId || Date.now()),
        name: created.title || created.name || payload.name,
        completedToday: false,
        completedDates: [],
        repeatType: created.repeatType || created.repeat_type || payload.repeatType,
        customDays: safeArray<string>(created.customDays || created.custom_days || payload.customDays),
        difficulty: created.difficulty || payload.difficulty,
        notes: created.notes ?? created.description ?? payload.notes,
        icon: created.icon || payload.icon,
        category: created.category || created.color || payload.category,
        reminderTime: created.reminderTime || created.reminder_time || payload.reminderTime,
      };
    } catch (err: any) {
      console.error("[HABIT CREATE] ERROR:", err?.message || err);
      throw err;
    }
  },

  /**
   * Updates a habit via authoritative PUT /api/habit endpoint.
   */
  async updateHabit(habitId: string, habitData: Partial<Habit>): Promise<Habit> {
    const fbUser = auth.currentUser || useStore.getState().firebaseUser;
    if (!fbUser) throw new Error("Not authenticated");

    const payload: any = { id: habitId, habitId };
    if (habitData.name) { payload.name = habitData.name; payload.title = habitData.name; }
    if (habitData.repeatType) payload.repeatType = habitData.repeatType;
    if (habitData.customDays) payload.customDays = habitData.customDays;
    if (habitData.difficulty) payload.difficulty = habitData.difficulty;
    if (habitData.notes !== undefined) { payload.notes = habitData.notes; payload.description = habitData.notes; }
    if (habitData.icon) payload.icon = habitData.icon;
    if (habitData.category) { payload.category = habitData.category; payload.color = habitData.category; }
    if (habitData.reminderTime !== undefined) payload.reminderTime = habitData.reminderTime;

    console.log(`[HABIT SERVICE] Updating habit ${habitId} via PUT /api/habit...`);
    try {
      const response = await apiClient.put(`/api/habit`, payload);
      const rawData = response.data || {};
      const updated = rawData.data || rawData.habit || rawData;

      return {
        id: habitId,
        name: updated.title || updated.name || habitData.name || "Updated Habit",
        completedToday: Boolean(updated.completedToday),
        completedDates: safeArray(updated.completedDates),
        repeatType: updated.repeatType || habitData.repeatType || "every_day",
        customDays: safeArray(updated.customDays || habitData.customDays),
        difficulty: updated.difficulty || habitData.difficulty || "Medium",
        notes: updated.notes ?? updated.description ?? habitData.notes ?? "",
        icon: updated.icon || habitData.icon || "dumbbell",
        category: updated.category || habitData.category || "emerald",
        reminderTime: updated.reminderTime || habitData.reminderTime || "",
      };
    } catch (err: any) {
      console.warn(`[HABIT SERVICE] Backend updateHabit failed:`, err?.message || err);
      return { id: habitId, ...habitData } as any;
    }
  },

  /**
   * Deletes a habit via authoritative DELETE /api/habit/:habitId endpoint.
   */
  async deleteHabit(habitId: string): Promise<void> {
    console.log(`[HABIT SERVICE] Deleting habit ${habitId} via DELETE /api/habit/${habitId}...`);
    try {
      await apiClient.delete(`/api/habit/${habitId}`);
      console.log(`[HABIT SERVICE] Delete habit ${habitId} successful.`);
    } catch (err: any) {
      console.warn(`[HABIT SERVICE] Backend deleteHabit failed:`, err?.message || err);
    }
  },

  /**
   * Completes a habit via authoritative POST /api/complete endpoint.
   */
  async completeHabit(habitId: string, dateStr?: string): Promise<any> {
    const fbUser = auth.currentUser || useStore.getState().firebaseUser;
    if (!fbUser) throw new Error("Not authenticated");

    const date = dateStr || getLocalCalendarDate();
    console.log(`[HABIT SERVICE] Completing habit ${habitId} via POST /api/complete...`);
    try {
      const response = await apiClient.post(`/api/complete`, { habitId, date });
      const rawData = response.data || {};

      const streak = rawData.streak ?? rawData.currentStreak ?? rawData.user?.streak ?? rawData.user?.currentStreak;
      const xp = rawData.xp ?? rawData.user?.xp;
      const level = rawData.level ?? rawData.user?.level;
      const levelProgress = rawData.levelProgress ?? rawData.user?.levelProgress;

      return {
        success: true,
        streak,
        currentStreak: streak,
        xp,
        level,
        levelProgress,
        user: rawData.user || rawData.profile || null,
        data: rawData,
      };
    } catch (err: any) {
      console.warn(`[HABIT SERVICE] Backend completeHabit failed:`, err?.message || err);
      throw err;
    }
  },

  /**
   * Undoes a habit completion via authoritative POST /api/undo endpoint.
   */
  async undoHabit(habitId: string, dateStr?: string): Promise<any> {
    const fbUser = auth.currentUser || useStore.getState().firebaseUser;
    if (!fbUser) throw new Error("Not authenticated");

    const date = dateStr || getLocalCalendarDate();
    console.log(`[HABIT SERVICE] Undoing habit ${habitId} completion via POST /api/undo...`);
    try {
      const response = await apiClient.post(`/api/undo`, { habitId, date });
      const rawData = response.data || {};

      const streak = rawData.streak ?? rawData.currentStreak ?? rawData.user?.streak;
      const xp = rawData.xp ?? rawData.user?.xp;
      const level = rawData.level ?? rawData.user?.level;
      const levelProgress = rawData.levelProgress ?? rawData.user?.levelProgress;

      return {
        success: true,
        streak,
        currentStreak: streak,
        xp,
        level,
        levelProgress,
        user: rawData.user || rawData.profile || null,
        data: rawData,
      };
    } catch (err: any) {
      console.warn(`[HABIT SERVICE] Backend undoHabit failed:`, err?.message || err);
      throw err;
    }
  },
};
