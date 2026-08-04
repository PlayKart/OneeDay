// src/store/useStore.ts

import { create } from 'zustand';
import { auth } from '../lib/firebase';
import { onAuthStateChanged, User as FirebaseUser, getRedirectResult } from 'firebase/auth';
import { dashboardService } from '../services/dashboardService';
import { habitService } from '../services/habitService';
import { chatService } from '../services/chatService';
import { userService } from '../services/userService';
import { quoteService } from '../services/quoteService';
import { safeArray, normalizeCompletedDates } from '../utils';
import { apiRequest } from '../api/client';
import { 
  User as BackendUser, 
  Habit, 
  ChatSession, 
  ChatMessage, 
  TabState, 
  NotificationItem, 
  Achievement, 
  Statistics 
} from '../types';

export { apiRequest, normalizeCompletedDates };
export type { ChatSession, ChatMessage, Habit, TabState, BackendUser as User };

interface StoreState {
  firebaseUser: FirebaseUser | null;
  user: BackendUser | null;
  habits: Habit[];
  quote: string;
  initialized: boolean;
  loading: boolean;
  backendError: string | null;
  activeTab: TabState;

  // Multi-session chat state
  chatSessions: ChatSession[];
  activeChatId: string | null;
  chatMessages: ChatMessage[];
  chatLoading: boolean;

  // Actions
  setFirebaseUser: (fbUser: FirebaseUser | null) => void;
  setActiveTab: (tab: TabState) => void;
  refreshFromBackend: () => Promise<void>;
  addHabit: (habitData: Partial<Habit>) => Promise<void>;
  editHabit: (habitId: string, habitData: Partial<Habit>) => Promise<void>;
  deleteHabit: (habitId: string) => Promise<void>;
  completeHabit: (habitId: string) => Promise<void>;
  undoHabit: (habitId: string) => Promise<void>;
  freezeStreak: (days: number) => Promise<void>;
  deactivateFreeze: () => Promise<void>;
  sendChat: (message: string) => Promise<string>;
  resetProgress: () => Promise<void>;
  deleteAccount: () => Promise<void>;

  // Multi-session chat actions
  fetchSessions: () => Promise<void>;
  createSession: (title?: string) => Promise<string>;
  selectSession: (id: string) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  renameSession: (id: string, title: string) => Promise<void>;
  pinSession: (id: string) => Promise<void>;
  sendChatMessage: (message: string) => Promise<void>;
  regenerateMessage: (messageId?: string) => Promise<void>;
  editPreviousMessage: (messageId: string, newContent: string) => Promise<void>;
}

