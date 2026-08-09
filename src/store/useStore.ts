// src/store/useStore.ts

import { create } from 'zustand';
import { auth } from '../lib/firebase';
import { onAuthStateChanged, User as FirebaseUser, getRedirectResult } from 'firebase/auth';
import { dashboardService } from '../services/dashboardService';
import { habitService } from '../services/habitService';
import { chatService } from '../services/chatService';
import { userService } from '../services/userService';
import { quoteService } from '../services/quoteService';
import { safeArray, normalizeCompletedDates, normalizeUser } from '../utils';
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
  profileSynced: boolean;
  profileVersion: number;
  backendError: string | null;
  activeTab: TabState;
  pendingHabitIds: Set<string>;
  titleUnlockData: { title: string; signature: string; level: number } | null;
  titleLossData: { title: string; signature: string; reason?: string } | null;

  // Multi-session chat state
  chatSessions: ChatSession[];
  activeChatId: string | null;
  chatMessages: ChatMessage[];
  chatLoading: boolean;
  sessionsLoading: boolean;

  // Actions
  setFirebaseUser: (fbUser: FirebaseUser | null) => void;
  incrementProfileVersion: () => void;
  setActiveTab: (tab: TabState) => void;
  setTitleUnlockData: (data: { title: string; signature: string; level: number } | null) => void;
  setTitleLossData: (data: { title: string; signature: string; reason?: string } | null) => void;
  refreshFromBackend: () => Promise<void>;
  addHabit: (habitData: Partial<Habit>) => Promise<void>;
  editHabit: (habitId: string, habitData: Partial<Habit>) => Promise<void>;
  deleteHabit: (habitId: string) => Promise<void>;
  completeHabit: (habitId: string) => Promise<any>;
  undoHabit: (habitId: string) => Promise<any>;
  freezeStreak: (days: number) => Promise<void>;
  deactivateFreeze: () => Promise<void>;
  updateProfile: (data: Partial<BackendUser>) => Promise<void>;
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
  const sessionActive = localStorage.getItem("oneday_session_active") === "true";
  const cachedUid = localStorage.getItem("oneday_firebase_uid") || "";
  const cachedEmail = localStorage.getItem("oneday_firebase_email") || "";
  const cachedToken = localStorage.getItem("oneday_firebase_token") || "";

  let initialFirebaseUser: FirebaseUser | null = null;
  if (sessionActive && cachedUid) {
    initialFirebaseUser = {
      uid: cachedUid,
      email: cachedEmail,
      getIdToken: async (force?: boolean) => {
        return localStorage.getItem("oneday_firebase_token") || cachedToken;
      }
    } as any;
  }

  let initialUser: BackendUser | null = null;
  const cachedUserStr = localStorage.getItem("oneday_cached_user");
  if (cachedUserStr) {
    try {
      initialUser = JSON.parse(cachedUserStr);
    } catch (_) {
      // Ignore
    }
  }

  // 1. Process potential redirect results from signInWithRedirect
  getRedirectResult(auth)
    .then(async (result) => {
      if (result && result.user) {
        console.log("[Auth Step - Redirect] Successful redirect login. User UID:", result.user.uid);
        try {
          const token = await result.user.getIdToken(true);
          localStorage.setItem("oneday_session_active", "true");
          localStorage.setItem("oneday_firebase_uid", result.user.uid);
          localStorage.setItem("oneday_firebase_email", result.user.email || "");
          localStorage.setItem("oneday_firebase_token", token);
        } catch (tokenErr) {
          console.warn("[Auth Step - Redirect Warning] Failed to retrieve ID token:", tokenErr);
        }
        set({ firebaseUser: result.user, initialized: true });
        await get().refreshFromBackend();
      }
    })
    .catch((err) => {
      console.warn("[Auth Step - Redirect Warning] Error handling redirect result:", err);
    });

  // 2. Listen to Auth state changes and boot store sync
  console.log("[AUTH] Firebase auth initializing");
  onAuthStateChanged(auth, async (fbUser) => {
    console.log("[AUTH] Firebase auth state received:", fbUser ? "authenticated" : "unauthenticated");
    
    if (fbUser) {
      console.log("[AUTH] User UID:", fbUser.uid);
      try {
        const token = await fbUser.getIdToken();
        console.log("[Auth Step - Token] Firebase ID token retrieved on auth state change (length:", token?.length || 0, ")");
        localStorage.setItem("oneday_session_active", "true");
        localStorage.setItem("oneday_firebase_uid", fbUser.uid);
        localStorage.setItem("oneday_firebase_email", fbUser.email || "");
        localStorage.setItem("oneday_firebase_token", token);
      } catch (tokenErr) {
        console.warn("[Auth Step - Token Warning] Failed to retrieve ID token on auth state change:", tokenErr);
      }
      set({ firebaseUser: fbUser, initialized: true });
      console.log("[STARTUP SEQUENCE - Backend started] Requesting backend sync from onAuthStateChanged...");
      await get().refreshFromBackend();
    } else {
      console.log("[Auth Step - Reset] Clearing store state on logout.");
      localStorage.removeItem("oneday_session_active");
      localStorage.removeItem("oneday_firebase_uid");
      localStorage.removeItem("oneday_firebase_email");
      localStorage.removeItem("oneday_firebase_token");
      localStorage.removeItem("oneday_cached_user");
      localStorage.removeItem("oneday_onboarded");
      localStorage.removeItem("oneday_onboarding_step");
      localStorage.removeItem("oneday_onboarding_data");
      set({
        firebaseUser: null,
        user: null,
        habits: [],
        chatSessions: [],
        chatMessages: [],
        initialized: true,
        profileSynced: false,
        profileVersion: get().profileVersion + 1,
      });
    }
  });

  return {
    firebaseUser: initialFirebaseUser,
    user: initialUser,
    habits: [],
    quote: "One day broke. Don't let two.",
    initialized: sessionActive ? true : false,
    loading: false,
    profileSynced: false,
    profileVersion: 0,
    backendError: null,
    activeTab: "dashboard",
    pendingHabitIds: new Set<string>(),
    titleUnlockData: null,
    titleLossData: null,

    chatSessions: [],
    activeChatId: null,
    chatMessages: [],
    chatLoading: false,
    sessionsLoading: false,

    setFirebaseUser: (fbUser) => {
      console.log("[AUTH] Firebase state:", fbUser ? `authenticated (UID: ${fbUser.uid})` : "unauthenticated");
      if (fbUser) {
        localStorage.setItem("oneday_session_active", "true");
        localStorage.setItem("oneday_firebase_uid", fbUser.uid);
        localStorage.setItem("oneday_firebase_email", fbUser.email || "");
        fbUser.getIdToken().then(token => {
          localStorage.setItem("oneday_firebase_token", token);
        }).catch(err => {
          console.warn("Failed to update token on setFirebaseUser:", err);
        });
      }
      set({ firebaseUser: fbUser, initialized: true });
    },

    incrementProfileVersion: () => {
      set((state) => ({ profileVersion: state.profileVersion + 1 }));
    },

    setActiveTab: (tab) => set({ activeTab: tab }),
    setTitleUnlockData: (data) => set({ titleUnlockData: data }),
    setTitleLossData: (data) => set({ titleLossData: data }),

    refreshFromBackend: async () => {
      if (get().loading) {
        console.log("[STARTUP SEQUENCE - Guard] Backend request already in progress, ignoring duplicate call.");
        return;
      }
      if (!auth.currentUser && localStorage.getItem("oneday_session_active") !== "true") {
        console.warn("[Auth Step - Sync Skipped] No auth.currentUser and no cached session present.");
        return;
      }

      const reqVersion = get().profileVersion;
      console.log(`[PROFILE] request started (version: ${reqVersion})`);
      set({ loading: true, backendError: null });

      try {
        // 10-second timeout for dashboard service
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Connection timed out. Uplink took more than 10 seconds to respond.")), 10000)
        );

        const data = await Promise.race([
          dashboardService.fetchDashboardData(),
          timeoutPromise
        ]);

        console.log(`[PROFILE] response received (reqVersion: ${reqVersion}, currentVersion: ${get().profileVersion})`);

        if (get().profileVersion > reqVersion) {
          console.log(`[STALE] ignored response (reqVersion ${reqVersion} < current ${get().profileVersion})`);
          set({ loading: false });
          return;
        }

        if (data) {
          const root = (data as any).data || data;
          const userObj = root?.user || root;
          if (root?.titleUnlocked || userObj?.titleUnlocked) {
            set({
              titleUnlockData: {
                title: root?.title || userObj?.title || "IRON MIND",
                signature: root?.signature || userObj?.signature || "You've proven consistency isn't luck. It's your identity.",
                level: root?.level || userObj?.level || data.user.level || 1,
              }
            });
          }
          if (root?.titleLost || userObj?.titleLost) {
            set({
              titleLossData: {
                title: root?.title || userObj?.title || "TITLE",
                signature: root?.signature || userObj?.signature || "Every setback is temporary. Earn it back.",
                reason: root?.reason || userObj?.reason || "Your XP dropped below the required threshold.",
              }
            });
          }
        }
        const fetchedUser = normalizeUser(data, get().user);
        const currentXp = get().user?.xp ?? 0;
        const fetchedXp = fetchedUser?.xp ?? 0;
        const finalXp = fetchedXp < currentXp ? currentXp : fetchedXp;
        const finalUser = fetchedUser ? { ...fetchedUser, xp: finalXp } : fetchedUser;

        if (finalUser) {
          localStorage.setItem("oneday_cached_user", JSON.stringify(finalUser));
        }
        set({
          user: finalUser,
          habits: safeArray(data.habits),
          quote: data.quote,
          loading: false,
          profileSynced: true,
        });

        // Concurrently load chat sessions
        get().fetchSessions();
      } catch (err: any) {
        console.error("[STARTUP SEQUENCE - Sync Error] refreshFromBackend failed:", err);
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
      try {
        await habitService.deleteHabit(habitId);
        set((state) => ({ habits: state.habits.filter((h) => h.id !== habitId) }));
        await get().refreshFromBackend();
      } catch (e) {
        throw e;
      }
    },

    completeHabit: async (habitId) => {
      console.log(`[useStore] Initiating completeHabit for habitId: ${habitId}...`);
      if (get().pendingHabitIds.has(habitId)) {
        console.warn(`[useStore] Habit ${habitId} is already updating. Ignoring duplicate complete attempt.`);
        return;
      }

      const originalHabits = get().habits;
      const originalUser = get().user;
      const today = new Date().toISOString().split("T")[0];

      set((state) => {
        const nextPending = new Set(state.pendingHabitIds);
        nextPending.add(habitId);
        return {
          pendingHabitIds: nextPending,
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
        };
      });

      try {
        const res = await habitService.completeHabit(habitId);

        if (res && res.success === false) {
          const errMsg =
            res?.error?.message ||
            (typeof res?.error === "string" ? res.error : "Failed to complete habit on server");
          throw new Error(errMsg);
        }

        const root = (res as any).data || res;
        const userObj = root?.user || root;
        if (root?.titleUnlocked || userObj?.titleUnlocked) {
          set({
            titleUnlockData: {
              title: root?.title || userObj?.title || "IRON MIND",
              signature: root?.signature || userObj?.signature || "You've proven consistency isn't luck. It's your identity.",
              level: root?.level || userObj?.level || originalUser?.level || 1,
            }
          });
        }
        if (root?.titleLost || userObj?.titleLost) {
          set({
            titleLossData: {
              title: root?.title || userObj?.title || "TITLE",
              signature: root?.signature || userObj?.signature || "Every setback is temporary. Earn it back.",
              reason: root?.reason || userObj?.reason || "Your XP dropped below the required threshold.",
            }
          });
        }

        const updatedUser = normalizeUser(res, originalUser);

        set((state) => {
          const nextPending = new Set(state.pendingHabitIds);
          nextPending.delete(habitId);
          return {
            user: updatedUser,
            pendingHabitIds: nextPending,
          };
        });

        await get().refreshFromBackend();
        return res;
      } catch (e: any) {
        console.error(`[useStore] completeHabit error:`, e);

        const rawError =
          e?.response?.data?.error?.message ||
          e?.response?.data?.error ||
          e?.response?.data?.message ||
          e?.message ||
          "Failed to complete habit";

        const cleanMessage =
          typeof rawError === "string" && rawError !== "Unexpected Error"
            ? rawError
            : "Failed to complete habit on server";

        set((state) => {
          const nextPending = new Set(state.pendingHabitIds);
          nextPending.delete(habitId);
          return {
            habits: originalHabits,
            user: originalUser,
            pendingHabitIds: nextPending,
          };
        });

        throw new Error(cleanMessage);
      }
    },

    undoHabit: async (habitId) => {
      console.log(`[useStore] Initiating undoHabit for habitId: ${habitId}...`);
      if (get().pendingHabitIds.has(habitId)) {
        console.warn(`[useStore] Habit ${habitId} is already updating. Ignoring duplicate undo attempt.`);
        return;
      }

      const originalHabits = get().habits;
      const originalUser = get().user;
      const today = new Date().toISOString().split("T")[0];

      set((state) => {
        const nextPending = new Set(state.pendingHabitIds);
        nextPending.add(habitId);
        return {
          pendingHabitIds: nextPending,
          habits: state.habits.map((h) =>
            h.id === habitId
              ? {
                  ...h,
                  completedToday: false,
                  completedDates: (h.completedDates || []).filter((d) => d !== today),
                }
              : h
          ),
        };
      });

      try {
        const res = await habitService.undoHabit(habitId);

        if (res && res.success === false) {
          const errMsg =
            res?.error?.message ||
            (typeof res?.error === "string" ? res.error : "Failed to undo habit completion");
          throw new Error(errMsg);
        }

        const updatedUser = normalizeUser(res, originalUser);

        set((state) => {
          const nextPending = new Set(state.pendingHabitIds);
          nextPending.delete(habitId);
          return {
            user: updatedUser,
            pendingHabitIds: nextPending,
          };
        });

        await get().refreshFromBackend();
        return res;
      } catch (e: any) {
        console.error(`[useStore] undoHabit error:`, e);

        const rawError =
          e?.response?.data?.error?.message ||
          e?.response?.data?.error ||
          e?.response?.data?.message ||
          e?.message ||
          "Failed to undo habit completion";

        const cleanMessage =
          typeof rawError === "string" && rawError !== "Unexpected Error"
            ? rawError
            : "Failed to undo completion";

        set((state) => {
          const nextPending = new Set(state.pendingHabitIds);
          nextPending.delete(habitId);
          return {
            habits: originalHabits,
            user: originalUser,
            pendingHabitIds: nextPending,
          };
        });

        throw new Error(cleanMessage);
      }
    },

    freezeStreak: async (days) => {
      const updatedUser = await userService.freezeStreak(days);
      if (updatedUser) {
        localStorage.setItem("oneday_cached_user", JSON.stringify(updatedUser));
      }
      set({ user: updatedUser });
      await get().refreshFromBackend();
    },

    deactivateFreeze: async () => {
      const updatedUser = await userService.deactivateFreeze();
      if (updatedUser) {
        localStorage.setItem("oneday_cached_user", JSON.stringify(updatedUser));
      }
      set({ user: updatedUser });
      await get().refreshFromBackend();
    },

    updateProfile: async (data) => {
      try {
        const currentUser = get().user;
        if (!currentUser) return;
        const updated = await userService.updateProfile(data);
        const isCompletingOnboarding = Boolean(data.onboarded || data.hasCompletedOnboarding);
        const nextUser = { ...currentUser, ...updated, ...data };
        localStorage.setItem("oneday_cached_user", JSON.stringify(nextUser));
        const newVersion = isCompletingOnboarding ? get().profileVersion + 1 : get().profileVersion;
        set({ user: nextUser, profileVersion: newVersion });
        await get().refreshFromBackend();
      } catch (e) {
        console.error("[useStore] updateProfile error:", e);
        throw e;
      }
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
      set({ sessionsLoading: true });
      try {
        console.log("[useStore] Fetching chat sessions from backend...");
        const sessions = await chatService.getSessions();
        const safeArr = safeArray(sessions) as ChatSession[];
        const sorted = [...safeArr].sort((a: any, b: any) => {
          const timeA = new Date(a.updated_at || a.created_at || 0).getTime();
          const timeB = new Date(b.updated_at || b.created_at || 0).getTime();
          return timeB - timeA;
        });

        set({ chatSessions: sorted });

        if (sorted.length > 0) {
          const savedActiveId = localStorage.getItem("activeChatId") || get().activeChatId;
          const targetSession = sorted.find((s) => s.id === savedActiveId) || sorted[0];
          if (targetSession) {
            console.log(`[useStore] Restoring/selecting session ${targetSession.id}`);
            await get().selectSession(targetSession.id);
          }
        } else {
          console.log("[useStore] No sessions found, delaying backend creation.");
          set({ activeChatId: null, chatMessages: [] });
        }
      } catch (e) {
        console.warn("[useStore] fetchSessions failed:", e);
      } finally {
        set({ sessionsLoading: false });
      }
    },

    createSession: async (title) => {
      const newSession = await chatService.createSession(title || "New Chat");
      localStorage.setItem("activeChatId", newSession.id);
      set((state) => ({
        chatSessions: [newSession, ...state.chatSessions],
        activeChatId: newSession.id,
        chatMessages: [],
      }));
      return newSession.id;
    },

    selectSession: async (id) => {
      if (!id) return;
      localStorage.setItem("activeChatId", id);
      set({ activeChatId: id, chatLoading: true });
      try {
        const msgs = await chatService.getMessages(id);
        console.log(`[useStore] Loaded ${msgs.length} messages for session ${id}:`, msgs);
        set({ chatMessages: safeArray(msgs), chatLoading: false });
      } catch (e) {
        console.error(`[useStore] selectSession failed for ${id}:`, e);
        set({ chatLoading: false });
      }
    },

    deleteSession: async (id) => {
      const currentActiveId = get().activeChatId;
      set((state) => {
        const remaining = state.chatSessions.filter((s) => s.id !== id);
        const nextActive = currentActiveId === id ? remaining[0]?.id || null : currentActiveId;
        if (nextActive) {
          localStorage.setItem("activeChatId", nextActive);
        } else {
          localStorage.removeItem("activeChatId");
        }
        return {
          chatSessions: remaining,
          activeChatId: nextActive,
          chatMessages: currentActiveId === id ? [] : state.chatMessages,
        };
      });

      if (currentActiveId === id) {
        const remaining = get().chatSessions;
        if (remaining.length > 0) {
          await get().selectSession(remaining[0].id);
        } else {
          set({ activeChatId: null, chatMessages: [] });
        }
      }

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
      const newPinned = !(session.isPinned || session.is_pinned);

      set((state) => ({
        chatSessions: state.chatSessions.map((s) => (s.id === id ? { ...s, isPinned: newPinned, is_pinned: newPinned } : s)),
      }));

      try {
        await chatService.pinSession(id, newPinned);
      } catch (e) {
        console.warn("pinSession failed:", e);
      }
    },

    sendChatMessage: async (messageText) => {
      let activeId = get().activeChatId;
      let isNewSession = false;

      // Delayed creation: create session on backend only when sending the first message
      if (!activeId) {
        isNewSession = true;
        try {
          const newSession = await chatService.createSession("New Chat");
          activeId = newSession.id;
          localStorage.setItem("activeChatId", activeId);
          set((state) => ({
            chatSessions: [newSession, ...state.chatSessions],
            activeChatId: activeId,
          }));
        } catch (createErr: any) {
          console.error("[AI Coach] Session creation failed:", createErr);
          const errMsg = createErr?.response?.data?.error || createErr?.message || "Failed to create chat session";
          const tempAssistantMsgId = `assistant_${Date.now()}`;
          const userMsg: ChatMessage = {
            id: `user_${Date.now()}`,
            sessionId: "",
            role: "user",
            content: messageText,
            createdAt: new Date().toISOString(),
          };
          const placeholderMsg: ChatMessage = {
            id: tempAssistantMsgId,
            sessionId: "",
            role: "assistant",
            content: `⚠️ ${errMsg}`,
            createdAt: new Date().toISOString(),
            isStreaming: false,
          };
          set((state) => ({
            chatMessages: [...state.chatMessages, userMsg, placeholderMsg],
            chatLoading: false,
          }));
          return;
        }
      }

      const userMsg: ChatMessage = {
        id: `user_${Date.now()}`,
        sessionId: activeId,
        role: "user",
        content: messageText,
        createdAt: new Date().toISOString(),
      };

      const tempAssistantMsgId = `assistant_${Date.now()}`;
      const placeholderMsg: ChatMessage = {
        id: tempAssistantMsgId,
        sessionId: activeId,
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

        // Title Auto Update logic (Max 3 words, ChatGPT style)
        const currentSession = get().chatSessions.find((s) => s.id === activeId);
        let targetTitle = res.title;

        if (!targetTitle || targetTitle === "New Chat" || targetTitle === "New Conversation" || targetTitle === "New Coaching Session") {
          const cleanText = messageText.trim().replace(/[^\w\s]/gi, '');
          const words = cleanText.split(/\s+/).filter(Boolean);
          if (words.length > 0) {
            const threeWords = words.slice(0, 3).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
            targetTitle = threeWords.length <= 28 ? threeWords : "New Chat";
          } else {
            targetTitle = "New Chat";
          }
        }

        if (targetTitle && currentSession?.title !== targetTitle) {
          get().renameSession(activeId, targetTitle);
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
