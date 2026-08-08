// src/utils/index.ts

export * from "./camelCase";
import { User } from "../types";

/**
 * Ensures a value is guaranteed to be an array, preventing runtime errors like '.map is not a function'.
 */
export function safeArray<T>(val: any): T[] {
  if (Array.isArray(val)) {
    return val.filter((item) => item !== null && item !== undefined);
  }
  if (val && typeof val === "object") {
    if (Array.isArray((val as any).data)) return (val as any).data;
    if (Array.isArray((val as any).habits)) return (val as any).habits;
    if (Array.isArray((val as any).conversations)) return (val as any).conversations;
    if (Array.isArray((val as any).messages)) return (val as any).messages;
  }
  return [];
}

/**
 * Normalizes backend user response data into a standard User object, prioritizing backend values for streak, xp, level.
 */
export function normalizeUser(u: any, existingUser?: User | null): User {
  if (!u) {
    return (
      existingUser || {
        id: "me",
        name: "User",
        xp: 0,
        streak: 0,
        level: 1,
        levelProgress: 0,
      }
    );
  }

  const objectsToCheck = [
    u,
    u?.data,
    u?.user,
    u?.data?.user,
    u?.stats,
    u?.data?.stats,
    u?.user?.stats,
    u?.data?.user?.stats,
  ].filter((item) => item && typeof item === "object");

  const findFirstNumber = (keys: string[]): number | undefined => {
    for (const obj of objectsToCheck) {
      for (const key of keys) {
        if (typeof obj[key] === "number" && !isNaN(obj[key])) {
          return obj[key];
        }
      }
    }
    return undefined;
  };

  const findFirstString = (keys: string[]): string | undefined => {
    for (const obj of objectsToCheck) {
      for (const key of keys) {
        if (typeof obj[key] === "string" && obj[key].trim().length > 0) {
          return obj[key];
        }
      }
    }
    return undefined;
  };

  const streakVal = findFirstNumber([
    "currentStreak",
    "current_streak",
    "streak",
    "currentStreaks",
    "current_streaks",
  ]);

  const xpVal = findFirstNumber(["xp", "experience", "totalXp", "total_xp"]);

  const levelVal = findFirstNumber(["level", "currentLevel", "current_level"]);

  const levelProgressVal = findFirstNumber([
    "levelProgress",
    "level_progress",
    "progress",
  ]);

  const onboardingStepVal = findFirstNumber([
    "onboardingStep",
    "onboarding_step",
    "step",
  ]);

  const rawUser = u.user || u.data?.user || u.data || u;

  return {
    id:
      findFirstString(["id", "userId", "user_id"]) ||
      existingUser?.id ||
      "user_me",
    userId:
      findFirstString(["userId", "user_id", "id"]) || existingUser?.userId,
    name:
      findFirstString(["name", "displayName", "display_name", "username"]) ||
      existingUser?.name ||
      "Striker",
    email: findFirstString(["email"]) || existingUser?.email || "",
    xp: typeof xpVal === "number" ? xpVal : (existingUser?.xp ?? 0),
    streak: typeof streakVal === "number" ? streakVal : (existingUser?.streak ?? 0),
    currentStreak: typeof streakVal === "number" ? streakVal : (existingUser?.currentStreak ?? existingUser?.streak ?? 0),
    level: typeof levelVal === "number" ? levelVal : (existingUser?.level ?? 1),
    levelProgress:
      typeof levelProgressVal === "number"
        ? levelProgressVal
        : (existingUser?.levelProgress ?? 0),
    freezeUntil:
      findFirstString(["freezeUntil", "freeze_until"]) ||
      rawUser?.freezeUntil ||
      rawUser?.freeze_until ||
      existingUser?.freezeUntil ||
      null,
    freeze_until:
      findFirstString(["freeze_until", "freezeUntil"]) ||
      rawUser?.freeze_until ||
      rawUser?.freezeUntil ||
      existingUser?.freeze_until ||
      null,
    lastActiveDate:
      findFirstString(["lastActiveDate", "last_active_date"]) ||
      rawUser?.lastActiveDate ||
      rawUser?.last_active_date ||
      existingUser?.lastActiveDate ||
      null,
    dob: rawUser?.dob || existingUser?.dob,
    age: typeof rawUser?.age === "number" ? rawUser.age : (typeof rawUser?.age === "string" ? parseInt(rawUser.age, 10) : existingUser?.age),
    gender: rawUser?.gender || existingUser?.gender,
    hobbies: Array.isArray(rawUser?.hobbies) ? rawUser.hobbies : (Array.isArray(rawUser?.hobbies_list) ? rawUser.hobbies_list : existingUser?.hobbies),
    favouriteSports: Array.isArray(rawUser?.favouriteSports) ? rawUser.favouriteSports : (Array.isArray(rawUser?.favourite_sports) ? rawUser.favourite_sports : existingUser?.favouriteSports),
    reasonForJoining: rawUser?.reasonForJoining || rawUser?.reason_for_joining || rawUser?.reason || existingUser?.reasonForJoining,
    onboarded: typeof rawUser?.onboarded === "boolean" ? rawUser.onboarded : (typeof rawUser?.onboarded === "string" ? rawUser.onboarded === "true" : (typeof rawUser?.hasCompletedOnboarding === "boolean" ? rawUser.hasCompletedOnboarding : (typeof rawUser?.hasCompletedOnboarding === "string" ? rawUser.hasCompletedOnboarding === "true" : existingUser?.onboarded))),
    hasCompletedOnboarding: typeof rawUser?.hasCompletedOnboarding === "boolean" ? rawUser.hasCompletedOnboarding : (typeof rawUser?.hasCompletedOnboarding === "string" ? rawUser.hasCompletedOnboarding === "true" : (typeof rawUser?.onboarded === "boolean" ? rawUser.onboarded : (typeof rawUser?.onboarded === "string" ? rawUser.onboarded === "true" : (typeof u?.hasCompletedOnboarding === "boolean" ? u.hasCompletedOnboarding : existingUser?.hasCompletedOnboarding)))),
    nextRoute: (rawUser?.onboarded || rawUser?.hasCompletedOnboarding || existingUser?.onboarded || existingUser?.hasCompletedOnboarding) ? "/dashboard" : (rawUser?.nextRoute || u?.nextRoute || u?.data?.nextRoute || u?.user?.nextRoute || existingUser?.nextRoute),
    onboardingStep: typeof onboardingStepVal === "number" ? onboardingStepVal : (typeof rawUser?.onboardingStep === "number" ? rawUser.onboardingStep : (typeof rawUser?.onboarding_step === "number" ? rawUser.onboarding_step : (typeof rawUser?.onboardingStep === "string" ? parseInt(rawUser.onboardingStep, 10) : (typeof rawUser?.onboarding_step === "string" ? parseInt(rawUser.onboarding_step, 10) : existingUser?.onboardingStep)))),
  };
}

