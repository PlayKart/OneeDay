// src/utils/index.ts

export * from "./camelCase";
export * from "./streakUtils";
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

/**
 * Three-state onboarding logical type:
 * - "unknown": Profile / auth is loading or onboarding state not yet resolved from backend
 * - "complete": User has completed onboarding
 * - "incomplete": User is confirmed new / explicitly needs onboarding
 */
export type OnboardingLogicalStatus = "unknown" | "complete" | "incomplete";

/**
 * Authoritative helper to determine onboarding status strictly from backend profile state.
 * Returns:
 *   true  -> onboarded === true (completed)
 *   false -> onboarded === false (needs onboarding)
 *   null  -> onboarded is unknown / undefined / null (profile still loading or not yet resolved)
 * 
 * CRITICAL: UNKNOWN (null) must NEVER be treated as INCOMPLETE (false).
 */
export function getOnboardingStatus(u: any): boolean | null {
  if (!u) return null;

  // Direct authoritative check on onboarded field
  if (u.onboarded === true || u.onboarded === "true") return true;
  if (u.onboarded === false || u.onboarded === "false") return false;

  // Check alternative authoritative backend fields
  if (u.hasCompletedOnboarding === true || u.hasCompletedOnboarding === "true") return true;
  if (u.hasCompletedOnboarding === false || u.hasCompletedOnboarding === "false") return false;

  if (u.onboarding_completed === true || u.onboarding_completed === "true") return true;
  if (u.onboarding_completed === false || u.onboarding_completed === "false") return false;

  if (u.onboardingCompleted === true || u.onboardingCompleted === "true") return true;
  if (u.onboardingCompleted === false || u.onboardingCompleted === "false") return false;

  if (u.needsOnboarding === false || u.needsOnboarding === "false" || u.needs_onboarding === false || u.needs_onboarding === "false") return true;
  if (u.needsOnboarding === true || u.needsOnboarding === "true" || u.needs_onboarding === true || u.needs_onboarding === "true") return false;

  // If user has filled profile details (e.g. why_oneday, dob, gender, hobbies), they completed onboarding
  const hasWhy = Boolean(u.why_oneday || u.whyOneday || u.reasonForJoining || u.reason);
  const hasProfileInfo = Boolean(u.dob || (u.gender && u.gender.length > 0 && u.gender !== "Prefer not to say") || (Array.isArray(u.hobbies) && u.hobbies.length > 0));
  if (hasWhy || hasProfileInfo) {
    return true;
  }

  // Return null when onboarding state is unknown/undefined/null
  return null;
}

export function resolveOnboardingStatus(u: any): OnboardingLogicalStatus {
  const status = getOnboardingStatus(u);
  if (status === true) return "complete";
  if (status === false) return "incomplete";
  return "unknown";
}

export function hasCompletedOnboarding(u: any): boolean | null {
  return getOnboardingStatus(u);
}

function isUserOnboarded(rawUser: any): boolean | undefined {
  const status = getOnboardingStatus(rawUser);
  if (status === null) return undefined;
  return status;
}

/**
 * Calculates level progression percentage from authoritative XP and Level values.
 * Progress = (currentLevelXP / xpRequiredForNextLevel) * 100
 * Clamped between 0 and 100.
 */
