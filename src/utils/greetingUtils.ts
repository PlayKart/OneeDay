// src/utils/greetingUtils.ts

import { User, Habit } from "../types";
import { isHabitScheduledForToday } from "../lib/habitUtils";
import { getEquippedTitle } from "./titleUtils";

export interface GreetingContext {
  user?: User | null;
  habits?: Habit[];
  completedTodayCount?: number;
  totalHabitsCount?: number;
  isFrozen?: boolean;
  recentlyLeveledUp?: boolean;
  recentlyUnlockedTitle?: boolean;
}

/**
 * Extracts a clean, capitalized first name from the user object.
 * Returns null if name is missing, invalid, or a placeholder.
 */
export function getCleanFirstName(name?: string | null): string | null {
  if (!name || typeof name !== "string") return null;
  const trimmed = name.trim();
  if (
    !trimmed ||
    trimmed.toLowerCase() === "user" ||
    trimmed.toLowerCase() === "undefined" ||
    trimmed.toLowerCase() === "null" ||
    trimmed.toLowerCase() === "striker" ||
    trimmed.toLowerCase() === "active champion"
  ) {
    return null;
  }
  // Split name and take the first token
  const first = trimmed.split(/[\s_-]+/)[0];
  if (!first) return null;
  return first.charAt(0).toUpperCase() + first.slice(1);
}

/**
 * Deterministic hash-based selection to avoid rapid flickering on re-renders,
 * while ensuring different days or different progress states select distinct messages.
 */
