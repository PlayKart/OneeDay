// src/utils/index.ts

export * from "./camelCase";

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
