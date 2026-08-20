import { Habit } from "../types";
import { safeArray } from "../utils";
import { auth, db } from "../lib/firebase";
import { collection, query, where, getDocs, doc, setDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { useStore } from "../store/useStore";

export const habitService = {
  async getHabits(): Promise<Habit[]> {
    const fbUser = auth.currentUser || useStore.getState().firebaseUser;
    if (!fbUser) return [];

    console.log(`[FIRESTORE DEBUG] Firestore getHabits request started for userId: ${fbUser.uid}`);
    try {
      const habitsRef = collection(db, "habits");
      const q = query(habitsRef, where("userId", "==", fbUser.uid));
      const snapshot = await getDocs(q);

      const today = new Date().toISOString().split("T")[0];
      
      // Also fetch completions
      let completions: any[] = [];
      try {
        const completionsRef = collection(db, "completions");
        const compQ = query(completionsRef, where("userId", "==", fbUser.uid));
        const compSnapshot = await getDocs(compQ);
        completions = compSnapshot.docs.map(d => d.data());
      } catch (cErr: any) {
        console.warn(`[FIRESTORE DEBUG] Fetch completions failed or offline:`, cErr?.message || cErr);
      }

      console.log(`[FIRESTORE DEBUG] Firestore getHabits fetched ${snapshot.docs.length} habits successfully.`);
      return snapshot.docs.map(docSnap => {
        const h = docSnap.data();
        const id = docSnap.id;
        
        const habitComps = completions.filter(c => c.habitId === id);
        const completedDates = habitComps.map(c => c.date);
        const finalCompletedToday = completedDates.includes(today);

        return {
          id: String(id),
          name: h.title || h.name || "Unnamed Habit",
          completedToday: finalCompletedToday,
          completedDates: completedDates,
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
      console.warn(`[FIRESTORE DEBUG] Firestore getHabits failed or client is offline:`, err?.message || err);
      return useStore.getState().habits || [];
    }
  },

  async createHabit(habitData: any): Promise<Habit> {
    const fbUser = auth.currentUser || useStore.getState().firebaseUser;
    if (!fbUser) throw new Error("Not authenticated");

    if (!habitData.name?.trim()) {
      throw new Error("Habit name is required");
    }

    const payload = {
      userId: fbUser.uid,
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
      createdAt: new Date().toISOString()
    };

    const newDocRef = doc(collection(db, "habits"));
    const createdHabit: Habit = {
      id: newDocRef.id,
      name: payload.name,
      completedToday: false,
      completedDates: [],
      repeatType: payload.repeatType,
      customDays: payload.customDays,
      difficulty: payload.difficulty,
      notes: payload.notes,
      icon: payload.icon,
      category: payload.category,
      reminderTime: payload.reminderTime,
    };

    console.log(`[FIRESTORE DEBUG] Firestore createHabit request started for habit ID: ${newDocRef.id}`);
    try {
      await setDoc(newDocRef, payload);
      console.log(`[FIRESTORE DEBUG] Firestore createHabit successful for ${newDocRef.id}`);
      return createdHabit;
    } catch (err: any) {
      console.warn(`[FIRESTORE DEBUG] Firestore createHabit write failed or client is offline for ${newDocRef.id}:`, err?.message || err);
      return createdHabit;
    }
  },

  async updateHabit(habitId: string, habitData: Partial<Habit>): Promise<Habit> {
    const fbUser = auth.currentUser || useStore.getState().firebaseUser;
    if (!fbUser) throw new Error("Not authenticated");

    const payload: any = {};
    if (habitData.name) { payload.name = habitData.name; payload.title = habitData.name; }
    if (habitData.repeatType) payload.repeatType = habitData.repeatType;
    if (habitData.customDays) payload.customDays = habitData.customDays;
    if (habitData.difficulty) payload.difficulty = habitData.difficulty;
    if (habitData.notes !== undefined) { payload.notes = habitData.notes; payload.description = habitData.notes; }
    if (habitData.icon) payload.icon = habitData.icon;
    if (habitData.category) { payload.category = habitData.category; payload.color = habitData.category; }
    if (habitData.reminderTime !== undefined) payload.reminderTime = habitData.reminderTime;

    const docPath = `habits/${habitId}`;
    console.log(`[FIRESTORE DEBUG] Firestore updateHabit request started for ${docPath}`);
    try {
      const docRef = doc(db, "habits", habitId);
      await updateDoc(docRef, payload);
      console.log(`[FIRESTORE DEBUG] Firestore updateHabit write successful for ${docPath}`);
      return { id: habitId, ...payload } as any;
    } catch (err: any) {
      console.warn(`[FIRESTORE DEBUG] Firestore updateHabit write failed or client is offline for ${docPath}:`, err?.message || err);
      return { id: habitId, ...payload } as any;
    }
  },

  async deleteHabit(habitId: string): Promise<void> {
    const docPath = `habits/${habitId}`;
    console.log(`[FIRESTORE DEBUG] Firestore deleteHabit request started for ${docPath}`);
    try {
      await deleteDoc(doc(db, "habits", habitId));
      console.log(`[FIRESTORE DEBUG] Firestore deleteHabit successful for ${docPath}`);
    } catch (err: any) {
      console.warn(`[FIRESTORE DEBUG] Firestore deleteHabit failed or client is offline for ${docPath}:`, err?.message || err);
    }
  },

  async completeHabit(habitId: string): Promise<any> {
    const fbUser = auth.currentUser || useStore.getState().firebaseUser;
    if (!fbUser) throw new Error("Not authenticated");
    const today = new Date().toISOString().split("T")[0];
    const compId = `${fbUser.uid}_${habitId}_${today}`;
    const docPath = `completions/${compId}`;
    console.log(`[FIRESTORE DEBUG] Firestore completeHabit request started for ${docPath}`);
    try {
      await setDoc(doc(db, "completions", compId), {
        userId: fbUser.uid,
        habitId: habitId,
        date: today,
        timestamp: new Date().toISOString()
      });
      console.log(`[FIRESTORE DEBUG] Firestore completeHabit write successful for ${docPath}`);
      return { success: true };
    } catch (err: any) {
      console.warn(`[FIRESTORE DEBUG] Firestore completeHabit write failed or client is offline for ${docPath}:`, err?.message || err);
      return { success: true, offline: true };
    }
  },

  async undoHabit(habitId: string): Promise<any> {
    const fbUser = auth.currentUser || useStore.getState().firebaseUser;
    if (!fbUser) throw new Error("Not authenticated");
    const today = new Date().toISOString().split("T")[0];
    const compId = `${fbUser.uid}_${habitId}_${today}`;
    const docPath = `completions/${compId}`;
    console.log(`[FIRESTORE DEBUG] Firestore undoHabit request started for ${docPath}`);
    try {
      await deleteDoc(doc(db, "completions", compId));
      console.log(`[FIRESTORE DEBUG] Firestore undoHabit delete successful for ${docPath}`);
      return { success: true };
    } catch (err: any) {
      console.warn(`[FIRESTORE DEBUG] Firestore undoHabit delete failed or client is offline for ${docPath}:`, err?.message || err);
      return { success: true, offline: true };
    }
  },
};