function pickFromPool(pool: string[], keySeed: string): string {
  if (!pool || pool.length === 0) return "Let's make today count.";
  if (pool.length === 1) return pool[0];

  let hash = 0;
  for (let i = 0; i < keySeed.length; i++) {
    hash = (hash << 5) - hash + keySeed.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % pool.length;
  return pool[index];
}

/**
 * Generates an intelligent, personal, and context-aware greeting reacting
 * to the user's actual real-time state and habit progression.
 */
export function getPersonalizedGreeting(context: GreetingContext): string {
  const { user, habits = [], isFrozen = false } = context;

  const firstName = getCleanFirstName(user?.name);
  const now = new Date();
  const hour = now.getHours();
  const dateStr = now.toISOString().split("T")[0];

  // Calculate habit progress
  const safeHabits = Array.isArray(habits) ? habits : [];
  const todaysHabits = safeHabits.filter(isHabitScheduledForToday);
  const completedToday = context.completedTodayCount !== undefined
    ? context.completedTodayCount
    : todaysHabits.filter((h) => h && h.completedToday).length;
  const totalHabits = context.totalHabitsCount !== undefined
    ? context.totalHabitsCount
    : todaysHabits.length;

  const currentStreak = user?.currentStreak ?? user?.streak ?? 0;
  const currentLevel = user?.level ?? 1;
  const equippedTitle = getEquippedTitle(user);

  // Time of Day category
  const isMorning = hour >= 4 && hour < 12;
  const isAfternoon = hour >= 12 && hour < 17;
  const isEvening = hour >= 17 && hour < 22;
  const isNight = hour >= 22 || hour < 4;

  const stateKey = `${dateStr}_${hour}_${completedToday}_${totalHabits}_${currentStreak}_${currentLevel}_${equippedTitle || "none"}`;

  // 1. ALL HABITS COMPLETED (Clean Sweep)
  if (totalHabits > 0 && completedToday >= totalHabits) {
    const pool = [
      firstName ? `Clean sweep, ${firstName}. That's discipline.` : "Clean sweep. That's discipline.",
      firstName ? `Done for today, ${firstName}. Unstoppable standard.` : "Done for today. That's discipline.",
      "All daily targets hit.",
      firstName ? `Every promise kept today, ${firstName}.` : "Every promise kept today.",
      "Consistency is compounding.",
    ];
    return pickFromPool(pool, stateKey);
  }

  // 2. STREAK FROZEN / PROTECTED
  if (isFrozen) {
    const pool = [
      firstName ? `Progress shielded, ${firstName}.` : "Progress deep-frozen and shielded.",
      "Streak protected. Ready when you are.",
      firstName ? `Holding the line, ${firstName}.` : "Holding the line.",
    ];
    return pickFromPool(pool, stateKey);
  }

  // 3. STRONG STREAK (>= 7 Days)
  if (currentStreak >= 7 && completedToday === 0) {
    const pool = [
      firstName ? `${currentStreak}-day streak, ${firstName}. Your consistency is showing.` : `${currentStreak}-day streak. Your consistency is showing.`,
      firstName ? `Unbroken streak, ${firstName}. Let's keep the standard.` : `Unbroken standard. Let's make today count.`,
      firstName ? `Day ${currentStreak + 1} begins, ${firstName}.` : `Day ${currentStreak + 1} begins.`,
    ];
    return pickFromPool(pool, stateKey);
  }

  // 4. EVENING WITH REMAINING HABITS (Streak at risk / finish strong)
  if ((isEvening || isNight) && totalHabits > 0 && completedToday < totalHabits) {
    const remaining = totalHabits - completedToday;
    const pool = [
      firstName ? `Still time to finish strong, ${firstName}.` : "Still time to finish strong.",
      "Don't break the chain today.",
      `${remaining} ${remaining === 1 ? "target" : "targets"} remaining. Close the day strong.`,
      firstName ? `Let's finish what we started, ${firstName}.` : "Let's finish what we started.",
    ];
    return pickFromPool(pool, stateKey);
  }

  // 5. SOME HABITS COMPLETED (Momentum is building)
  if (completedToday > 0 && completedToday < totalHabits) {
    const pool = [
      firstName ? `You're already moving, ${firstName}.` : "You're already moving.",
      firstName ? `Momentum is building, ${firstName}.` : "Momentum is building.",
      `${completedToday} of ${totalHabits} done. Keep going.`,
      firstName ? `Good start, ${firstName}. Keep executing.` : "Good start. Keep executing.",
    ];
    return pickFromPool(pool, stateKey);
  }

  // 6. OCCASIONAL EQUIPPED TITLE RECOGNITION (approx 1 in 3 chance if equipped)
  if (equippedTitle && totalHabits > 0 && completedToday === 0) {
    const formattedTitle = equippedTitle
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");

    const titlePool = [
      isMorning
        ? firstName
          ? `Morning, ${firstName}. ${formattedTitle} mode.`
          : `Morning, ${formattedTitle}.`
        : firstName
        ? `Ready to execute, ${firstName}?`
        : `Ready, ${formattedTitle}?`,
      firstName ? `Back at it, ${firstName}.` : "Back at it.",
      "Another day. Another chance to show up.",
    ];
    return pickFromPool(titlePool, stateKey);
  }

  // 7. NEW USER / NO HABITS CREATED YET
  if (totalHabits === 0) {
    const pool = [
      firstName ? `Day one starts here, ${firstName}.` : "Day one starts here.",
      firstName ? `Welcome to OneDay, ${firstName}.` : "Welcome to OneDay.",
      "Every high standard begins with a single routine.",
    ];
    return pickFromPool(pool, stateKey);
  }

  // 8. TIME OF DAY GREETINGS (START OF DAY / BEFORE COMPLETING HABITS)
  if (isMorning) {
    const pool = [
      firstName ? `Morning, ${firstName}. Let's make today count.` : "Another day. Another chance to show up.",
      firstName ? `Early start, ${firstName}. Time to execute.` : "Let's make today count.",
      "Another day. Another chance to show up.",
      firstName ? `Ready for today, ${firstName}?` : "Ready to show up today?",
    ];
    return pickFromPool(pool, stateKey);
  }

  if (isAfternoon) {
    const pool = [
      firstName ? `Afternoon, ${firstName}. Time to execute.` : "Stay focused on what matters.",
      firstName ? `Back at it, ${firstName}.` : "Back at it.",
      "Keep the standard high today.",
    ];
    return pickFromPool(pool, stateKey);
  }

  if (isEvening || isNight) {
    const pool = [
      firstName ? `Evening, ${firstName}.` : "Evening discipline.",
      firstName ? `Still time to execute, ${firstName}.` : "Still time to execute.",
      "Close today with intention.",
    ];
    return pickFromPool(pool, stateKey);
  }

  // Fallback
  return firstName ? `Welcome back, ${firstName}.` : "Let's make today count.";
}

/**
 * Legacy compatibility wrapper.
 */
export function getDynamicGreeting(backendGreeting?: string, context?: GreetingContext): string {
  if (backendGreeting && backendGreeting.trim().length > 0) {
    return backendGreeting;
  }
  if (context) {
    return getPersonalizedGreeting(context);
  }
  return "Let's make today count.";
}
