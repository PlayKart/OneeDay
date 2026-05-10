// src/store/useStore.ts

import { create } from 'zustand'
import { auth } from '../lib/firebase'
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth'
import { toast } from 'react-hot-toast'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "https://oneday-backend-xocv.onrender.com";

async function apiRequest(path: string, method = "GET", body: any = null, isRetry = false): Promise<any> {
  const user = auth.currentUser
  if (!user) throw new Error("Auth required")

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const token = await user.getIdToken(isRetry)

    const res = await fetch(`${BACKEND_URL}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "x-local-date": new Date().toISOString().split("T")[0]
      },
      body: body ? JSON.stringify(body) : null,
      signal: controller.signal
    })

    if (res.status === 401 && !isRetry) {
      return apiRequest(path, method, body, true)
    }

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.error || "API error")
    }

    return res.json()
  } catch (err: any) {
    if (err.name === 'AbortError') throw new Error("Connection Timeout")
    throw err
  } finally {
    clearTimeout(timeoutId)
  }
}

interface BackendUser {
  id: string
  name: string
  xp: number
  streak: number
  level: number
  levelProgress: number
  freeze_until: string | null
  lastActiveDate: string | null
}

export interface Habit {
  id: string
  userId: string
  name: string
  createdAt: string
  completedToday: boolean
  icon?: string
  category?: string
  difficulty?: string
  reminderTime?: string
  notes?: string
  repeatType?: "every_day" | "weekdays" | "weekends" | "custom_days"
  customDays?: string[]
}

export type TabState = "dashboard" | "habits" | "coach" | "settings"

interface State {
  firebaseUser: FirebaseUser | null
  user: BackendUser | null
  habits: Habit[]
  quote: string
  initialized: boolean
  loading: boolean
  backendError: string | null
  activeTab: TabState

  setActiveTab: (tab: TabState) => void
  refreshFromBackend: () => Promise<void>
  addHabit: (habitData: Partial<Habit>) => Promise<void>
  completeHabit: (habitId: string) => Promise<void>
  freezeStreak: (days: number) => Promise<void>
  sendChat: (message: string) => Promise<string>
  resetProgress: () => Promise<void>
  deleteAccount: () => Promise<void>
}

export const useStore = create<State>((set, get) => ({
  firebaseUser: null,
  user: null,
  habits: [],
  quote: "Discipline is the choice between what you want now and what you want most.",
  initialized: false,
  loading: false,
  backendError: null,
  activeTab: "dashboard",

  setActiveTab: (tab) => set({ activeTab: tab }),

  refreshFromBackend: async () => {
    try {
      set({ loading: true, backendError: null })

      const [userData, habitsData] = await Promise.all([
        apiRequest("/api/user"),
        apiRequest("/api/habits")
      ])

      if (!userData) {
        throw new Error("Backend returned no user data. Ensure your backend handles anonymous users or check your backend logs.");
      }

      const streak = userData.streak || 0;
      
      const currentUser = auth.currentUser;
      const enrichedHabits = (habitsData || []).map((h: any) => {
         if (currentUser && h.name) {
            const key = `habit_meta_${currentUser.uid}_${h.name}`;
            try {
               const metaStr = localStorage.getItem(key);
               if (metaStr) {
                  const meta = JSON.parse(metaStr);
                  return { ...h, ...meta };
               }
            } catch (e) {
               console.error("Failed to parse habit meta", e);
            }
         }
         return h;
      });

      const HOUR_IN_MS = 60 * 60 * 1000;
      const now = Date.now();
      let quote = "Discipline is the choice between what you want now and what you want most.";
      
      try {
        const lastQuoteTime = localStorage.getItem("lastQuoteTime");
        const cachedQuote = localStorage.getItem("cachedQuote");
        
        if (lastQuoteTime && cachedQuote && now - parseInt(lastQuoteTime) < HOUR_IN_MS) {
           quote = cachedQuote;
        } else {
           // We need a dynamic import to avoid failing if not used, or just import it at top
           const { generateQuote } = await import("../lib/geminiService");
           quote = await generateQuote(streak, habitsData || []);
           localStorage.setItem("lastQuoteTime", now.toString());
           localStorage.setItem("cachedQuote", quote);
        }
      } catch (e) {
         console.error("Quote generation failed", e);
         if (streak >= 7) quote = "You’re ahead of 99%. Don’t slow down.";
         else if (streak === 0) quote = "One day broke. Don't let two.";
      }

      set({
        user: userData,
        habits: enrichedHabits,
        quote,
        loading: false,
        initialized: true
      })
    } catch (err: any) {
      set({
        loading: false,
        initialized: true,
        backendError: err.message
      })
    }
  },

  addHabit: async (habitData) => {
    const payload = {
      name: habitData.name,
      repeatType: habitData.repeatType,
      customDays: habitData.customDays
    };
    await apiRequest("/api/habit", "POST", payload)
    
    // Save metadata to localStorage as fallback
    const user = auth.currentUser;
    if (user && habitData.name) {
       const key = `habit_meta_${user.uid}_${habitData.name}`;
       localStorage.setItem(key, JSON.stringify({
          repeatType: habitData.repeatType,
          customDays: habitData.customDays,
          icon: habitData.icon,
          category: habitData.category
       }));
    }

    await get().refreshFromBackend()
  },

  completeHabit: async (habitId: string) => {
    await apiRequest("/api/complete", "POST", { habit_id: habitId })
    await get().refreshFromBackend()
  },

  freezeStreak: async (days: number) => {
    await apiRequest("/api/freeze", "POST", { days })
    await get().refreshFromBackend()
  },

  sendChat: async (message: string) => {
    const data = await apiRequest("/api/chat", "POST", { message })
    return data.reply
  },

  resetProgress: async () => {
    try {
      await apiRequest("/api/reset", "POST")
      await get().refreshFromBackend()
      toast.success("Progress reset successfully")
    } catch {
       toast.error("Endpoint /api/reset is missing from your backend.");
    }
  },

  deleteAccount: async () => {
    try {
      await apiRequest("/api/account", "DELETE")
    } catch {
       toast.error("Endpoint /api/account is missing from your backend.");
    }
    const fbUser = auth.currentUser
    if (fbUser) await fbUser.delete()
    set({ user: null, firebaseUser: null, habits: [] })
  }
}))

onAuthStateChanged(auth, async (fbUser) => {
  if (fbUser) {
    useStore.setState({
      firebaseUser: fbUser,
      initialized: true
    })

    await useStore.getState().refreshFromBackend()
  } else {
    useStore.setState({
      firebaseUser: null,
      user: null,
      habits: [],
      initialized: true,
      loading: false,
      backendError: null
    })
  }
})
