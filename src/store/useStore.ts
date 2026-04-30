import { create } from 'zustand';
import { auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

const BACKEND_URL = "https://oneday-backend-xocv.onrender.com";

async function apiRequest(path: string, method = "GET", body: any = null) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No authentication token found");

  const res = await fetch(`${BACKEND_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: body ? JSON.stringify(body) : null
  });

  if (!res.ok) throw new Error(`API error: ${res.statusText}`);

  return res.json();
}

interface User {
  name: string;
  xp: number;
  streak: number;
  level: number;
  levelProgress: number; // 0-100
  freeze_until: string | null;
  lastActiveDate: string;
}

interface Habit {
  id: string;
  name: string;
  completedToday: boolean;
}

interface State {
  user: User | null;
  habits: Habit[];
  quote: string;
  loading: boolean;
  initialized: boolean;
  
  refreshFromBackend: () => Promise<void>;
  addHabit: (name: string) => Promise<void>;
  completeHabit: (habitId: string) => Promise<void>;
  freezeStreak: (days: number) => Promise<void>;
  sendChat: (message: string) => Promise<string>;
}

export const useStore = create<State>((set, get) => ({
  user: null,
  habits: [],
  quote: "Discipline is the bridge between goals and accomplishment.",
  loading: false,
  initialized: false,

  refreshFromBackend: async () => {
    try {
      set({ loading: true });
      const [userData, habitsData] = await Promise.all([
        apiRequest("/api/user"),
        apiRequest("/api/habits")
      ]);

      set({ 
        user: userData, 
        habits: habitsData, 
        loading: false,
        initialized: true 
      });
      
      // Update dynamic quote after refresh
      const streak = userData.streak;
      if (streak >= 7) set({ quote: "You’re ahead of 99%. Don’t slow down." });
      else if (streak === 0) set({ quote: "One day broke. Don't let two." });
      else if (userData.freeze_until && new Date(userData.freeze_until) > new Date()) set({ quote: "You paused. Don’t quit." });
      else set({ quote: "The best time to start was yesterday. The second best time is now." });

    } catch (error) {
      console.error("Refresh failed:", error);
      set({ loading: false });
    }
  },

  addHabit: async (name: string) => {
    try {
      await apiRequest("/api/habit", "POST", { name });
      await get().refreshFromBackend();
    } catch (e) {
      console.error(e);
      throw e;
    }
  },

  completeHabit: async (habitId: string) => {
    try {
      await apiRequest("/api/complete", "POST", { habit_id: habitId });
      await get().refreshFromBackend();
    } catch (e) {
      console.error(e);
      throw e;
    }
  },

  freezeStreak: async (days: number) => {
    try {
      await apiRequest("/api/freeze", "POST", { days });
      await get().refreshFromBackend();
    } catch (e) {
      console.error(e);
      throw e;
    }
  },

  sendChat: async (message: string) => {
    try {
      const data = await apiRequest("/api/chat", "POST", { message });
      return data.reply;
    } catch (e) {
      console.error(e);
      throw e;
    }
  }
}));

onAuthStateChanged(auth, async (fbUser) => {
  if (fbUser) {
    const token = await fbUser.getIdToken();
    localStorage.setItem("token", token);
    await useStore.getState().refreshFromBackend();
  } else {
    localStorage.removeItem("token");
    useStore.setState({ user: null, habits: [], initialized: true });
  }
});