export const useStore = create<StoreState>((set, get) => {
  // 1. Process potential redirect results from signInWithRedirect
  getRedirectResult(auth)
    .then((result) => {
      if (result && result.user) {
        console.log("[Auth Step - Redirect] Successful redirect login. User UID:", result.user.uid);
      }
    })
    .catch((err) => {
      console.warn("[Auth Step - Redirect Warning] Error handling redirect result:", err);
    });

  // 2. Listen to Auth state changes and boot store sync
  onAuthStateChanged(auth, async (fbUser) => {
    console.log("[Auth Step - Listener] onAuthStateChanged fired:", fbUser ? `UID: ${fbUser.uid}, Email: ${fbUser.email}` : "No user logged in");
    set({ firebaseUser: fbUser, initialized: true });
    
    if (fbUser) {
      try {
        const token = await fbUser.getIdToken();
        console.log("[Auth Step - Token] Firebase ID token retrieved on auth state change (length:", token?.length || 0, ")");
      } catch (tokenErr) {
        console.warn("[Auth Step - Token Warning] Failed to retrieve ID token on auth state change:", tokenErr);
      }
      console.log("[Auth Step - Sync] Fetching dashboard data from backend...");
      await get().refreshFromBackend();
    } else {
      console.log("[Auth Step - Reset] Clearing store state on logout.");
      set({ user: null, habits: [], chatSessions: [], chatMessages: [] });
    }
  });

  return {
    firebaseUser: auth.currentUser,
    user: null,
    habits: [],
    quote: "One day broke. Don't let two.",
    initialized: false,
    loading: false,
    backendError: null,
    activeTab: "dashboard",

    chatSessions: [],
    activeChatId: null,
    chatMessages: [],
    chatLoading: false,

    setFirebaseUser: (fbUser) => {
      console.log("[Zustand Store] setFirebaseUser called:", fbUser ? fbUser.uid : null);
      set({ firebaseUser: fbUser, initialized: true });
    },

    setActiveTab: (tab) => set({ activeTab: tab }),

    refreshFromBackend: async () => {
      if (!auth.currentUser) {
        console.warn("[Auth Step - Sync Skipped] No auth.currentUser present.");
        return;
      }
      set({ loading: true, backendError: null });

      try {
        const data = await dashboardService.fetchDashboardData();
        console.log("[Auth Step - Sync Success] Backend data loaded successfully for user:", data.user?.name);
        set({
          user: data.user,
          habits: safeArray(data.habits),
          quote: data.quote,
          loading: false,
        });

        // Concurrently load chat sessions
        get().fetchSessions();
      } catch (err: any) {
        console.error("[Auth Step - Sync Error] refreshFromBackend failed:", err);
        set({
          backendError: err.message || "Failed to load dashboard data",
          loading: false,
        });
      }
    },

    addHabit: async (habitData) => {
      const tempId = `temp_${Date.now()}`;
      const optimistic: Habit = {
        id: tempId,
        name: habitData.name || "New Habit",
        completedToday: false,
        completedDates: [],
        repeatType: habitData.repeatType || "every_day",
        customDays: habitData.customDays || [],
        icon: habitData.icon || "dumbbell",
        category: habitData.category || "emerald",
        difficulty: habitData.difficulty || "Medium",
        notes: habitData.notes || "",
      };

      set((state) => ({ habits: [optimistic, ...state.habits] }));

      try {
        const created = await habitService.createHabit(habitData);
        set((state) => ({
          habits: state.habits.map((h) => (h.id === tempId ? created : h)),
        }));
        await get().refreshFromBackend();
      } catch (e) {
        set((state) => ({ habits: state.habits.filter((h) => h.id !== tempId) }));
        throw e;
      }
    },

    editHabit: async (habitId, habitData) => {
      const original = get().habits.find((h) => h.id === habitId);
      set((state) => ({
        habits: state.habits.map((h) => (h.id === habitId ? { ...h, ...habitData } : h)),
      }));

      try {
        const updated = await habitService.updateHabit(habitId, habitData);
        set((state) => ({
          habits: state.habits.map((h) => (h.id === habitId ? updated : h)),
        }));
        await get().refreshFromBackend();
      } catch (e) {
        if (original) {
          set((state) => ({
            habits: state.habits.map((h) => (h.id === habitId ? original : h)),
          }));
        }
        throw e;
      }
    },

    deleteHabit: async (habitId) => {
      const original = get().habits.find((h) => h.id === habitId);
      set((state) => ({ habits: state.habits.filter((h) => h.id !== habitId) }));

      try {
        await habitService.deleteHabit(habitId);
        await get().refreshFromBackend();
      } catch (e) {
        if (original) set((state) => ({ habits: [...state.habits, original] }));
        throw e;
      }
    },

    completeHabit: async (habitId) => {
      console.log(`[useStore] Initiating completeHabit for habitId: ${habitId}...`);
      try {
        const res = await habitService.completeHabit(habitId);
        
        if (res && res.success === false) {
          const errMsg = res?.error?.message || "Backend returned success: false for habit completion";
          console.error(`[useStore] Complete habit failed:`, errMsg);
          throw new Error(errMsg);
        }

        console.log(`[useStore] Complete habit succeeded on backend. Updating local state for habit ${habitId}`);
        const today = new Date().toISOString().split("T")[0];

        set((state) => ({
          habits: state.habits.map((h) =>
            h.id === habitId
              ? {
                  ...h,
                  completedToday: true,
                  completedDates: h.completedDates?.includes(today)
                    ? h.completedDates
                    : [...(h.completedDates || []), today],
                }
              : h
          ),
          user: res?.user ? res.user : state.user,
        }));

        // Refresh from backend to sync full state (XP, streaks, habit records)
        await get().refreshFromBackend();
      } catch (e: any) {
        console.error(`[useStore] completeHabit error:`, e);
        await get().refreshFromBackend();
        throw e;
      }
    },

    undoHabit: async (habitId) => {
      console.log(`[useStore] Initiating undoHabit for habitId: ${habitId}...`);
      try {
        const res = await habitService.undoHabit(habitId);

        if (res && res.success === false) {
          const errMsg = res?.error?.message || "Backend returned success: false for habit undo";
          console.error(`[useStore] Undo habit failed:`, errMsg);
          throw new Error(errMsg);
        }

        console.log(`[useStore] Undo habit succeeded on backend. Updating local state for habit ${habitId}`);
        const today = new Date().toISOString().split("T")[0];

        set((state) => ({
          habits: state.habits.map((h) =>
            h.id === habitId
              ? {
                  ...h,
                  completedToday: false,
                  completedDates: (h.completedDates || []).filter((d) => d !== today),
                }
              : h
          ),
          user: res?.user ? res.user : state.user,
        }));

        await get().refreshFromBackend();
      } catch (e: any) {
        console.error(`[useStore] undoHabit error:`, e);
        await get().refreshFromBackend();
        throw e;
      }
    },

    freezeStreak: async (days) => {
      const updatedUser = await userService.freezeStreak(days);
      set({ user: updatedUser });
      await get().refreshFromBackend();
    },

    deactivateFreeze: async () => {
      const updatedUser = await userService.deactivateFreeze();
      set({ user: updatedUser });
      await get().refreshFromBackend();
    },

    sendChat: async (messageText) => {
      let activeId = get().activeChatId;
      if (!activeId) {
        activeId = await get().createSession();
      }
      const res = await chatService.sendMessage(activeId, messageText);
      return res.reply;
    },

    resetProgress: async () => {
      await userService.resetProgress();
      set((state) => ({
        user: state.user
          ? { ...state.user, xp: 0, streak: 0, level: 1, levelProgress: 0 }
          : null,
      }));
      await get().refreshFromBackend();
    },

    deleteAccount: async () => {
      await userService.deleteAccount();
      set({ user: null, habits: [], chatSessions: [], chatMessages: [] });
    },

    fetchSessions: async () => {
      try {
        const sessions = await chatService.getSessions();
        set({ chatSessions: safeArray(sessions) });
        if (sessions.length > 0 && !get().activeChatId) {
          get().selectSession(sessions[0].id);
        }
      } catch (e) {
        console.warn("fetchSessions failed:", e);
      }
    },

    createSession: async (title) => {
      try {
        const newSession = await chatService.createSession(title);
        set((state) => ({
          chatSessions: [newSession, ...state.chatSessions],
          activeChatId: newSession.id,
          chatMessages: [],
        }));
        return newSession.id;
      } catch (e) {
        const fallbackId = `conv_${Date.now()}`;
        const fallbackSession: ChatSession = {
          id: fallbackId,
          title: title || "New Coaching Session",
          isPinned: false,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          chatSessions: [fallbackSession, ...state.chatSessions],
          activeChatId: fallbackId,
          chatMessages: [],
        }));
        return fallbackId;
      }
    },

    selectSession: async (id) => {
      set({ activeChatId: id, chatLoading: true });
      try {
        const msgs = await chatService.getMessages(id);
        set({ chatMessages: safeArray(msgs), chatLoading: false });
      } catch (e) {
        set({ chatMessages: [], chatLoading: false });
      }
    },

    deleteSession: async (id) => {
      set((state) => {
        const remaining = state.chatSessions.filter((s) => s.id !== id);
        const nextActive = state.activeChatId === id ? remaining[0]?.id || null : state.activeChatId;
        return {
          chatSessions: remaining,
          activeChatId: nextActive,
          chatMessages: state.activeChatId === id ? [] : state.chatMessages,
        };
      });

      try {
        await chatService.deleteSession(id);
      } catch (e) {
        console.warn("deleteSession failed:", e);
      }
    },

    renameSession: async (id, title) => {
      set((state) => ({
        chatSessions: state.chatSessions.map((s) => (s.id === id ? { ...s, title } : s)),
      }));
      try {
        await chatService.renameSession(id, title);
      } catch (e) {
        console.warn("renameSession failed:", e);
      }
    },

    pinSession: async (id) => {
      const session = get().chatSessions.find((s) => s.id === id);
      if (!session) return;
      const newPinned = !session.isPinned;

      set((state) => ({
        chatSessions: state.chatSessions.map((s) => (s.id === id ? { ...s, isPinned: newPinned } : s)),
      }));

      try {
        await chatService.pinSession(id, newPinned);
      } catch (e) {
        console.warn("pinSession failed:", e);
      }
    },

    sendChatMessage: async (messageText) => {
      let activeId = get().activeChatId;
      if (!activeId) {
        activeId = await get().createSession();
      }

      const userMsg: ChatMessage = {
        id: `user_${Date.now()}`,
        conversationId: activeId,
        role: "user",
        content: messageText,
        createdAt: new Date().toISOString(),
      };

      const tempAssistantMsgId = `assistant_${Date.now()}`;
      const placeholderMsg: ChatMessage = {
        id: tempAssistantMsgId,
        conversationId: activeId,
        role: "assistant",
        content: "...",
        createdAt: new Date().toISOString(),
        isStreaming: true,
      };

      set((state) => ({
        chatMessages: [...state.chatMessages, userMsg, placeholderMsg],
        chatLoading: true,
      }));

      try {
        const res = await chatService.sendMessage(activeId, messageText);
        const reply = res.reply || "Focus on daily execution.";

        set((state) => ({
          chatMessages: state.chatMessages.map((m) =>
            m.id === tempAssistantMsgId ? { ...m, content: reply, isStreaming: false } : m
          ),
          chatLoading: false,
        }));

        const currentSession = get().chatSessions.find((s) => s.id === activeId);
        if (
          currentSession &&
          (currentSession.title === "New Conversation" || currentSession.title === "New Coaching Session")
        ) {
          const truncatedTitle = messageText.length > 25 ? messageText.substring(0, 25) + "..." : messageText;
          get().renameSession(activeId, truncatedTitle);
        }
      } catch (e: any) {
        console.error("[AI Coach] sendChatMessage failed:", e);

        let errorMessage = "An unknown error occurred";
        if (e?.response?.data) {
          const data = e.response.data;
          if (typeof data.error === "object" && data.error?.message) {
            errorMessage = data.error.message;
          } else if (typeof data.error === "string") {
            errorMessage = data.error;
          } else if (data.message) {
            errorMessage = data.message;
          } else if (data.details) {
            errorMessage = typeof data.details === "string" ? data.details : JSON.stringify(data.details);
          } else {
            errorMessage = typeof data === "string" ? data : JSON.stringify(data);
          }
        } else if (e?.message) {
          errorMessage = e.message;
        }

        set((state) => ({
          chatMessages: state.chatMessages.map((m) =>
            m.id === tempAssistantMsgId
              ? { ...m, content: `⚠️ ${errorMessage}`, isStreaming: false }
              : m
          ),
          chatLoading: false,
        }));
      }
    },

    regenerateMessage: async (messageId) => {
      const messages = get().chatMessages;
      if (messages.length === 0) return;

      let lastUserMsg = "";
      if (messageId) {
        const idx = messages.findIndex((m) => m.id === messageId);
        if (idx > 0 && messages[idx - 1].role === "user") {
          lastUserMsg = messages[idx - 1].content;
        }
      }
      if (!lastUserMsg) {
        const userMsgs = messages.filter((m) => m.role === "user");
        if (userMsgs.length > 0) {
          lastUserMsg = userMsgs[userMsgs.length - 1].content;
        }
      }

      if (lastUserMsg) {
        await get().sendChatMessage(lastUserMsg);
      }
    },

    editPreviousMessage: async (messageId, newContent) => {
      set((state) => {
        const idx = state.chatMessages.findIndex((m) => m.id === messageId);
        if (idx === -1) return state;
        return { chatMessages: state.chatMessages.slice(0, idx) };
      });

      await get().sendChatMessage(newContent);
    },
  };
});
