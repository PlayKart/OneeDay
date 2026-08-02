// src/services/userService.ts

import { apiClient } from "../api/client";
import { User } from "../types";

export const userService = {
  async getUserProfile(): Promise<User> {
    const res = await apiClient.get<User | { user: User }>("/api/me");
    const u: any = (res.data as any)?.user || res.data;
    return {
      id: u.id || u.userId || "user_me",
      userId: u.userId || u.id,
      name: u.name || u.displayName || "Striker",
      email: u.email || "",
      xp: u.xp ?? 0,
      streak: u.streak ?? 0,
      level: u.level ?? 1,
      levelProgress: u.levelProgress ?? u.level_progress ?? 0,
      freezeUntil: u.freezeUntil || u.freeze_until || null,
      freeze_until: u.freeze_until || u.freezeUntil || null,
      lastActiveDate: u.lastActiveDate || u.last_active_date || null,
    };
  },

  async freezeStreak(days: number): Promise<User> {
    const res = await apiClient.post<User | { user: User }>("/api/freeze-streak", { days });
    const u: any = (res.data as any)?.user || res.data;
    return {
      id: u.id || u.userId || "user_me",
      userId: u.userId || u.id,
      name: u.name || "Striker",
      xp: u.xp ?? 0,
      streak: u.streak ?? 0,
      level: u.level ?? 1,
      levelProgress: u.levelProgress ?? u.level_progress ?? 0,
      freezeUntil: u.freezeUntil || u.freeze_until || null,
      freeze_until: u.freeze_until || u.freezeUntil || null,
      lastActiveDate: u.lastActiveDate || u.last_active_date || null,
    };
  },

  async deactivateFreeze(): Promise<User> {
    const res = await apiClient.post<User | { user: User }>("/api/deactivate-freeze");
    const u: any = (res.data as any)?.user || res.data;
    return {
      id: u.id || u.userId || "user_me",
      userId: u.userId || u.id,
      name: u.name || "Striker",
      xp: u.xp ?? 0,
      streak: u.streak ?? 0,
      level: u.level ?? 1,
      levelProgress: u.levelProgress ?? u.level_progress ?? 0,
      freezeUntil: null,
      freeze_until: null,
      lastActiveDate: u.lastActiveDate || u.last_active_date || null,
    };
  },

  async resetProgress(): Promise<void> {
    await apiClient.post("/api/reset-progress");
  },

  async deleteAccount(): Promise<void> {
    await apiClient.delete("/api/delete-account");
  },
};
