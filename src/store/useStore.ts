// src/store/useStore.ts

import { create } from 'zustand';
import { auth } from '../lib/firebase';
import { onAuthStateChanged, User as FirebaseUser, getRedirectResult } from 'firebase/auth';
import { dashboardService } from '../services/dashboardService';
import { habitService } from '../services/habitService';
import { chatService } from '../services/chatService';
import { userService } from '../services/userService';
import { quoteService } from '../services/quoteService';
import { safeArray, normalizeCompletedDates, normalizeUser, hasCompletedOnboarding, calculateLevelProgress, getXpForDifficulty, extractXpAwarded } from '../utils';
import { isHabitScheduledForToday } from '../lib/habitUtils';
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
      console.log("[AUTH] Firebase user:", fbUser.email || fbUser.displayName || fbUser.uid);
      console.log("[AUTH] Firebase UID:", fbUser.uid);
      try {
        const token = await fbUser.getIdToken();
        if (token) {
          console.log("[AUTH] ID token acquired");
          localStorage.setItem("oneday_firebase_token", token);
        }
        localStorage.setItem("oneday_session_active", "true");
        localStorage.setItem("oneday_firebase_uid", fbUser.uid);
        localStorage.setItem("oneday_firebase_email", fbUser.email || "");
      } catch (tokenErr) {
        console.warn("[AUTH] Failed to acquire ID token on auth change:", tokenErr);
      }
      set({ firebaseUser: fbUser, initialized: true });
      console.log("[AUTH] Requesting backend profile sync from onAuthStateChanged...");
      await get().refreshFromBackend();
    } else {
      console.log("[AUTH] Firebase user: null");
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
    console.log("[AUTH] Auth initialization completed");
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
    levelUpData: null,

    chatSessions: [],
    activeChatId: null,
    chatMessages: [],
    chatLoading: false,
    sessionsLoading: false,

    setFirebaseUser: (fbUser) => {
      console.log("[AUTH] setFirebaseUser called:", fbUser ? `authenticated (UID: ${fbUser.uid})` : "unauthenticated");
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
    setLevelUpData: (data) => set({ levelUpData: data }),

    refreshFromBackend: async () => {
      const activeFbUser = auth.currentUser || get().firebaseUser;
      console.log("[TRACE] auth.currentUser", activeFbUser ? { uid: activeFbUser.uid, email: activeFbUser.email } : null);

      if (!activeFbUser) {
        console.warn("[AUTH] No authenticated Firebase user present, skipping backend sync.");
        set({ loading: false, profileSynced: false });
        return;
      }

      if (get().loading) {
        console.log("[AUTH] Backend sync already in progress, ignoring duplicate call.");
        return;
      }

      const reqVersion = get().profileVersion;
      console.error("[SYNC 1] Firebase user:", activeFbUser.email || activeFbUser.displayName || activeFbUser.uid);
      console.error("[SYNC 2] Firebase UID:", activeFbUser.uid);

      let token = "";
      try {
        token = await activeFbUser.getIdToken();
      } catch (tErr) {
        console.warn("Failed to acquire ID token in refreshFromBackend:", tErr);
      }
      console.log("[TRACE] token", token ? `${token.substring(0, 15)}... [length: ${token.length}]` : null);
      console.error("[SYNC 3] Token acquired:", !!token);

      set({ loading: true, backendError: null });

      try {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Connection timed out. Uplink took more than 60 seconds to respond.")), 60000)
        );

        const data = await Promise.race([
          dashboardService.fetchDashboardData(),
          timeoutPromise
        ]);

        console.log("[TRACE] dashboard state", data);
        console.log("[AUTH] Backend response:", data);

        if (get().profileVersion > reqVersion) {
          console.log("[STALE] Ignored response due to higher profile version.");
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
                level: root?.level || userObj?.level || data?.user?.level || 1,
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
        const todayStr = new Date().toISOString().split("T")[0];
        const incomingHabits = safeArray<Habit>(data?.habits);
        const currentHabits = get().habits;
        const mergedHabits = incomingHabits.map((inc) => {
          const local = currentHabits.find((h) => h.id === inc.id);
          if (local?.completedToday && !inc.completedToday) {
            const isPending = get().pendingHabitIds.has(inc.id);
            const hasToday = local.completedDates?.includes(todayStr);
            if (isPending || hasToday) {
              return {
                ...inc,
                completedToday: true,
                completedDates: inc.completedDates?.includes(todayStr)
                  ? inc.completedDates
                  : [...(inc.completedDates || []), todayStr],
              };
            }
          }
          return inc;
        });

        const fetchedUser = normalizeUser(data, get().user);
        const currentXp = get().user?.xp ?? 0;
        const fetchedXp = fetchedUser?.xp ?? 0;
        const finalXp = Math.max(currentXp, fetchedXp);
        const finalLevel = Math.max(fetchedUser?.level ?? 1, get().user?.level ?? 1, Math.floor(finalXp / 100) + 1);
        const finalUser = fetchedUser
          ? {
              ...fetchedUser,
              xp: finalXp,
              level: finalLevel,
              levelProgress: calculateLevelProgress(finalXp, finalLevel, 100),
            }
          : fetchedUser;

        if (finalUser) {
          localStorage.setItem("oneday_cached_user", JSON.stringify(finalUser));
        }

        console.log("[TRACE] user state", finalUser);
        console.log("[TRACE] profile state", finalUser);
        console.log("[TRACE] onboarding state", finalUser ? { onboarded: finalUser.onboarded, hasCompletedOnboarding: finalUser.hasCompletedOnboarding, onboardingStep: finalUser.onboardingStep } : null);

        console.log("[AUTH] Profile loaded:", finalUser?.name || finalUser?.email || "User");
        console.log("[AUTH] needsOnboarding:", !hasCompletedOnboarding(finalUser));

        set({
          user: finalUser,
          habits: mergedHabits.length > 0 ? mergedHabits : (currentHabits.length > 0 ? currentHabits : incomingHabits),
          quote: data?.quote || "Discipline makes it all.",
          loading: false,
          profileSynced: true,
          backendError: null,
        });

        console.error("[SYNC 10] Sync completed");
        get().fetchSessions();
      } catch (err: any) {
        console.error("[SYNC ERROR]", err);
        console.error("[SYNC ERROR STACK]", err?.stack);

        const errorMsg = err?.message || "Failed to sync profile with server.";

        set({
          loading: false,
          profileSynced: false,
          backendError: errorMsg,
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

      const targetHabit = get().habits.find((h) => h.id === habitId);
      if (targetHabit?.completedToday) {
        console.warn(`[useStore] Habit ${habitId} is already completed today. Ignoring duplicate complete.`);
        return;
      }

      const originalHabits = get().habits;
      const originalUser = get().user;
      const today = new Date().toISOString().split("T")[0];
      const earnedXp = getXpForDifficulty(targetHabit?.difficulty);

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

        const updatedUser: BackendUser | null = state.user
          ? {
              ...state.user,
              xp: newTotalXp,
              level: nextLevel,
              levelProgress: nextProgress,
            }
          : null;

        if (updatedUser) {
          localStorage.setItem("oneday_cached_user", JSON.stringify(updatedUser));
        }

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
              level: root?.level || userObj?.level || nextLevel,
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
              }
            : normalizedUser;

          if (finalUser) {
            localStorage.setItem("oneday_cached_user", JSON.stringify(finalUser));
          }

          return {
            user: finalUser,
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

      const targetHabit = get().habits.find((h) => h.id === habitId);
      if (!targetHabit?.completedToday) {
        console.warn(`[useStore] Habit ${habitId} is not completed today. Ignoring undo.`);
        return;
      }

      const originalHabits = get().habits;
      const originalUser = get().user;
      const today = new Date().toISOString().split("T")[0];
      const earnedXp = getXpForDifficulty(targetHabit?.difficulty);

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

        const updatedUser: BackendUser | null = state.user
          ? {
              ...state.user,
              xp: newTotalXp,
              level: nextLevel,
              levelProgress: nextProgress,
            }
          : null;

        if (updatedUser) {
          localStorage.setItem("oneday_cached_user", JSON.stringify(updatedUser));
        }

        const updatedHabits = state.habits.map((h) =>
          h.id === habitId
            ? {
                ...h,
                completedToday: false,
                completedDates: (h.completedDates || []).filter((d) => d !== today),
              }
            : h
        );

        return {
          pendingHabitIds: nextPending,
          user: updatedUser,
          habits: updatedHabits,
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

        set((state) => {
          const nextPending = new Set(state.pendingHabitIds);
          nextPending.delete(habitId);

          const normalizedUser = normalizeUser(res, state.user);
          const resHasExplicitXp = res && (res.totalXP !== undefined || res.xp !== undefined || res.data?.xp !== undefined || res.data?.user?.xp !== undefined);
          const finalXp = resHasExplicitXp ? (normalizedUser?.xp ?? newTotalXp) : (state.user?.xp ?? newTotalXp);
          const finalLevel = Math.max(1, Math.floor(finalXp / 100) + 1);
          const finalProgress = calculateLevelProgress(finalXp, finalLevel, 100);

          const finalUser = state.user
            ? {
                ...state.user,
                ...normalizedUser,
                xp: finalXp,
                level: finalLevel,
                levelProgress: finalProgress,
              }
            : normalizedUser;

          if (finalUser) {
            localStorage.setItem("oneday_cached_user", JSON.stringify(finalUser));
          }

          return {
            user: finalUser,
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
        
        // Use step API if only updating step
        if (Object.keys(data).length === 1 && data.onboardingStep !== undefined) {
          await userService.updateOnboardingStep(data.onboardingStep);
        } else {
          await userService.updateProfile(data);
        }
        
        const isCompletingOnboarding = Boolean(data.onboarded || data.hasCompletedOnboarding);
        const newVersion = isCompletingOnboarding ? get().profileVersion + 1 : get().profileVersion;
        set({ profileVersion: newVersion });
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
