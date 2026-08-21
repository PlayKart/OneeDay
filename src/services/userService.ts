import { User } from "../types";
import { normalizeUser, hasCompletedOnboarding, normalizeGenderValue } from "../utils";
import { useStore } from "../store/useStore";
import { auth, db } from "../lib/firebase";
import { doc, getDoc, setDoc, updateDoc, deleteDoc } from "firebase/firestore";

export const userService = {
  async getUserProfile(existingUser?: User): Promise<User> {
    const fbUser = auth.currentUser || useStore.getState().firebaseUser;
    if (!fbUser) throw new Error("Not authenticated");

    const profileStart = performance.now();
    const docPath = `users/${fbUser.uid}`;
    console.log(`[FIRESTORE DEBUG] Firestore document request started for ${docPath}`);

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
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      existingUser || useStore.getState().user || undefined
    );

    try {
      const docRef = doc(db, "users", fbUser.uid);
      const docSnap = await getDoc(docRef);

      const profileDuration = Math.round(performance.now() - profileStart);
      console.log(`[PERF] profile: ${profileDuration}ms`);

      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log(`[FIRESTORE DEBUG] Firestore document fetched successfully for ${docPath}`);
        return normalizeUser({ ...data, id: fbUser.uid, userId: fbUser.uid }, existingUser || useStore.getState().user || undefined);
      } else {
        console.log(`[FIRESTORE DEBUG] Firestore document does not exist for ${docPath}. Initializing document in background.`);
        // Background setDoc to seed document
        setDoc(docRef, { ...fallbackUser, uid: fbUser.uid, email: fbUser.email || "", createdAt: new Date().toISOString() }, { merge: true }).catch((err) => {
          console.warn(`[FIRESTORE DEBUG] Background setDoc for ${docPath} deferred:`, err?.message || err);
        });
        return fallbackUser;
      }
    } catch (err: any) {
      const profileDuration = Math.round(performance.now() - profileStart);
      console.log(`[PERF] profile: ${profileDuration}ms`);
      console.warn(`[FIRESTORE DEBUG] Firestore document request failed or client is offline for ${docPath}:`, err?.message || err);
      // Gracefully return local/cached user to ensure Firebase Auth completes independently without blocking UI
      return fallbackUser;
    }
  },

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

    const docPath = `users/${fbUser.uid}`;
    console.log(`[FIRESTORE DEBUG] Firestore updateProfile request started for ${docPath}`);
    const docRef = doc(db, "users", fbUser.uid);
    data.updatedAt = new Date().toISOString();

    const currentUser = useStore.getState().user;
    const mergedUser = normalizeUser({ ...currentUser, ...data, id: fbUser.uid, userId: fbUser.uid }, currentUser || undefined);

    try {
      await setDoc(docRef, { ...data, uid: fbUser.uid, email: fbUser.email || "", updatedAt: new Date().toISOString() }, { merge: true });
      console.log(`[FIRESTORE DEBUG] Firestore updateProfile write completed for ${docPath}`);
      return mergedUser;
    } catch (err: any) {
      console.warn(`[FIRESTORE DEBUG] Firestore updateProfile write failed or client is offline for ${docPath}:`, err?.message || err);
      return mergedUser;
    }
  },

  async getOnboardingStep(): Promise<number> {
    const fbUser = auth.currentUser;
    if (!fbUser) return 1;
    const docPath = `users/${fbUser.uid}`;
    console.log(`[FIRESTORE DEBUG] Firestore getOnboardingStep started for ${docPath}`);
    try {
      const docSnap = await getDoc(doc(db, "users", fbUser.uid));
      if (docSnap.exists()) {
        return docSnap.data().onboardingStep || 1;
      }
      return 1;
    } catch (err: any) {
      console.warn(`[FIRESTORE DEBUG] Firestore getOnboardingStep failed or client is offline for ${docPath}:`, err?.message || err);
      return 1;
    }
  },

  async updateOnboardingStep(step: number): Promise<User> {
    return this.updateProfile({ onboardingStep: step, step });
  },

  async freezeStreak(days: number): Promise<User> {
    const freezeUntil = new Date();
    freezeUntil.setDate(freezeUntil.getDate() + days);
    return this.updateProfile({ freezeUntil: freezeUntil.toISOString() });
  },

  async deactivateFreeze(): Promise<User> {
    return this.updateProfile({ freezeUntil: null, freeze_until: null });
  },

  async resetProgress(): Promise<void> {
    const fbUser = auth.currentUser;
    if (!fbUser) return;
    const docPath = `users/${fbUser.uid}`;
    console.log(`[FIRESTORE DEBUG] Firestore resetProgress started for ${docPath}`);
    try {
      await updateDoc(doc(db, "users", fbUser.uid), { xp: 0, level: 1, streak: 0 });
    } catch (err: any) {
      console.warn(`[FIRESTORE DEBUG] Firestore resetProgress failed or client is offline for ${docPath}:`, err?.message || err);
    }
  },

  async deleteAccount(): Promise<void> {
    const fbUser = auth.currentUser;
    if (!fbUser) return;
    const docPath = `users/${fbUser.uid}`;
    console.log(`[FIRESTORE DEBUG] Firestore deleteAccount started for ${docPath}`);
    try {
      await deleteDoc(doc(db, "users", fbUser.uid));
      await fbUser.delete();
    } catch (err: any) {
      console.warn(`[FIRESTORE DEBUG] Firestore deleteAccount failed or client is offline for ${docPath}:`, err?.message || err);
    }
  },
};

