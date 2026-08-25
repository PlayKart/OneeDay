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
      const response = await apiClient.get("/api/users");
      const profileDuration = Math.round(performance.now() - profileStart);
      console.log(`[PERF] backend getUserProfile via GET /api/users: ${profileDuration}ms`);

      const rawData = response.data || {};
      const userData =
        rawData.user ||
        rawData.profile ||
        rawData.data?.user ||
        rawData.data?.profile ||
        rawData.data ||
        rawData.result ||
        rawData;

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
   * Updates user profile on backend API.
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
      // If updating onboarding step specifically, use the dedicated contract endpoint
      if (data.onboardingStep !== undefined && Object.keys(data).length <= 2) {
        await apiClient.post("/api/onboarding/step", { step: data.onboardingStep });
      }

      const response = await apiClient.post("/api/onboarding", payload).catch(async () => {
        return await apiClient.get("/api/users");
      });
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
   * Retrieves current onboarding step via authoritative GET /api/onboarding/step endpoint.
   */
  async getOnboardingStep(): Promise<number> {
    try {
      const res = await apiClient.get("/api/onboarding/step");
      const raw = res.data || {};
      const step = raw.step ?? raw.onboardingStep ?? raw.data?.step;
      if (typeof step === "number") return step;
      const user = await this.getUserProfile();
      return user.onboardingStep || 1;
    } catch (err: any) {
      console.warn(`[USER SERVICE] getOnboardingStep failed:`, err?.message || err);
      return 1;
    }
  },

  /**
   * Updates onboarding step via authoritative POST /api/onboarding/step endpoint.
   */
  async updateOnboardingStep(step: number): Promise<User> {
    try {
      await apiClient.post("/api/onboarding/step", { step });
    } catch (err) {
      console.warn("[USER SERVICE] updateOnboardingStep POST /api/onboarding/step failed:", err);
    }
    return this.updateProfile({ onboardingStep: step, step });
  },

  /**
   * Freezes streak for N days via authoritative POST /api/freeze endpoint.
   */
  async freezeStreak(days: number): Promise<User> {
    try {
      const res = await apiClient.post("/api/freeze", { days });
      const rawData = res.data || {};
      const updatedUser = rawData.user || rawData.profile || rawData;
      return normalizeUser(updatedUser, useStore.getState().user || undefined);
    } catch (err: any) {
      console.warn("[USER SERVICE] POST /api/freeze failed:", err?.message || err);
      const freezeUntil = new Date();
      freezeUntil.setDate(freezeUntil.getDate() + days);
      return this.updateProfile({ freezeUntil: freezeUntil.toISOString() });
    }
  },

  /**
   * Deactivates freeze via POST /api/freeze endpoint (0 days / unfreeze).
   */
  async deactivateFreeze(): Promise<User> {
    try {
      const res = await apiClient.post("/api/freeze", { days: 0 });
      const rawData = res.data || {};
      const updatedUser = rawData.user || rawData.profile || rawData;
      return normalizeUser(updatedUser, useStore.getState().user || undefined);
    } catch (err) {
      return this.updateProfile({ freezeUntil: null, freeze_until: null });
    }
  },

  /**
   * Resets progress via authoritative POST /api/reset endpoint.
   */
  async resetProgress(): Promise<void> {
    try {
      await apiClient.post("/api/reset");
    } catch (err: any) {
      console.warn("[USER SERVICE] POST /api/reset failed:", err?.message || err);
      await this.updateProfile({ xp: 0, level: 1, streak: 0, currentStreak: 0 });
    }
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
