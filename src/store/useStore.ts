import { create } from 'zustand';
import { auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

const BACKEND_URL = "https://oneday-backend-xocv.onrender.com";

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
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      set({ loading: true });
      const [userRes, habitsRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/user`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${BACKEND_URL}/api/habits`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (!userRes.ok || !habitsRes.ok) throw new Error("Sync failed");

      const userData = await userRes.json();
      const habitsData = await habitsRes.json();

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
    const token = localStorage.getItem("token");
    await fetch(`${BACKEND_URL}/api/habit`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name })
    });
    await get().refreshFromBackend();
  },

  completeHabit: async (habitId: string) => {
    const token = localStorage.getItem("token");
    await fetch(`${BACKEND_URL}/api/complete`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ habit_id: habitId })
    });
    await get().refreshFromBackend();
  },

  freezeStreak: async (days: number) => {
    const token = localStorage.getItem("token");
    await fetch(`${BACKEND_URL}/api/freeze`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ days })
    });
    await get().refreshFromBackend();
  },

  sendChat: async (message: string) => {
    const token = localStorage.getItem("token");
    const res = await fetch(`${BACKEND_URL}/api/chat`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message })
    });
    const data = await res.json();
    return data.reply;
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
