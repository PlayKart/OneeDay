// src/services/userService.ts

import { apiClient } from "../api/client";
import { User } from "../types";
import { normalizeUser } from "../utils";

export const userService = {
  async getUserProfile(): Promise<User> {
    const res = await apiClient.get<User | { user: User }>("/api/me");
    return normalizeUser(res.data);
  },

  async updateProfile(data: Partial<User>): Promise<User> {
    const res = await apiClient.patch<User | { user: User }>("/api/me", data);
    return normalizeUser(res.data);
  },

  async freezeStreak(days: number): Promise<User> {
    const res = await apiClient.post<User | { user: User }>("/api/freeze-streak", { days });
    return normalizeUser(res.data);
  },

  async deactivateFreeze(): Promise<User> {
    const res = await apiClient.post<User | { user: User }>("/api/deactivate-freeze");
    const user = normalizeUser(res.data);
    user.freezeUntil = null;
    user.freeze_until = null;
    return user;
  },

  async resetProgress(): Promise<void> {
    await apiClient.post("/api/reset");
  },

  async deleteAccount(): Promise<void> {
    await apiClient.delete("/api/account");
  },
};