export function calculateLevelProgress(
  xp: number | undefined | null,
  level: number | undefined | null,
  xpRequiredForNextLevel: number = 100
): number {
  const safeXP = typeof xp === "number" && !isNaN(xp) ? Math.max(0, xp) : 0;
  const safeLevel = typeof level === "number" && !isNaN(level) && level >= 1 ? Math.floor(level) : 1;
  const safeRequiredXP = typeof xpRequiredForNextLevel === "number" && !isNaN(xpRequiredForNextLevel) && xpRequiredForNextLevel > 0
    ? xpRequiredForNextLevel
    : 100;

  // Determine currentLevelXP based on whether XP is cumulative or per-level
  let currentLevelXP = safeXP;
  const levelCumulativeBase = (safeLevel - 1) * safeRequiredXP;

  if (safeXP >= levelCumulativeBase) {
    currentLevelXP = safeXP - levelCumulativeBase;
    // If XP is higher than one level worth above base (pending level-up threshold), cap within level
    if (currentLevelXP > safeRequiredXP) {
      currentLevelXP = currentLevelXP % safeRequiredXP;
    }
  } else {
    // safeXP is stored directly as per-level XP (less than cumulative base)
    if (currentLevelXP > safeRequiredXP) {
      currentLevelXP = currentLevelXP % safeRequiredXP;
    }
  }

  const progressPercentage = (currentLevelXP / safeRequiredXP) * 100;

  if (isNaN(progressPercentage) || !isFinite(progressPercentage)) {
    return 0;
  }

  return Math.min(100, Math.max(0, progressPercentage));
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
        onboarded: undefined,
        hasCompletedOnboarding: undefined,
      }
    );
  }

  const objectsToCheck = [
    u,
    u?.data,
    u?.user,
    u?.data?.user,
    u?.profile,
    u?.data?.profile,
    u?.stats,
    u?.data?.stats,
    u?.user?.stats,
    u?.data?.user?.stats,
    u?.statistics,
    u?.data?.statistics,
    u?.result,
    u?.data?.result,
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
  const xpAwardedVal = findFirstNumber(["xpAwarded", "xp_awarded", "xpEarned", "xp_earned"]);
  const xpDeductedVal = findFirstNumber(["xpDeducted", "xp_deducted", "xpLost", "xp_lost"]);

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
  const isCompleted = rawOnboarded !== undefined ? rawOnboarded : (existingUser?.onboarded !== undefined ? existingUser.onboarded : undefined);

  let finalXp = existingUser?.xp ?? 0;
  if (typeof xpVal === "number") {
    finalXp = xpVal;
  } else if (typeof xpAwardedVal === "number") {
    finalXp = (existingUser?.xp ?? 0) + xpAwardedVal;
  } else if (typeof xpDeductedVal === "number") {
    finalXp = Math.max(0, (existingUser?.xp ?? 0) - xpDeductedVal);
  }

  const computedLevel = Math.max(1, Math.floor(finalXp / 100) + 1);
  const finalLevel = typeof levelVal === "number"
    ? Math.max(levelVal, computedLevel)
    : (existingUser?.level ? Math.max(existingUser.level, computedLevel) : computedLevel);
  const calculatedLevelProgress = calculateLevelProgress(finalXp, finalLevel, 100);

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
    xp: finalXp,
    streak: typeof streakVal === "number" ? streakVal : (existingUser?.streak ?? 0),
    currentStreak: typeof streakVal === "number" ? streakVal : (existingUser?.currentStreak ?? existingUser?.streak ?? 0),
    level: finalLevel,
    levelProgress: calculatedLevelProgress,
    title:
      findFirstString(["title", "equippedTitle", "equipped_title", "activeTitle", "active_title"]) ||
      existingUser?.title ||
      existingUser?.equippedTitle ||
      (finalLevel >= 3 ? "IRON MIND" : "DISCIPLINE BUILDER"),
    equippedTitle:
      findFirstString(["equippedTitle", "equipped_title", "title", "activeTitle", "active_title"]) ||
      existingUser?.equippedTitle ||
      existingUser?.title ||
      (finalLevel >= 3 ? "IRON MIND" : "DISCIPLINE BUILDER"),
    titles: Array.isArray(rawUser?.titles) ? rawUser.titles : (Array.isArray(rawUser?.unlocked_titles) ? rawUser.unlocked_titles : existingUser?.titles),
    unlockedTitles: Array.isArray(rawUser?.unlockedTitles) ? rawUser.unlockedTitles : (Array.isArray(rawUser?.unlocked_titles) ? rawUser.unlocked_titles : existingUser?.unlockedTitles),
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
    why_oneday:
      findFirstString(["why_oneday", "whyOneday", "why_oneday_reason", "reasonForJoining", "reason_for_joining", "reason"]) ||
      rawUser?.why_oneday ||
      rawUser?.whyOneday ||
      rawUser?.reasonForJoining ||
      rawUser?.reason ||
      existingUser?.why_oneday ||
      existingUser?.whyOneday ||
      existingUser?.reasonForJoining ||
      "",
    whyOneday:
      findFirstString(["why_oneday", "whyOneday", "why_oneday_reason", "reasonForJoining", "reason_for_joining", "reason"]) ||
      rawUser?.why_oneday ||
      rawUser?.whyOneday ||
      rawUser?.reasonForJoining ||
      rawUser?.reason ||
      existingUser?.why_oneday ||
      existingUser?.whyOneday ||
      existingUser?.reasonForJoining ||
      "",
    reasonForJoining:
      findFirstString(["why_oneday", "whyOneday", "why_oneday_reason", "reasonForJoining", "reason_for_joining", "reason"]) ||
      rawUser?.why_oneday ||
      rawUser?.whyOneday ||
      rawUser?.reasonForJoining ||
      rawUser?.reason ||
      existingUser?.why_oneday ||
      existingUser?.whyOneday ||
      existingUser?.reasonForJoining ||
      "",
    onboarded: isCompleted,
    hasCompletedOnboarding: isCompleted,
    onboarding_completed: isCompleted,
    onboardingCompleted: isCompleted,
    needsOnboarding: isCompleted === undefined ? undefined : !isCompleted,
    needs_onboarding: isCompleted === undefined ? undefined : !isCompleted,
    nextRoute: isCompleted === true ? "/dashboard" : (isCompleted === false ? "/onboarding" : undefined),
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
      root.xpEarned ??
      root.xp_earned ??
      res.xpAwarded ??
      res.xp_awarded ??
      res.xpEarned ??
      res.xp_earned;
    if (typeof val === "number" && !isNaN(val)) {
      return val;
    }
  }
  return getXpForDifficulty(habitDifficulty);
}

/**
 * Accurately counts words in a string based on whitespace-separated tokens.
 * Handles empty strings, leading/trailing whitespace, and multiple spaces properly.
 */
export function countWords(text?: string | null): number {
  if (!text || typeof text !== "string") return 0;
  const trimmed = text.trim();
  if (trimmed === "") return 0;
  return trimmed.split(/\s+/).filter(Boolean).length;
}