/**
 * Safely normalizes completedDates into a clean string array [YYYY-MM-DD]
 */
export function normalizeCompletedDates(completedDates: any): string[] {
  if (completedDates === null || completedDates === undefined) {
    return [];
  }

  if (Array.isArray(completedDates)) {
    return completedDates
      .map((item) => (item !== null && item !== undefined ? String(item) : ""))
      .filter(Boolean);
  }

  if (completedDates instanceof Set) {
    return Array.from(completedDates)
      .map((item) => (item !== null && item !== undefined ? String(item) : ""))
      .filter(Boolean);
  }

  if (typeof completedDates === "string") {
    const trimmed = completedDates.trim();
    if (!trimmed) return [];

    if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
      try {
        const parsed = JSON.parse(trimmed);
        return normalizeCompletedDates(parsed);
      } catch (e) {
        // Fall back
      }
    }

    if (trimmed.includes(",")) {
      return trimmed.split(",").map((item) => item.trim()).filter(Boolean);
    }

    return [trimmed];
  }

  if (typeof completedDates === "object") {
    if (typeof completedDates[Symbol.iterator] === "function") {
      try {
        return Array.from(completedDates)
          .map((item) => (item !== null && item !== undefined ? String(item) : ""))
          .filter(Boolean);
      } catch (e) {
        // Fall back
      }
    }

    const keys = Object.keys(completedDates);
    if (keys.length === 0) return [];

    const isNumericKeys = keys.every((key) => !isNaN(Number(key)));
    if (isNumericKeys) {
      return Object.values(completedDates)
        .map((item) => (item !== null && item !== undefined ? String(item) : ""))
        .filter(Boolean);
    }

    return keys.filter(
      (key) => completedDates[key] === true || completedDates[key] === "true"
    );
  }

  return [];
}

/**
 * Formats a timestamp string into a clean time/date label
 */
export function formatTimestamp(dateStr?: string): string {
  if (!dateStr) return "";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  } catch (e) {
    return dateStr;
  }
}
