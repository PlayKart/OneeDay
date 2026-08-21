// src/services/syncService.ts

import { auth } from "../lib/firebase";
import { dashboardService } from "./dashboardService";
import { userService } from "./userService";
import { habitService } from "./habitService";
import { useStore } from "../store/useStore";
import { User, Habit } from "../types";
import { normalizeUser, safeArray } from "../utils";

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'retrying' | 'error' | 'offline';

export interface SyncState {
  status: SyncStatus;
  lastSyncedAt: number | null;
  errorMessage: string | null;
  pendingCount: number;
}

type SyncStateListener = (state: SyncState) => void;

interface OfflineMutation {
  idempotencyKey: string;
  type: 'COMPLETE_HABIT' | 'UNDO_HABIT' | 'SAVE_HABIT' | 'UPDATE_PROFILE';
  payload: any;
  createdAt: number;
}

class SyncService {
  private status: SyncStatus = 'idle';
  private lastSyncedAt: number | null = null;
  private errorMessage: string | null = null;
  private listeners = new Set<SyncStateListener>();

  // Inflight request map for deduplication
  private inflightPromises = new Map<string, Promise<any>>();

  // Debounce timer for background refresh
  private backgroundSyncTimer: ReturnType<typeof setTimeout> | null = null;

  private offlineQueueKey = "oneday_offline_mutations_v1";

  constructor() {
    this.initListeners();
  }

