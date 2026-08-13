// src/services/userService.ts

import { apiClient } from "../api/client";
import { User } from "../types";
import { normalizeUser, hasCompletedOnboarding } from "../utils";
import { useStore } from "../store/useStore";
import { auth } from "../lib/firebase";

export const userService = {
  async getUserProfile(existingUser?: User): Promise<User> {
    console.error("[SYNC 4] GET /api/users started");
    try {
      const res = await apiClient.get<User | { user: User }>("/api/users");
      console.error("[SYNC 5] Raw /api/users response:", res.data);
      const userObj = normalizeUser(res.data, existingUser || useStore.getState().user || undefined);
      console.error("[SYNC 6] Normalized /api/users data:", userObj);
      console.error("[SYNC 7] User object:", userObj);
      console.error("[SYNC 8] Profile object:", userObj);
      console.error("[SYNC 9] Onboarding state:", hasCompletedOnboarding(userObj));
      return userObj;
    } catch (err: any) {
      console.error("[SYNC ERROR]", err);
      console.error("[SYNC ERROR STACK]", err?.stack);

      const fbUser = auth.currentUser;
      const errorMsg = err?.message || String(err);
      const isMissingBackendUser =
        errorMsg.includes("reading 'length'") ||
        errorMsg.includes("Failed to retrieve user record") ||
        err?.response?.status === 404;

      if (fbUser && isMissingBackendUser) {
        console.warn("[userService] Backend user record missing/uninitialized for authenticated Firebase user. Creating un-onboarded fallback profile.", fbUser.uid);
        const fallbackUser = normalizeUser(
          {
            id: fbUser.uid,
            userId: fbUser.uid,
            email: fbUser.email || "",
            name: fbUser.displayName || "User",
            photoUrl: fbUser.photoURL || "",
            needsOnboarding: true,
            onboarded: false,
            hasCompletedOnboarding: false,
            onboardingStep: 1,
            streak: 0,
            xp: 0,
            level: 1,
            habits: [],
            hobbies: [],
            sports: [],
          },
          existingUser || useStore.getState().user || undefined
        );
        console.error("[SYNC 6] Normalized /api/users data (fallback):", fallbackUser);
        console.error("[SYNC 7] User object (fallback):", fallbackUser);
        console.error("[SYNC 8] Profile object (fallback):", fallbackUser);
        console.error("[SYNC 9] Onboarding state (fallback):", hasCompletedOnboarding(fallbackUser));
        return fallbackUser;
      }

      throw err;
    }
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
