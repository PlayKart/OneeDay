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
        Authorization: `Bearer ${token}`
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
  name: string
  xp: number
  streak: number
  level: number
  levelProgress: number
  freeze_until: string | null
  lastActiveDate: string
}

interface Habit {
  id: string
  name: string
  completedToday: boolean
}

interface State {
  firebaseUser: FirebaseUser | null
  user: BackendUser | null
  habits: Habit[]
  quote: string
  initialized: boolean
  loading: boolean
  backendError: string | null

  refreshFromBackend: () => Promise<void>
  addHabit: (name: string) => Promise<void>
  completeHabit: (habitId: string) => Promise<void>
  freezeStreak: (days: number) => Promise<void>
  sendChat: (message: string) => Promise<string>
}

export const useStore = create<State>((set, get) => ({
  firebaseUser: null,
  user: null,
  habits: [],
  quote: "Discipline is the choice between what you want now and what you want most.",
  initialized: false,
  loading: false,
  backendError: null,

  refreshFromBackend: async () => {
    try {
      set({ loading: true, backendError: null })

      const [userData, habitsData] = await Promise.all([
        apiRequest("/api/user"),
        apiRequest("/api/habits")
      ])

      const streak = userData.streak;
      let quote = "The best time to start was yesterday. The second best time is now.";
      if (streak >= 7) quote = "You’re ahead of 99%. Don’t slow down.";
      else if (streak === 0) quote = "One day broke. Don't let two.";

      set({
        user: userData,
        habits: habitsData,
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

  addHabit: async (name: string) => {
    await apiRequest("/api/habit", "POST", { name })
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
