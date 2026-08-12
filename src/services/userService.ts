// src/services/userService.ts

import { apiClient } from "../api/client";
import { User } from "../types";
import { normalizeUser } from "../utils";
import { useStore } from "../store/useStore";

export const userService = {
  async getUserProfile(existingUser?: User): Promise<User> {
    const res = await apiClient.get<User | { user: User }>("/api/users");
    return normalizeUser(res.data, existingUser || useStore.getState().user || undefined);
  },

  async updateProfile(data: Partial<User>): Promise<User> {
    const res = await apiClient.post<User | { user: User }>("/api/onboarding", data);
    return normalizeUser(res.data, useStore.getState().user || undefined);
  },

  async getOnboardingStep(): Promise<number> {
    const res = await apiClient.get<{ step?: number; onboardingStep?: number; onboarding_step?: number }>("/api/onboarding/step");
    const step = res.data?.step ?? res.data?.onboardingStep ?? res.data?.onboarding_step ?? 1;
    return typeof step === "number" ? step : parseInt(String(step), 10) || 1;
  },

  async updateOnboardingStep(step: number): Promise<User> {
    const res = await apiClient.post<User | { user: User }>("/api/onboarding/step", { step, onboardingStep: step });
    return normalizeUser(res.data, useStore.getState().user || undefined);
  },

  async freezeStreak(days: number): Promise<User> {
    const res = await apiClient.post<User | { user: User }>("/api/freeze", { days });
    return normalizeUser(res.data);
  },

  async deactivateFreeze(): Promise<User> {
    const res = await apiClient.post<User | { user: User }>("/api/freeze", { days: 0 });
    const user = normalizeUser(res.data);
    user.freezeUntil = null;
    user.freeze_until = null;
    return user;
  },

  async resetProgress(): Promise<void> {
    await apiClient.post("/api/reset");
  },

  async deleteAccount(): Promise<void> {
    // Backend API contract does not expose an account deletion endpoint.
    // Proceeding with Firebase auth deletion only.
  },
};
