// src/utils/streakUtils.ts

/**
 * Returns the current local calendar date formatted as YYYY-MM-DD.
 * Uses local date components (getFullYear, getMonth, getDate) to avoid UTC day shifts.
 */
export function getLocalCalendarDate(dateInput?: Date | string | number | null): string {
  if (dateInput === null || dateInput === undefined || dateInput === "") {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  if (typeof dateInput === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateInput.trim())) {
    return dateInput.trim();
  }

  const d = typeof dateInput === "string" || typeof dateInput === "number" ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return "";

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Returns the previous local calendar date formatted as YYYY-MM-DD.
 */
export function getPreviousCalendarDate(dateStr: string): string {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return "";
  }
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() - 1);
  return getLocalCalendarDate(date);
}

/**
 * Extracts unique local calendar dates from habits or completion objects.
 * Deduplicates and sorts newest to oldest.
 */
export function extractUniqueCompletionDates(
  habitsOrCompletions: Array<any>
): string[] {
  const datesSet = new Set<string>();

  if (!Array.isArray(habitsOrCompletions)) return [];

  for (const item of habitsOrCompletions) {
    if (!item) continue;
    if (typeof item === "string") {
      const normalized = getLocalCalendarDate(item);
      if (normalized) datesSet.add(normalized);
    } else if (Array.isArray(item.completedDates)) {
      for (const d of item.completedDates) {
        const normalized = getLocalCalendarDate(d);
        if (normalized) datesSet.add(normalized);
      }
    } else if (item.completedToday) {
      const today = getLocalCalendarDate();
      datesSet.add(today);
    }
    if (item.date) {
      const normalized = getLocalCalendarDate(item.date);
      if (normalized) datesSet.add(normalized);
    }
    if (item.timestamp) {
      const normalized = getLocalCalendarDate(item.timestamp);
      if (normalized) datesSet.add(normalized);
    }
  }

  return Array.from(datesSet).sort().reverse();
}

/**
 * Authoritative streak calculation function.
 * 
 * Rules:
 * 1. Get unique local completion dates.
 * 2. Start from today if today has at least one completion.
 * 3. Count consecutive preceding calendar days. Stop on first missing day.
 * 4. If today is NOT completed, but yesterday WAS completed:
 *    Count consecutive days starting from yesterday (intact active streak).
 * 5. If neither today nor yesterday was completed:
 *    Streak is 0.
 */
export function calculateStreak(
  habitsOrCompletions: Array<any>,
  todayStr: string = getLocalCalendarDate()
): number {
  const uniqueDates = extractUniqueCompletionDates(habitsOrCompletions);
  const dateSet = new Set(uniqueDates);

  const todayCompleted = dateSet.has(todayStr);
  const yesterdayStr = getPreviousCalendarDate(todayStr);
  const yesterdayCompleted = yesterdayStr ? dateSet.has(yesterdayStr) : false;

  let streak = 0;

  if (todayCompleted) {
    streak = 1;
    let checkDate = getPreviousCalendarDate(todayStr);
    while (checkDate && dateSet.has(checkDate)) {
      streak += 1;
      checkDate = getPreviousCalendarDate(checkDate);
    }
  } else if (yesterdayCompleted) {
    streak = 1;
    let checkDate = getPreviousCalendarDate(yesterdayStr);
    while (checkDate && dateSet.has(checkDate)) {
      streak += 1;
      checkDate = getPreviousCalendarDate(checkDate);
    }
  } else {
    streak = 0;
  }

  return streak;
}

/**
 * Debug logger for streak diagnostics matching requested format
 */
export function logStreakDebug(
  context: string,
  habitsOrCompletions: Array<any>,
  previousStreak: number,
  newStreak: number
) {
  const today = getLocalCalendarDate();
  const uniqueDates = extractUniqueCompletionDates(habitsOrCompletions);
  const todayCompleted = uniqueDates.includes(today);

  console.log(
    `[STREAK DEBUG] (${context})\ntoday: ${today}\nuniqueCompletionDates: ${JSON.stringify(
      uniqueDates
    )}\ntodayCompleted: ${todayCompleted}\npreviousStreak: ${previousStreak}\nnewStreak: ${newStreak}`
  );
}
