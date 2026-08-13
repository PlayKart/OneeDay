// src/utils/index.ts

export * from "./camelCase";
import { User } from "../types";

export const VALID_GENDERS = ["Male", "Female", "Prefer not to say", "Other"] as const;
export type ValidGender = typeof VALID_GENDERS[number];

export function normalizeGenderValue(val?: string | null): string {
  if (!val || typeof val !== "string") return "";
  const trimmed = val.trim();
  if (VALID_GENDERS.includes(trimmed as ValidGender)) {
    return trimmed;
  }
  const lower = trimmed.toLowerCase();
  if (lower === "male") return "Male";
  if (lower === "female") return "Female";
  if (lower === "prefer not to say" || lower === "prefer_not_to_say" || lower === "prefer-not-to-say") return "Prefer not to say";
  if (lower === "other" || lower === "non-binary" || lower === "non_binary") return "Other";
  return "";
}

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

export function hasCompletedOnboarding(u: any): boolean {
  if (!u) return false;

  // Prioritize needsOnboarding or needs_onboarding
  if (u.needsOnboarding === false || u.needsOnboarding === "false") return true;
  if (u.needs_onboarding === false || u.needs_onboarding === "false") return true;
  if (u.needsOnboarding === true || u.needsOnboarding === "true") return false;
  if (u.needs_onboarding === true || u.needs_onboarding === "true") return false;

  // Fallback to onboarding_completed / onboardingCompleted / onboarded / hasCompletedOnboarding
  if (u.onboarding_completed === true || u.onboarding_completed === "true") return true;
  if (u.onboardingCompleted === true || u.onboardingCompleted === "true") return true;
  if (u.hasCompletedOnboarding === true || u.hasCompletedOnboarding === "true") return true;
  if (u.onboarded === true || u.onboarded === "true") return true;

  if (u.nextRoute === "/dashboard") return true;
  if (typeof u.onboardingStep === "number" && u.onboardingStep >= 6) return true;
  if (typeof u.onboarding_step === "number" && u.onboarding_step >= 6) return true;

  return false;
}

function isUserOnboarded(rawUser: any): boolean | undefined {
  if (!rawUser) return undefined;

  if (rawUser.needsOnboarding === false || rawUser.needsOnboarding === "false") return true;
  if (rawUser.needs_onboarding === false || rawUser.needs_onboarding === "false") return true;
  if (rawUser.needsOnboarding === true || rawUser.needsOnboarding === "true") return false;
  if (rawUser.needs_onboarding === true || rawUser.needs_onboarding === "true") return false;

  if (rawUser.onboarding_completed === true || rawUser.onboarding_completed === "true") return true;
  if (rawUser.onboardingCompleted === true || rawUser.onboardingCompleted === "true") return true;
  if (rawUser.hasCompletedOnboarding === true || rawUser.hasCompletedOnboarding === "true") return true;
  if (rawUser.onboarded === true || rawUser.onboarded === "true") return true;

  if (rawUser.nextRoute === "/dashboard") return true;
  if (typeof rawUser.onboardingStep === "number" && rawUser.onboardingStep >= 6) return true;
  if (typeof rawUser.onboarding_step === "number" && rawUser.onboarding_step >= 6) return true;

  return undefined;
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
        onboarded: false,
        hasCompletedOnboarding: false,
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
    u?.data?.data,
    u?.data?.data?.user,
    u?.data?.data?.stats,
  ].filter((item) => item && typeof item === "object");

  const findFirstNumber = (keys: string[]): number | undefined => {
    for (const obj of objectsToCheck) {
      for (const key of keys) {
        if (obj[key] !== undefined && obj[key] !== null && obj[key] !== "") {
           const parsed = Number(obj[key]);
           if (!isNaN(parsed)) return parsed;
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

  const xpVal = findFirstNumber(["totalXP", "total_xp", "totalXp", "xp", "experience", "currentXp", "current_xp"]);

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

  const rawOnboarded = isUserOnboarded(rawUser);
  const isCompleted = rawOnboarded !== undefined ? rawOnboarded : false;

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
    dob: rawUser?.date_of_birth || rawUser?.dateOfBirth || rawUser?.dob || existingUser?.dob,
    age: typeof rawUser?.age === "number" ? rawUser.age : (typeof rawUser?.age === "string" ? parseInt(rawUser.age, 10) : existingUser?.age),
    gender: normalizeGenderValue(rawUser?.gender || existingUser?.gender),
    hobbies: Array.isArray(rawUser?.hobbies) ? rawUser.hobbies : (Array.isArray(rawUser?.hobbies_list) ? rawUser.hobbies_list : existingUser?.hobbies),
    favouriteSports: Array.isArray(rawUser?.sports) ? rawUser.sports : (Array.isArray(rawUser?.favouriteSports) ? rawUser.favouriteSports : (Array.isArray(rawUser?.favourite_sports) ? rawUser.favourite_sports : existingUser?.favouriteSports)),
    reasonForJoining: rawUser?.why_oneday || rawUser?.whyOneday || rawUser?.reasonForJoining || rawUser?.reason_for_joining || rawUser?.reason || existingUser?.reasonForJoining,
    onboarded: isCompleted,
    hasCompletedOnboarding: isCompleted,
    onboarding_completed: isCompleted,
    onboardingCompleted: isCompleted,
    needsOnboarding: !isCompleted,
    needs_onboarding: !isCompleted,
    nextRoute: isCompleted ? "/dashboard" : "/onboarding",
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

export function toCanonicalDifficulty(val?: string): string {
  if (!val) return "medium";
  const s = String(val).trim().toLowerCase();
  switch (s) {
    case "easy":
      return "easy";
    case "medium":
      return "medium";
    case "hard":
      return "hard";
    case "elite":
      return "elite";
    default:
      return "medium";
  }
}

export function toDisplayDifficulty(val?: string): string {
  if (!val) return "Medium";
  const s = String(val).trim().toLowerCase();
  switch (s) {
    case "easy":
      return "Easy";
    case "medium":
      return "Medium";
    case "hard":
      return "Hard";
    case "elite":
      return "Elite";
    default:
      return "Medium";
  }
}

/**
 * Returns the official XP value for a habit difficulty level:
 * Easy = 20
 * Medium = 40
 * Hard = 60
 * Elite = 80
 */
export function getXpForDifficulty(difficulty?: string): number {
  if (!difficulty) return 40;
  const d = String(difficulty).trim().toLowerCase();
  switch (d) {
    case "easy":
      return 20;
    case "medium":
      return 40;
    case "hard":
      return 60;
    case "elite":
      return 80;
    default:
      return 40;
  }
}

/**
 * Extracts xpAwarded from backend completion response, falling back to difficulty mapping.
 */
export function extractXpAwarded(res: any, habitDifficulty?: string): number {
  if (res) {
    const root = res.data || res;
    const val =
      root.xpAwarded ??
      root.xp_awarded ??
      root.xp_earned ??
      res.xpAwarded ??
      res.xp_awarded ??
      res.xp_earned;
    if (typeof val === "number" && !isNaN(val)) {
      return val;
    }
  }
  return getXpForDifficulty(habitDifficulty);
}

