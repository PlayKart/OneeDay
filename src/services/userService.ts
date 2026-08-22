import { User } from "../types";
import { normalizeUser, normalizeGenderValue } from "../utils";
import { useStore } from "../store/useStore";
import { auth } from "../lib/firebase";
import { apiClient } from "../api/client";

export const userService = {
  /**
   * Fetches authoritative user profile from backend API (backed by Supabase).
   */
  async getUserProfile(existingUser?: User): Promise<User> {
    const fbUser = auth.currentUser || useStore.getState().firebaseUser;
    if (!fbUser) throw new Error("Not authenticated");

    const currentStoreUser = existingUser || useStore.getState().user;
    const profileStart = performance.now();

    try {
      const response = await apiClient.get("/api/profile");
      const profileDuration = Math.round(performance.now() - profileStart);
      console.log(`[PERF] backend getUserProfile: ${profileDuration}ms`);

      const rawData = response.data || {};
      const userData = rawData.user || rawData.profile || rawData.data || rawData;

      const normalized = normalizeUser(
        {
          ...userData,
          id: fbUser.uid,
          userId: fbUser.uid,
          email: fbUser.email || userData.email || "",
          photoUrl: fbUser.photoURL || userData.photoUrl || currentStoreUser?.photoUrl || "",
        },
        currentStoreUser || undefined
      );

      return normalized;
    } catch (err: any) {
      console.warn(`[USER SERVICE] Backend getUserProfile failed:`, err?.message || err);

      // If store already has a valid user profile, fallback gracefully to store state
      if (currentStoreUser && currentStoreUser.onboarded !== undefined) {
        return currentStoreUser;
      }

      throw err;
    }
  },

  /**
   * Updates user profile on backend API & Supabase.
   */
  async updateProfile(data: Partial<User> & Record<string, any>): Promise<User> {
    const fbUser = auth.currentUser || useStore.getState().firebaseUser;
    if (!fbUser) throw new Error("Not authenticated");

    if (data.gender !== undefined) {
      data.gender = normalizeGenderValue(data.gender);
    }

    const whyValue = data.why_oneday ?? data.whyOneday ?? data.reasonForJoining ?? data.reason;
    if (whyValue !== undefined && whyValue !== null) {
      const cleanWhy = String(whyValue).trim();
      data.why_oneday = cleanWhy;
      data.whyOneday = cleanWhy;
      data.reasonForJoining = cleanWhy;
    }

    const currentUser = useStore.getState().user;
    const payload = {
      ...data,
      userId: fbUser.uid,
      id: fbUser.uid,
      email: fbUser.email || currentUser?.email || "",
      updatedAt: new Date().toISOString(),
    };

    try {
      const response = await apiClient.post("/api/profile", payload);
      const rawData = response.data || {};
      const updatedBackendUser = rawData.user || rawData.profile || rawData.data || rawData;

      const mergedUser = normalizeUser(
        {
          ...currentUser,
          ...payload,
          ...updatedBackendUser,
          id: fbUser.uid,
          userId: fbUser.uid,
        },
        currentUser || undefined
      );

      return mergedUser;
    } catch (err: any) {
      console.warn(`[USER SERVICE] Backend updateProfile failed:`, err?.message || err);

      const mergedUser = normalizeUser(
        { ...currentUser, ...payload, id: fbUser.uid, userId: fbUser.uid },
        currentUser || undefined
      );
      return mergedUser;
    }
  },

  /**
   * Retrieves current onboarding step from backend user profile.
   */
  async getOnboardingStep(): Promise<number> {
    try {
      const user = await this.getUserProfile();
      return user.onboardingStep || 1;
    } catch (err: any) {
      console.warn(`[USER SERVICE] getOnboardingStep failed:`, err?.message || err);
      return 1;
    }
  },

  /**
   * Updates onboarding step on backend.
   */
  async updateOnboardingStep(step: number): Promise<User> {
    return this.updateProfile({ onboardingStep: step, step });
  },

  /**
   * Freezes streak for N days on backend profile.
   */
  async freezeStreak(days: number): Promise<User> {
    const freezeUntil = new Date();
    freezeUntil.setDate(freezeUntil.getDate() + days);
    return this.updateProfile({ freezeUntil: freezeUntil.toISOString() });
  },

  /**
   * Deactivates freeze.
   */
  async deactivateFreeze(): Promise<User> {
    return this.updateProfile({ freezeUntil: null, freeze_until: null });
  },

  /**
   * Resets progress on backend.
   */
  async resetProgress(): Promise<void> {
    await this.updateProfile({ xp: 0, level: 1, streak: 0, currentStreak: 0 });
  },

  /**
   * Deletes user account.
   */
  async deleteAccount(): Promise<void> {
    const fbUser = auth.currentUser;
    if (!fbUser) return;

    try {
      await apiClient.delete("/api/user");
      await fbUser.delete();
    } catch (err: any) {
      console.warn(`[USER SERVICE] deleteAccount failed:`, err?.message || err);
    }
  },
};
