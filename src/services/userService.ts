import { User } from "../types";
import { normalizeUser, hasCompletedOnboarding, normalizeGenderValue } from "../utils";
import { useStore } from "../store/useStore";
import { auth } from "../lib/firebase";
import { getFirestore, doc, getDoc, setDoc, updateDoc, deleteDoc } from "firebase/firestore";

const db = getFirestore();

export const userService = {
  async getUserProfile(existingUser?: User): Promise<User> {
    try {
      const fbUser = auth.currentUser;
      if (!fbUser) throw new Error("Not authenticated");

      const docRef = doc(db, "users", fbUser.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        return normalizeUser({ ...data, id: fbUser.uid, userId: fbUser.uid }, existingUser || useStore.getState().user || undefined);
      } else {
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
        return fallbackUser;
      }
    } catch (err: any) {
      console.error("[SYNC ERROR]", err);
      throw err;
    }
  },

  async updateProfile(data: Partial<User> & Record<string, any>): Promise<User> {
    const fbUser = auth.currentUser;
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

    const docRef = doc(db, "users", fbUser.uid);
    const docSnap = await getDoc(docRef);
    
    data.updatedAt = new Date().toISOString();

    if (docSnap.exists()) {
      await updateDoc(docRef, data);
    } else {
      await setDoc(docRef, { ...data, uid: fbUser.uid, createdAt: new Date().toISOString() }, { merge: true });
    }

    const updatedSnap = await getDoc(docRef);
    return normalizeUser({ ...updatedSnap.data(), id: fbUser.uid }, useStore.getState().user || undefined);
  },

  async getOnboardingStep(): Promise<number> {
    const fbUser = auth.currentUser;
    if (!fbUser) return 1;
    const docSnap = await getDoc(doc(db, "users", fbUser.uid));
    if (docSnap.exists()) {
      return docSnap.data().onboardingStep || 1;
    }
    return 1;
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
    await updateDoc(doc(db, "users", fbUser.uid), { xp: 0, level: 1, streak: 0 });
  },

  async deleteAccount(): Promise<void> {
    const fbUser = auth.currentUser;
    if (!fbUser) return;
    await deleteDoc(doc(db, "users", fbUser.uid));
    await fbUser.delete();
  },
};
