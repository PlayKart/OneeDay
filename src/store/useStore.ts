import { create } from 'zustand';
import { auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { GoogleGenAI } from "@google/genai";
import { toast } from 'react-hot-toast';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "https://oneday-backend-xocv.onrender.com";

if (!BACKEND_URL) {
  throw new Error("Missing VITE_BACKEND_URL");
}

async function apiRequest(
  path: string,
  method = "GET",
  body: any = null,
  isRetry = false
): Promise<any> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("Communication Failure: Authentication Required");
    }

    const token = await currentUser.getIdToken(isRetry);

    const res = await fetch(`${BACKEND_URL}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: body ? JSON.stringify(body) : null,
      signal: controller.signal,
    });

    // Retry ONCE with fresh user + forced token refresh
    if (res.status === 401 && !isRetry) {
      return apiRequest(path, method, body, true);
    }

    const contentType = res.headers.get("content-type") || "";
    let data: any;

    if (contentType.includes("application/json")) {
      data = await res.json().catch(() => ({}));
    } else {
      data = await res.text().catch(() => "");
    }

    if (!res.ok) {
      const message =
        (data && typeof data === "object" && data.error) ||
        (typeof data === "string" && data) ||
        `Uplink Error: ${res.status}`;
      throw new Error(message);
    }

    return data;
  } catch (e: any) {
    if (e?.name === "AbortError") {
      throw new Error("Protocol Timeout: Connection lost");
    }
    if (e instanceof Error) throw e;
    throw new Error("Network Instability: Check uplink signal");
  } finally {
    clearTimeout(timeoutId);
  }
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
    if (get().loading) return;
    
    try {
      set({ loading: true });
      const [userData, habitsData] = await Promise.all([
        apiRequest("/api/user"),
        apiRequest("/api/habits")
      ]);

      const streak = userData.streak;
      let quote = "The best time to start was yesterday. The second best time is now.";
      if (streak >= 7) quote = "You’re ahead of 99%. Don’t slow down.";
      else if (streak === 0) quote = "One day broke. Don't let two.";
      else if (userData.freeze_until && new Date(userData.freeze_until) > new Date()) quote = "You paused. Don’t quit.";

      set({ 
        user: userData, 
        habits: habitsData, 
        quote,
        loading: false,
        initialized: true 
      });
    } catch (e: any) {
      console.error("Critical State Sync Failure:", e);
      toast.error(e.message || "SYNC FAILURE. CHECK CONNECTION.");
      set({ loading: false, initialized: true, user: null });
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
      const { user } = get();
      const streak = user?.streak || 0;

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: message,
        config: {
          systemInstruction: `You are 'OneDay' AI Coach. 
          Your current student has a streak of ${streak} days.
          Personality Rules:
          - If streak >= 7: Be STRICT, elite, and slightly aggressive. No excuses allowed.
          - If streak < 7: Be FIRM but encouraging. Focus on consistency.
          - If they just returned from a freeze: Be supportive but remind them the clock is ticking.
          - Tone: Short, punchy, disciplined. 
          - Never use emojis. Never apologize.
          - Focus on the IMMEDIATE next action.`
        }
      });

      return result.text || "Connection lost. Continue your streak.";
    } catch (e: any) {
      console.error("AI Uplink Error:", e);
      throw new Error(e.message || "AI Coach is currently offline. Stay disciplined regardless.");
    }
  }
}));

onAuthStateChanged(auth, async (fbUser) => {
  if (fbUser) {
    await useStore.getState().refreshFromBackend();
  } else {
    useStore.setState({ user: null, habits: [], initialized: true, loading: false });
  }
});
