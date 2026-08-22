// src/store/useStore.ts

import { create } from 'zustand';
import { auth } from '../lib/firebase';
import { onAuthStateChanged, User as FirebaseUser, getRedirectResult } from 'firebase/auth';
import { dashboardService } from '../services/dashboardService';
import { habitService } from '../services/habitService';
import { chatService } from '../services/chatService';
import { userService } from '../services/userService';
import { syncService } from '../services/syncService';
import { quoteService } from '../services/quoteService';
import { safeArray, normalizeCompletedDates, normalizeUser, hasCompletedOnboarding, getOnboardingStatus, calculateLevelProgress, getXpForDifficulty, extractXpAwarded, calculateStreak, getLocalCalendarDate, logStreakDebug } from '../utils';
import { isHabitScheduledForToday } from '../lib/habitUtils';
import { isTitleNew, markTitleAsSeen, getTitleDescription, setEquippedTitle, getEquippedTitle } from '../utils/titleUtils';
import { apiRequest } from '../api/client';
import { perfLogger } from '../utils/perfLogger';
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
  levelUpData: { previousLevel: number; currentLevel: number; xp: number; progress: number } | null;

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
  setLevelUpData: (data: { previousLevel: number; currentLevel: number; xp: number; progress: number } | null) => void;
  refreshFromBackend: () => Promise<void>;
  addHabit: (habitData: Partial<Habit>) => Promise<void>;
  editHabit: (habitId: string, habitData: Partial<Habit>) => Promise<void>;
  deleteHabit: (habitId: string) => Promise<void>;
  completeHabit: (habitId: string) => Promise<any>;
  undoHabit: (habitId: string) => Promise<any>;
  freezeStreak: (days: number) => Promise<void>;
  deactivateFreeze: () => Promise<void>;
  updateProfile: (data: Partial<BackendUser>) => Promise<void>;
  equipTitle: (title: string) => Promise<void>;
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
  const authStartTime = performance.now();

  // Diagnostic log for boot
  console.log("[BOOT] initialization started");
  console.log("[BOOT] auth initialization started");

  let authListenerFired = false;

  // 1. Process potential redirect results from signInWithRedirect
  getRedirectResult(auth)
    .then(async (result) => {
      if (result && result.user) {
        console.log("[AUTH] Successful redirect login. User UID:", result.user.uid);
        set({ firebaseUser: result.user, initialized: true });
        await get().refreshFromBackend();
      }
    })
    .catch((err) => {
      console.warn("[AUTH] Error handling redirect result:", err);
    });

  // Fallback safety timer in case Firebase Auth listener is stalled (e.g. offline/IndexedDB issue)
  const authTimeoutId = setTimeout(() => {
    if (!authListenerFired) {
      authListenerFired = true;
      console.warn("[BOOT] auth initialization fallback timeout reached");
      console.log(`[PERF] auth: ${Math.round(performance.now() - authStartTime)}ms (timeout)`);
      console.log("[BOOT] auth initialization completed");
      console.log("[BOOT] authenticated user: none (fallback)");
      console.log("[BOOT] session available: false");
      set({ initialized: true, firebaseUser: null, loading: false });
    }
  }, 4000);

  // 2. Listen to Auth state changes and boot store sync
  onAuthStateChanged(auth, async (fbUser) => {
    if (!authListenerFired) {
      authListenerFired = true;
      clearTimeout(authTimeoutId);
    }

    const authDuration = Math.round(performance.now() - authStartTime);
    console.log(`[PERF] auth: ${authDuration}ms`);
    perfLogger.mark("authReady", authDuration);
    console.log("[BOOT] auth initialization completed");

    if (fbUser) {
      console.log(`[AUTH] authenticated user: ${fbUser.uid} ${fbUser.email ? `(${fbUser.email})` : ""}`);
      console.log("[BOOT] session available: true");
      set({ firebaseUser: fbUser, initialized: true });
      await get().refreshFromBackend();
    } else {
      console.log("[AUTH] authenticated user: none");
      console.log("[BOOT] session available: false");
      set({
        firebaseUser: null,
        user: null,
        habits: [],
        chatSessions: [],
        chatMessages: [],
        initialized: true,
        profileSynced: false,
        loading: false,
        backendError: null,
        profileVersion: get().profileVersion + 1,
      });
    }
  });

  return {
    firebaseUser: null,
    user: null,
    habits: [],
    quote: "One day broke. Don't let two.",
    initialized: false,
    loading: false,
    profileSynced: false,
    profileVersion: 0,
    backendError: null,
    activeTab: "dashboard",
    pendingHabitIds: new Set<string>(),
    titleUnlockData: null,
    titleLossData: null,
    levelUpData: null,

    chatSessions: [],
    activeChatId: null,
    chatMessages: [],
    chatLoading: false,
    sessionsLoading: false,

    setFirebaseUser: (fbUser) => {
      console.log("[AUTH] setFirebaseUser called:", fbUser ? `authenticated (UID: ${fbUser.uid})` : "unauthenticated");
      set({ firebaseUser: fbUser, initialized: true });
    },

    incrementProfileVersion: () => {
      set((state) => ({ profileVersion: state.profileVersion + 1 }));
    },

    setActiveTab: (tab) => set({ activeTab: tab }),
    setTitleUnlockData: (data) => set({ titleUnlockData: data }),
    setTitleLossData: (data) => set({ titleLossData: data }),
    setLevelUpData: (data) => set({ levelUpData: data }),

    refreshFromBackend: async () => {
      const activeFbUser = auth.currentUser || get().firebaseUser;

      if (!activeFbUser) {
        console.warn("[AUTH] No authenticated Firebase user present, skipping backend sync.");
        set({ loading: false, profileSynced: false });
        return;
      }

      set({ loading: true, backendError: null });

      try {
        await syncService.syncUserData(true);
        get().fetchSessions().catch((sErr) => console.warn("Failed to fetch chat sessions:", sErr));
      } catch (err: any) {
        console.error("[SYNC ERROR] refreshFromBackend failed:", err?.message || err);
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
        const created = await syncService.saveHabit(habitData);
        set((state) => ({
          habits: state.habits.map((h) => (h.id === tempId ? created : h)),
        }));
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
        const updated = await syncService.saveHabit(habitData, habitId);
        set((state) => ({
          habits: state.habits.map((h) => (h.id === habitId ? updated : h)),
        }));
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
        syncService.scheduleBackgroundSync(1000);
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

      const targetHabit = get().habits.find((h) => h.id === habitId);
      if (targetHabit?.completedToday) {
        console.warn(`[useStore] Habit ${habitId} is already completed today. Ignoring duplicate complete.`);
        return;
      }

      const originalHabits = get().habits;
      const originalUser = get().user;
      const today = getLocalCalendarDate();
      const earnedXp = getXpForDifficulty(targetHabit?.difficulty);

      const prevStreak = originalUser?.streak ?? originalUser?.currentStreak ?? 0;
      const wasTodayAlreadyActive = originalHabits.some(
        (h) => h.id !== habitId && (h.completedToday || h.completedDates?.includes(today))
      );
      const optimisticStreak = wasTodayAlreadyActive
        ? prevStreak
        : (prevStreak === 0 ? 1 : prevStreak + 1);

      let prevXp = 0;
      let newTotalXp = 0;
      let nextLevel = 1;
      let nextProgress = 0;
      let completedTodayCount = 0;
      let totalTodayCount = 0;
      let todayPct = 0;

      set((state) => {
        const nextPending = new Set(state.pendingHabitIds);
        nextPending.add(habitId);

        prevXp = typeof state.user?.xp === "number" && !isNaN(state.user.xp) ? Math.max(0, state.user.xp) : 0;
        newTotalXp = prevXp + earnedXp;
        const currentLevel = typeof state.user?.level === "number" && !isNaN(state.user.level) && state.user.level >= 1
          ? Math.floor(state.user.level)
          : 1;
        nextLevel = Math.max(currentLevel, Math.floor(newTotalXp / 100) + 1);
        nextProgress = calculateLevelProgress(newTotalXp, nextLevel, 100);

        const isLevelUp = nextLevel > currentLevel;

        const updatedHabits = state.habits.map((h) =>
          h.id === habitId
            ? {
                ...h,
                completedToday: true,
                completedDates: h.completedDates?.includes(today)
                  ? h.completedDates
                  : [...(h.completedDates || []), today],
              }
            : h
        );

        const safeHabitsList = Array.isArray(updatedHabits) ? updatedHabits : [];
        const scheduledTodayList = safeHabitsList.filter(isHabitScheduledForToday);
        completedTodayCount = scheduledTodayList.filter((h) => h.completedToday).length;
        totalTodayCount = scheduledTodayList.length;
        todayPct = totalTodayCount === 0 ? 0 : Math.round((completedTodayCount / totalTodayCount) * 100);

        const updatedUser: BackendUser | null = state.user
          ? {
              ...state.user,
              xp: newTotalXp,
              level: nextLevel,
              levelProgress: nextProgress,
              streak: optimisticStreak,
              currentStreak: optimisticStreak,
              lastActiveDate: today,
            }
          : null;

        return {
          pendingHabitIds: nextPending,
          user: updatedUser,
          habits: updatedHabits,
          ...(isLevelUp
            ? {
                levelUpData: {
                  previousLevel: currentLevel,
                  currentLevel: nextLevel,
                  xp: newTotalXp,
                  progress: nextProgress,
                },
              }
            : {}),
        };
      });

      console.log(
        `[HABIT COMPLETION]\nhabitId: ${habitId}\nearnedXP: ${earnedXp}\npreviousXP: ${prevXp}\nnewXP: ${newTotalXp}\ncompletedToday: ${completedTodayCount}\ntotalToday: ${totalTodayCount}\ntodayPercentage: ${todayPct}%\nlevel: ${nextLevel}\nlevelProgress: ${nextProgress}%`
      );

      try {
        const res = await syncService.saveHabitCompletion(habitId, true);

        if (res && res.success === false) {
          const errMsg =
            res?.error?.message ||
            (typeof res?.error === "string" ? res.error : "Failed to complete habit on server");
          throw new Error(errMsg);
        }

        const root = (res as any)?.data || res;
        const userObj = root?.user || root;
        const targetTitle = root?.title || userObj?.title || root?.unlockedTitle;
        const currentUserId = userObj?.id || userObj?.userId || get().user?.id || get().user?.userId;

        if ((root?.titleUnlocked || userObj?.titleUnlocked) && targetTitle) {
          const isGenuinelyNew = isTitleNew(targetTitle, currentUserId);
          if (isGenuinelyNew) {
            set({
              titleUnlockData: {
                title: targetTitle,
                signature: getTitleDescription(targetTitle, root?.signature || userObj?.signature),
                level: root?.level || userObj?.level || nextLevel,
              }
            });
          }
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

        const backendStreak =
          typeof root?.streak === "number" ? root.streak :
          typeof root?.user?.streak === "number" ? root.user.streak :
          typeof root?.currentStreak === "number" ? root.currentStreak :
          typeof root?.user?.currentStreak === "number" ? root.user.currentStreak :
          optimisticStreak;

        const displayedStreak = backendStreak;

        console.log(
          `[STREAK FRONTEND]\npreviousStreak: ${prevStreak}\ncompletionRequest: ${habitId}\nbackendStreak: ${backendStreak}\ndisplayedStreak: ${displayedStreak}`
        );

        set((state) => {
          const nextPending = new Set(state.pendingHabitIds);
          nextPending.delete(habitId);

          const normalizedUser = normalizeUser(res, state.user);
          const currentXp = state.user?.xp ?? newTotalXp;
          const resXp = normalizedUser?.xp ?? 0;
          const finalXp = Math.max(currentXp, resXp);
          const finalLevel = Math.max(
            normalizedUser?.level ?? 1,
            state.user?.level ?? 1,
            Math.floor(finalXp / 100) + 1
          );
          const finalProgress = calculateLevelProgress(finalXp, finalLevel, 100);

          const finalUser = state.user
            ? {
                ...state.user,
                ...normalizedUser,
                xp: finalXp,
                level: finalLevel,
                levelProgress: finalProgress,
                streak: backendStreak,
                currentStreak: backendStreak,
                lastActiveDate: today,
              }
            : normalizedUser;

          return {
            user: finalUser,
            pendingHabitIds: nextPending,
          };
        });

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

      const targetHabit = get().habits.find((h) => h.id === habitId);
      if (!targetHabit?.completedToday) {
        console.warn(`[useStore] Habit ${habitId} is not completed today. Ignoring undo.`);
        return;
      }

      const originalHabits = get().habits;
      const originalUser = get().user;
      const today = getLocalCalendarDate();
      const earnedXp = getXpForDifficulty(targetHabit?.difficulty);

      const prevStreak = originalUser?.streak ?? originalUser?.currentStreak ?? 0;
      const hasOtherCompletedToday = originalHabits.some(
        (h) => h.id !== habitId && (h.completedToday || (h.completedDates?.includes(today) && h.id !== habitId))
      );
      const optimisticStreak = hasOtherCompletedToday ? prevStreak : Math.max(0, prevStreak - 1);

      let prevXp = 0;
      let newTotalXp = 0;
      let nextLevel = 1;
      let nextProgress = 0;

      set((state) => {
        const nextPending = new Set(state.pendingHabitIds);
        nextPending.add(habitId);

        prevXp = typeof state.user?.xp === "number" && !isNaN(state.user.xp) ? Math.max(0, state.user.xp) : 0;
        newTotalXp = Math.max(0, prevXp - earnedXp);
        const currentLevel = typeof state.user?.level === "number" && !isNaN(state.user.level) && state.user.level >= 1
          ? Math.floor(state.user.level)
          : 1;
        nextLevel = Math.max(1, Math.floor(newTotalXp / 100) + 1);
        nextProgress = calculateLevelProgress(newTotalXp, nextLevel, 100);

        const updatedHabits = state.habits.map((h) =>
          h.id === habitId
            ? {
                ...h,
                completedToday: false,
                completedDates: (h.completedDates || []).filter((d) => d !== today),
              }
            : h
        );

        const updatedUser: BackendUser | null = state.user
          ? {
              ...state.user,
              xp: newTotalXp,
              level: nextLevel,
              levelProgress: nextProgress,
              streak: optimisticStreak,
              currentStreak: optimisticStreak,
            }
          : null;

        return {
          pendingHabitIds: nextPending,
          user: updatedUser,
          habits: updatedHabits,
        };
      });

      try {
        const res = await syncService.saveHabitCompletion(habitId, false);

        if (res && res.success === false) {
          const errMsg =
            res?.error?.message ||
            (typeof res?.error === "string" ? res.error : "Failed to undo habit completion");
          throw new Error(errMsg);
        }

        const root = (res as any)?.data || res;
        const backendStreak =
          typeof root?.streak === "number" ? root.streak :
          typeof root?.user?.streak === "number" ? root.user.streak :
          typeof root?.currentStreak === "number" ? root.currentStreak :
          typeof root?.user?.currentStreak === "number" ? root.user.currentStreak :
          optimisticStreak;

        const displayedStreak = backendStreak;

        console.log(
          `[STREAK FRONTEND]\npreviousStreak: ${prevStreak}\ncompletionRequest: undo_${habitId}\nbackendStreak: ${backendStreak}\ndisplayedStreak: ${displayedStreak}`
        );

        set((state) => {
          const nextPending = new Set(state.pendingHabitIds);
          nextPending.delete(habitId);

          const normalizedUser = normalizeUser(res, state.user);
          const finalUser = state.user
            ? {
                ...state.user,
                ...normalizedUser,
                xp: newTotalXp,
                level: nextLevel,
                levelProgress: nextProgress,
                streak: backendStreak,
                currentStreak: backendStreak,
              }
            : normalizedUser;

          return {
            user: finalUser,
            pendingHabitIds: nextPending,
          };
        });

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
            : "Failed to undo habit completion on server";

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
        
        // Use step API if only updating step
        if (Object.keys(data).length === 1 && data.onboardingStep !== undefined) {
          await userService.updateOnboardingStep(data.onboardingStep);
        } else {
          await syncService.saveProfile(data);
        }
        
        const isCompletingOnboarding = Boolean(data.onboarded || data.hasCompletedOnboarding);
        const newVersion = isCompletingOnboarding ? get().profileVersion + 1 : get().profileVersion;
        set({ profileVersion: newVersion });
        syncService.scheduleBackgroundSync(800);
      } catch (e) {
        console.error("[useStore] updateProfile error:", e);
        throw e;
      }
    },

    equipTitle: async (title: string) => {
      const currentUser = get().user;
      if (!currentUser) return;
      const normalizedTitle = title.trim().toUpperCase();
      setEquippedTitle(normalizedTitle, currentUser.id || currentUser.userId);
      const updatedUser: BackendUser = {
        ...currentUser,
        title: normalizedTitle,
        equippedTitle: normalizedTitle,
      };
      set({ user: updatedUser });
      localStorage.setItem("oneday_cached_user", JSON.stringify(updatedUser));
      try {
        await userService.updateProfile({ title: normalizedTitle, equippedTitle: normalizedTitle } as any);
      } catch (err) {
        console.warn("Could not sync equipped title to backend API:", err);
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

    createSession: async () => {
      set({ activeChatId: null, chatMessages: [] });
      localStorage.removeItem("activeChatId");
      return "";
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

      const userMsg: ChatMessage = {
        id: `user_${Date.now()}`,
        sessionId: activeId || "",
        role: "user",
        content: messageText,
        createdAt: new Date().toISOString(),
      };

      const tempAssistantMsgId = `assistant_${Date.now()}`;
      const placeholderMsg: ChatMessage = {
        id: tempAssistantMsgId,
        sessionId: activeId || "",
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
        const res = await chatService.sendMessage(activeId || null, messageText);
        const reply = res.reply || "Focus on daily execution.";
        const returnedSessionId = res.sessionId;

        if (returnedSessionId && returnedSessionId !== activeId) {
          activeId = returnedSessionId;
          set({ activeChatId: returnedSessionId });
          localStorage.setItem("activeChatId", returnedSessionId);
          await get().fetchSessions();
        }

        set((state) => ({
          chatMessages: state.chatMessages.map((m) =>
            m.id === tempAssistantMsgId ? { ...m, sessionId: activeId || "", content: reply, isStreaming: false } : m
          ),
          chatLoading: false,
        }));

        // Title Auto Update logic
        if (activeId) {
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
      try {
        await chatService.editMessage(messageId, newContent);
        // Optimistically update local UI
        set((state) => {
          const updated = state.chatMessages.map(m => 
            m.id === messageId ? { ...m, content: newContent } : m
          );
          return { chatMessages: updated };
        });
      } catch (e) {
        console.warn("Failed to edit message:", e);
      }
    },
  };
});
