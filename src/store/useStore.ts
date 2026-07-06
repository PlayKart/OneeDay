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
  isLocalFallback: boolean

  setActiveTab: (tab: TabState) => void
  refreshFromBackend: () => Promise<void>
  addHabit: (habitData: Partial<Habit>) => Promise<void>
  editHabit: (habitId: string, habitData: Partial<Habit>) => Promise<void>
  deleteHabit: (habitId: string) => Promise<void>
  completeHabit: (habitId: string) => Promise<void>
  undoHabit: (habitId: string) => Promise<void>
  freezeStreak: (days: number) => Promise<void>
  deactivateFreeze: () => Promise<void>
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
  isLocalFallback: false,

  setActiveTab: (tab) => set({ activeTab: tab }),

  refreshFromBackend: async () => {
    try {
      set({ loading: true, backendError: null })

      const currentUser = auth.currentUser;
      if (!currentUser) {
        set({ loading: false, initialized: true, isLocalFallback: false });
        return;
      }

      let userData: any = null;
      let habitsData: any = null;
      let usedLocalFallback = false;

      try {
        [userData, habitsData] = await Promise.all([
          apiRequest("/api/user"),
          apiRequest("/api/habits")
        ]);
        set({ isLocalFallback: false });
      } catch (backendErr: any) {
        console.warn("Backend connection failed, initiating local storage fallback mode.", backendErr);
        usedLocalFallback = true;
        
        // Load local user
        const userKey = `oneday_local_user_${currentUser.uid}`;
        let localUser = JSON.parse(localStorage.getItem(userKey) || "null");
        if (!localUser) {
          localUser = {
            id: currentUser.uid,
            name: currentUser.displayName || currentUser.email?.split("@")[0] || "Discipline Enthusiast",
            xp: 0,
            streak: 0,
            level: 1,
            levelProgress: 0,
            freeze_until: null,
            lastActiveDate: new Date().toISOString().split("T")[0]
          };
          localStorage.setItem(userKey, JSON.stringify(localUser));
        }

        // Load local habits
        const habitsKey = `oneday_local_habits_${currentUser.uid}`;
        let localHabits = JSON.parse(localStorage.getItem(habitsKey) || "[]");
        if (!localHabits || localHabits.length === 0) {
          localHabits = [
            {
              id: "local_h_1",
              userId: currentUser.uid,
              name: "Morning Sunlight & Breath",
              createdAt: new Date().toISOString(),
              completedToday: false,
              icon: "sun",
              category: "health",
              difficulty: "easy"
            },
            {
              id: "local_h_2",
              userId: currentUser.uid,
              name: "Deep Work Protocol (90 Min)",
              createdAt: new Date().toISOString(),
              completedToday: false,
              icon: "brain",
              category: "productivity",
              difficulty: "hard"
            }
          ];
          localStorage.setItem(habitsKey, JSON.stringify(localHabits));
        }

        userData = localUser;
        habitsData = localHabits;
        set({ isLocalFallback: true });
      }

      if (!userData) {
        throw new Error("Backend returned no user data. Ensure your backend handles anonymous users or check your backend logs.");
      }

      // Timezone-aware local day streak calculation & correction
      const getFormattedLocalDate = (dateInput?: Date | string | number | null) => {
        if (!dateInput) return "";
        const d = new Date(dateInput);
        if (isNaN(d.getTime())) return "";
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      let effectiveStreak = userData.streak || 0;
      if (userData.lastActiveDate) {
        const todayStr = getFormattedLocalDate(new Date());
        const lastActiveStr = getFormattedLocalDate(userData.lastActiveDate);

        if (todayStr && lastActiveStr) {
          const tDate = new Date(todayStr + "T00:00:00");
          const lDate = new Date(lastActiveStr + "T00:00:00");
          const diffTime = tDate.getTime() - lDate.getTime();
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

          const isCurrentlyFrozen = userData.freeze_until && new Date(userData.freeze_until) > new Date();

          if (diffDays > 1 && !isCurrentlyFrozen) {
            // Streak broken due to inactivity
            effectiveStreak = 0;
            // Write update to local storage if running locally
            if (usedLocalFallback) {
              const userKey = `oneday_local_user_${currentUser.uid}`;
              const localUser = JSON.parse(localStorage.getItem(userKey) || "null");
              if (localUser) {
                localUser.streak = 0;
                localStorage.setItem(userKey, JSON.stringify(localUser));
              }
            }
          }
        }
      } else {
        effectiveStreak = 0;
      }

      const streak = effectiveStreak;
      const correctedUserData = {
        ...userData,
        streak: effectiveStreak
      };
      
      const habitsArray: any[] = Array.isArray(habitsData)
        ? habitsData
        : (habitsData && typeof habitsData === "object" && Array.isArray((habitsData as any).habits)
            ? (habitsData as any).habits
            : (habitsData && typeof habitsData === "object" && Array.isArray((habitsData as any).data)
                ? (habitsData as any).data
                : []));

      const enrichedHabits = habitsArray.map((h: any) => {
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
           const { generateQuote } = await import("../lib/geminiService");
           quote = await generateQuote(streak, habitsArray);
           localStorage.setItem("lastQuoteTime", now.toString());
           localStorage.setItem("cachedQuote", quote);
        }
      } catch (e) {
         console.error("Quote generation failed", e);
         if (streak >= 7) quote = "You’re ahead of 99%. Don’t slow down.";
         else if (streak === 0) quote = "One day broke. Don't let two.";
      }

      set({
        user: correctedUserData,
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
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const payload = {
      name: habitData.name,
      repeatType: habitData.repeatType,
      customDays: habitData.customDays
    };

    if (!get().isLocalFallback) {
      try {
        await apiRequest("/api/habit", "POST", payload);
      } catch (err) {
        console.warn("API write failed, updating locally", err);
      }
    }

    // Always mirror to local storage
    const habitsKey = `oneday_local_habits_${currentUser.uid}`;
    const localHabits = JSON.parse(localStorage.getItem(habitsKey) || "[]");
    const newLocalHabit = {
      id: "local_" + Date.now(),
      userId: currentUser.uid,
      name: habitData.name || "Untitled Habit",
      createdAt: new Date().toISOString(),
      completedToday: false,
      icon: habitData.icon || "flame",
      category: habitData.category || "health",
      difficulty: habitData.difficulty || "medium",
      notes: habitData.notes || "",
      repeatType: habitData.repeatType || "every_day",
      customDays: habitData.customDays || []
    };
    localHabits.push(newLocalHabit);
    localStorage.setItem(habitsKey, JSON.stringify(localHabits));

    // Save metadata
    if (habitData.name) {
       const key = `habit_meta_${currentUser.uid}_${habitData.name}`;
       localStorage.setItem(key, JSON.stringify({
          repeatType: habitData.repeatType,
          customDays: habitData.customDays,
          icon: habitData.icon,
          category: habitData.category,
          difficulty: habitData.difficulty,
          notes: habitData.notes
       }));
    }

    await get().refreshFromBackend()
  },

  editHabit: async (habitId: string, habitData: Partial<Habit>) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const payload = {
      habit_id: habitId,
      name: habitData.name,
      repeatType: habitData.repeatType,
      customDays: habitData.customDays,
      difficulty: habitData.difficulty,
      notes: habitData.notes
    };

    if (!get().isLocalFallback && !habitId.startsWith("local_")) {
      try {
        await apiRequest("/api/habit", "PUT", payload);
      } catch (err) {
        console.warn("API edit failed, updating locally", err);
      }
    }

    // Mirror to local storage
    const habitsKey = `oneday_local_habits_${currentUser.uid}`;
    const localHabits = JSON.parse(localStorage.getItem(habitsKey) || "[]");
    const updated = localHabits.map((h: any) => h.id === habitId ? { ...h, ...habitData } : h);
    localStorage.setItem(habitsKey, JSON.stringify(updated));
    
    if (habitData.name) {
       const key = `habit_meta_${currentUser.uid}_${habitData.name}`;
       localStorage.setItem(key, JSON.stringify({
          repeatType: habitData.repeatType,
          customDays: habitData.customDays,
          difficulty: habitData.difficulty,
          notes: habitData.notes,
          icon: habitData.icon,
          category: habitData.category
       }));
    }

    await get().refreshFromBackend();
  },

  deleteHabit: async (habitId: string) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    if (!get().isLocalFallback && !habitId.startsWith("local_")) {
      try {
        await apiRequest(`/api/habit/${habitId}`, "DELETE");
      } catch (err) {
        console.warn("API delete failed, updating locally", err);
      }
    }

    // Mirror to local storage
    const habitsKey = `oneday_local_habits_${currentUser.uid}`;
    const localHabits = JSON.parse(localStorage.getItem(habitsKey) || "[]");
    const filtered = localHabits.filter((h: any) => h.id !== habitId);
    localStorage.setItem(habitsKey, JSON.stringify(filtered));

    await get().refreshFromBackend();
  },

  completeHabit: async (habitId: string) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    if (!get().isLocalFallback && !habitId.startsWith("local_")) {
      try {
        await apiRequest("/api/complete", "POST", { habit_id: habitId });
      } catch (err) {
        console.warn("API complete failed, updating locally", err);
      }
    }

    // Mirror to local storage
    const habitsKey = `oneday_local_habits_${currentUser.uid}`;
    const localHabits = JSON.parse(localStorage.getItem(habitsKey) || "[]");
    const habit = localHabits.find((h: any) => h.id === habitId);
    
    if (habit && !habit.completedToday) {
      habit.completedToday = true;
      localStorage.setItem(habitsKey, JSON.stringify(localHabits));

      // Award XP & Streak Locally
      const userKey = `oneday_local_user_${currentUser.uid}`;
      const localUser = JSON.parse(localStorage.getItem(userKey) || "null");
      if (localUser) {
        const xpGain = habit.difficulty === "hard" ? 30 : (habit.difficulty === "easy" ? 10 : 20);
        localUser.xp += xpGain;
        localUser.levelProgress += xpGain;
        localUser.lastActiveDate = new Date().toISOString();

        const allCompleted = localHabits.every((h: any) => h.completedToday);
        if (allCompleted) {
          localUser.streak += 1;
          toast.success(`🔥 Streak updated: ${localUser.streak} days!`);
        }

        while (localUser.levelProgress >= 100) {
          localUser.levelProgress -= 100;
          localUser.level += 1;
          toast.success(`🎉 Level Up! You reached Level ${localUser.level}!`);
        }
        localStorage.setItem(userKey, JSON.stringify(localUser));
      }
    }

    await get().refreshFromBackend()
  },

  undoHabit: async (habitId: string) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    if (!get().isLocalFallback && !habitId.startsWith("local_")) {
      try {
        await apiRequest("/api/undo", "POST", { habit_id: habitId })
      } catch (err) {
        console.warn("API undo failed, updating locally", err);
      }
    }

    // Mirror to local storage
    const habitsKey = `oneday_local_habits_${currentUser.uid}`;
    const localHabits = JSON.parse(localStorage.getItem(habitsKey) || "[]");
    const habit = localHabits.find((h: any) => h.id === habitId);
    
    if (habit && habit.completedToday) {
      habit.completedToday = false;
      localStorage.setItem(habitsKey, JSON.stringify(localHabits));

      // Deduct XP Locally
      const userKey = `oneday_local_user_${currentUser.uid}`;
      const localUser = JSON.parse(localStorage.getItem(userKey) || "null");
      if (localUser) {
        const xpLoss = habit.difficulty === "hard" ? 30 : (habit.difficulty === "easy" ? 10 : 20);
        localUser.xp = Math.max(0, localUser.xp - xpLoss);
        localUser.levelProgress = Math.max(0, localUser.levelProgress - xpLoss);

        const wasAllCompleted = localHabits.every((h: any) => h.id === habitId ? true : h.completedToday);
        if (wasAllCompleted && localUser.streak > 0) {
          localUser.streak = Math.max(0, localUser.streak - 1);
        }

        localStorage.setItem(userKey, JSON.stringify(localUser));
      }
    }

    await get().refreshFromBackend()
  },

  freezeStreak: async (days: number) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    if (!get().isLocalFallback) {
      try {
        await apiRequest("/api/freeze", "POST", { days })
      } catch (err) {
        console.warn("API freeze failed, updating locally", err);
      }
    }

    const userKey = `oneday_local_user_${currentUser.uid}`;
    const localUser = JSON.parse(localStorage.getItem(userKey) || "null");
    if (localUser) {
      const freezeDate = new Date();
      freezeDate.setDate(freezeDate.getDate() + days);
      localUser.freeze_until = freezeDate.toISOString();
      localStorage.setItem(userKey, JSON.stringify(localUser));
      toast.success(`🛡️ Streak Shield activated for ${days} days!`);
    }

    await get().refreshFromBackend()
  },

  deactivateFreeze: async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    if (!get().isLocalFallback) {
      try {
        await apiRequest("/api/freeze", "POST", { days: 0 })
      } catch (e) {
        console.error("deactivateFreeze API call failed, falling back to local reset", e);
      }
    }

    const userKey = `oneday_local_user_${currentUser.uid}`;
    const localUser = JSON.parse(localStorage.getItem(userKey) || "null");
    if (localUser) {
      localUser.freeze_until = null;
      localStorage.setItem(userKey, JSON.stringify(localUser));
      toast.success("🛡️ Streak Shield deactivated.");
    }

    await get().refreshFromBackend()
  },

  sendChat: async (message: string) => {
    try {
      const data = await apiRequest("/api/chat", "POST", { message });
      return data.reply;
    } catch (err) {
      console.error("Backend chat failed", err);
      return "I am currently in Offline Standby Mode. Remember: Stoic discipline requires executing your daily standards regardless of external conditions. Complete your tasks today.";
    }
  },

  resetProgress: async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    if (!get().isLocalFallback) {
      try {
        await apiRequest("/api/reset", "POST")
      } catch {
         console.warn("API reset failed, resetting locally");
      }
    }

    const userKey = `oneday_local_user_${currentUser.uid}`;
    localStorage.removeItem(userKey);
    const habitsKey = `oneday_local_habits_${currentUser.uid}`;
    localStorage.removeItem(habitsKey);
    toast.success("Progress reset successfully")

    await get().refreshFromBackend()
  },

  deleteAccount: async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    if (!get().isLocalFallback) {
      try {
        await apiRequest("/api/account", "DELETE")
      } catch {
         console.warn("API delete account failed, clearing locally");
      }
    }

    const userKey = `oneday_local_user_${currentUser.uid}`;
    localStorage.removeItem(userKey);
    const habitsKey = `oneday_local_habits_${currentUser.uid}`;
    localStorage.removeItem(habitsKey);

    const fbUser = auth.currentUser
    if (fbUser) await fbUser.delete()
    set({ user: null, firebaseUser: null, habits: [], isLocalFallback: false })
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
      backendError: null,
      isLocalFallback: false
    })
  }
})