  public subscribe(listener: SyncStateListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getState(): SyncState {
    const isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;
    const queue = this.getOfflineQueue();
    return {
      status: !isOnline ? 'offline' : this.status,
      lastSyncedAt: this.lastSyncedAt,
      errorMessage: this.errorMessage,
      pendingCount: queue.length,
    };
  }

  private notify() {
    const state = this.getState();
    this.listeners.forEach((fn) => fn(state));
  }

  private setStatus(status: SyncStatus, errorMessage: string | null = null) {
    this.status = status;
    this.errorMessage = errorMessage;
    if (status === 'success') {
      this.lastSyncedAt = Date.now();
    }
    this.notify();
  }

  private initListeners() {
    if (typeof window === "undefined") return;

    window.addEventListener("online", () => {
      console.log("[SYNC] Network connection restored. Flushing queue and syncing...");
      this.setStatus("syncing");
      this.flushOfflineQueue().then(() => {
        this.syncUserData(true);
      });
    });

    window.addEventListener("offline", () => {
      console.log("[SYNC] Network went offline.");
      this.setStatus("offline");
    });

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible" && navigator.onLine) {
        console.log("[SYNC] Page visible. Triggering background sync...");
        this.scheduleBackgroundSync(400);
      }
    });

    window.addEventListener("focus", () => {
      if (navigator.onLine) {
        this.scheduleBackgroundSync(400);
      }
    });
  }

  /**
   * Exponential backoff wrapper
   */
  private async executeWithRetry<T>(
    fn: () => Promise<T>,
    opName: string,
    maxRetries = 3
  ): Promise<T> {
    let attempt = 0;
    const delays = [0, 1000, 3000]; // Attempt 1: 0ms, Attempt 2: 1000ms, Attempt 3: 3000ms

    while (attempt < maxRetries) {
      attempt++;
      if (attempt > 1) {
        this.setStatus("retrying");
        const delay = delays[attempt - 1] || 3000;
        console.log(`[SYNC] Retry attempt ${attempt}/${maxRetries} for ${opName} after ${delay}ms...`);
        await new Promise((res) => setTimeout(res, delay));
      }

      try {
        const res = await fn();
        return res;
      } catch (err: any) {
        console.warn(`[SYNC] Attempt ${attempt} failed for ${opName}:`, err?.message || err);

        // Permanent non-retryable errors
        const isPermanent =
          err?.status === 401 ||
          err?.status === 403 ||
          err?.status === 400 ||
          err?.isAuthError ||
          err?.message?.includes("Not authenticated") ||
          err?.message?.includes("Habit name is required");

        if (isPermanent || attempt >= maxRetries) {
          throw err;
        }
      }
    }

    throw new Error(`Operation ${opName} failed after ${maxRetries} attempts`);
  }

  /**
   * Centralized deduplicated user profile and habit state sync
   */
  public syncUserData(force = false): Promise<any> {
    const activeFbUser = auth.currentUser || useStore.getState().firebaseUser;
    if (!activeFbUser) {
      console.log("[SYNC] No authenticated user present. Skipping syncUserData.");
      this.setStatus("idle");
      return Promise.resolve(null);
    }

    const dedupeKey = `sync_user_${activeFbUser.uid}`;

    if (!force && this.inflightPromises.has(dedupeKey)) {
      console.log("[SYNC] Deduplicating syncUserData request. Reusing active promise.");
      return this.inflightPromises.get(dedupeKey)!;
    }

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      this.setStatus("offline");
      return Promise.resolve(null);
    }

    this.setStatus("syncing");

    const promise = (async () => {
      try {
        const data = await this.executeWithRetry(
          () => dashboardService.fetchDashboardData(),
          "fetchDashboardData"
        );

        // Hydrate data into Zustand store without resetting profile
        const store = useStore.getState();
        const currentLocalUser = store.user;

        const fetchedUser = normalizeUser(data, currentLocalUser);
        const currentXp = typeof currentLocalUser?.xp === "number" && !isNaN(currentLocalUser.xp) ? currentLocalUser.xp : 0;
        const fetchedXp = typeof fetchedUser?.xp === "number" && !isNaN(fetchedUser.xp) ? fetchedUser.xp : 0;
        const finalXp = Math.max(currentXp, fetchedXp);
        const finalLevel = Math.max(
          fetchedUser?.level ?? 1,
          currentLocalUser?.level ?? 1,
          Math.floor(finalXp / 100) + 1
        );

        const finalUser = fetchedUser
          ? {
              ...fetchedUser,
              xp: finalXp,
              level: finalLevel,
            }
          : fetchedUser;

        if (finalUser) {
          localStorage.setItem("oneday_cached_user", JSON.stringify(finalUser));
        }

        // Merge habits cleanly preserving pending/local updates
        const todayStr = new Date().toISOString().split("T")[0];
        const incomingHabits = safeArray<Habit>(data?.habits);
        const currentHabits = store.habits;

        const mergedHabits = incomingHabits.map((inc) => {
          const local = currentHabits.find((h) => h.id === inc.id);
          if (local?.completedToday && !inc.completedToday) {
            const isPending = store.pendingHabitIds.has(inc.id);
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

        const finalHabits = mergedHabits.length > 0 ? mergedHabits : (currentHabits.length > 0 ? currentHabits : incomingHabits);
        if (finalHabits && finalHabits.length > 0) {
          localStorage.setItem("oneday_cached_habits", JSON.stringify(finalHabits));
        }

        useStore.setState({
          user: finalUser,
          habits: finalHabits,
          quote: data?.quote || "Discipline makes it all.",
          loading: false,
          profileSynced: true,
          backendError: null,
        });

        this.setStatus("success");
        return data;
      } catch (err: any) {
        console.error("[SYNC ERROR] syncUserData failed:", err?.message || err);

        const isOffline = typeof navigator !== "undefined" && (!navigator.onLine || err?.message?.includes("network"));
        if (isOffline) {
          this.setStatus("offline");
        } else {
          this.setStatus("error", "Sync temporarily unavailable");
        }

        // Keep local user profile if available, do NOT crash app
        const existingUser = useStore.getState().user;
        useStore.setState({
          loading: false,
          profileSynced: Boolean(existingUser),
          backendError: existingUser ? null : "Sync temporarily unavailable",
        });

        throw err;
      }
    })().finally(() => {
      this.inflightPromises.delete(dedupeKey);
    });

    this.inflightPromises.set(dedupeKey, promise);
    return promise;
  }

  /**
   * Schedule a debounced background sync after mutations
   */
  public scheduleBackgroundSync(delayMs = 1200) {
    if (this.backgroundSyncTimer) {
      clearTimeout(this.backgroundSyncTimer);
    }
    this.backgroundSyncTimer = setTimeout(() => {
      if (typeof navigator !== "undefined" && navigator.onLine) {
        this.syncUserData().catch((e) => console.warn("[SYNC] Background sync deferred:", e?.message));
      }
    }, delayMs);
  }

  /**
   * Save Habit Completion with Idempotency Key & Offline Queue
   */
  public async saveHabitCompletion(habitId: string, isCompleted: boolean, dateStr?: string): Promise<any> {
    const fbUser = auth.currentUser || useStore.getState().firebaseUser;
    if (!fbUser) throw new Error("Not authenticated");

    const today = dateStr || new Date().toISOString().split("T")[0];
    const idempotencyKey = `comp_${fbUser.uid}_${habitId}_${today}`;
    const dedupeKey = `complete_${idempotencyKey}_${isCompleted}`;

    if (this.inflightPromises.has(dedupeKey)) {
      console.log(`[SYNC] Deduplicating completion request for habit ${habitId}. Reusing active promise.`);
      return this.inflightPromises.get(dedupeKey)!;
    }

    const promise = (async () => {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        console.log(`[SYNC] Offline: Queueing completion mutation for ${habitId}`);
        this.enqueueOfflineMutation({
          idempotencyKey,
          type: isCompleted ? 'COMPLETE_HABIT' : 'UNDO_HABIT',
          payload: { habitId, date: today, userId: fbUser.uid },
          createdAt: Date.now(),
        });
        this.setStatus("offline");
        return { success: true, offline: true };
      }

      this.setStatus("syncing");

      try {
        const res = await this.executeWithRetry(
          async () => {
            if (isCompleted) {
              return await habitService.completeHabit(habitId);
            } else {
              return await habitService.undoHabit(habitId);
            }
          },
          `saveHabitCompletion_${habitId}`
        );

        this.setStatus("success");
        this.scheduleBackgroundSync(1200);
        return res;
      } catch (err: any) {
        console.warn(`[SYNC] Network completion mutation failed for habit ${habitId}. Queueing offline mutation...`);
        this.enqueueOfflineMutation({
          idempotencyKey,
          type: isCompleted ? 'COMPLETE_HABIT' : 'UNDO_HABIT',
          payload: { habitId, date: today, userId: fbUser.uid },
          createdAt: Date.now(),
        });
        this.setStatus("offline");
        return { success: true, offline: true };
      }
    })().finally(() => {
      this.inflightPromises.delete(dedupeKey);
    });

    this.inflightPromises.set(dedupeKey, promise);
    return promise;
  }

  /**
   * Save Habit (Create / Edit)
   */
  public async saveHabit(habitData: Partial<Habit>, habitId?: string): Promise<Habit> {
    const dedupeKey = `save_habit_${habitId || 'new_' + (habitData.name || Date.now())}`;

    if (this.inflightPromises.has(dedupeKey)) {
      return this.inflightPromises.get(dedupeKey)!;
    }

    const promise = (async () => {
      this.setStatus("syncing");
      try {
        let result: Habit;
        if (habitId) {
          result = await this.executeWithRetry(
            () => habitService.updateHabit(habitId, habitData),
            `editHabit_${habitId}`
          );
        } else {
          result = await this.executeWithRetry(
            () => habitService.createHabit(habitData),
            `createHabit`
          );
        }
        this.setStatus("success");
        this.scheduleBackgroundSync(1200);
        return result;
      } catch (err) {
        this.setStatus("error", "Failed to save habit");
        throw err;
      }
    })().finally(() => {
      this.inflightPromises.delete(dedupeKey);
    });

    this.inflightPromises.set(dedupeKey, promise);
    return promise;
  }

  /**
   * Save Profile
   */
  public async saveProfile(profileData: Partial<User>): Promise<User> {
    this.setStatus("syncing");
    try {
      const result = await this.executeWithRetry(
        () => userService.updateProfile(profileData),
        `updateProfile`
      );
      this.setStatus("success");
      this.scheduleBackgroundSync(1000);
      return result;
    } catch (err) {
      this.setStatus("error", "Failed to update profile");
      throw err;
    }
  }

  // --- Offline Queue Persistence ---

  private getOfflineQueue(): OfflineMutation[] {
    try {
      const raw = localStorage.getItem(this.offlineQueueKey);
      return raw ? JSON.parse(raw) : [];
    } catch (_) {
      return [];
    }
  }

  private saveOfflineQueue(queue: OfflineMutation[]) {
    try {
      localStorage.setItem(this.offlineQueueKey, JSON.stringify(queue));
      this.notify();
    } catch (_) {}
  }

  private enqueueOfflineMutation(mutation: OfflineMutation) {
    const queue = this.getOfflineQueue();
    const exists = queue.some((item) => item.idempotencyKey === mutation.idempotencyKey);
    if (!exists) {
      queue.push(mutation);
      this.saveOfflineQueue(queue);
    }
  }

  public async flushOfflineQueue(): Promise<void> {
    if (typeof navigator !== "undefined" && !navigator.onLine) return;

    const queue = this.getOfflineQueue();
    if (queue.length === 0) return;

    console.log(`[SYNC] Flushing ${queue.length} offline mutation(s)...`);
    this.setStatus("syncing");

    const remaining: OfflineMutation[] = [];

    for (const item of queue) {
      try {
        if (item.type === 'COMPLETE_HABIT') {
          await habitService.completeHabit(item.payload.habitId);
        } else if (item.type === 'UNDO_HABIT') {
          await habitService.undoHabit(item.payload.habitId);
        }
      } catch (err) {
        console.warn(`[SYNC] Failed to process offline item ${item.idempotencyKey}:`, err);
        remaining.push(item);
      }
    }

    this.saveOfflineQueue(remaining);
    if (remaining.length === 0) {
      this.setStatus("success");
    }
  }
}

export const syncService = new SyncService();
