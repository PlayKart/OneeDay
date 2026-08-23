// src/constants/index.ts

const getBackendUrl = (): string => {
  const envUrl =
    (typeof import.meta !== "undefined" && ((import.meta.env?.VITE_BACKEND_URL as string) || (import.meta.env?.RENDER_BACKEND_URL as string))) ||
    (typeof process !== "undefined" && ((process.env as any)?.VITE_BACKEND_URL || (process.env as any)?.RENDER_BACKEND_URL)) ||
    "https://oneday-backend-xocv.onrender.com";

  return (envUrl || "https://oneday-backend-xocv.onrender.com").trim().replace(/\/+$/, "");
};

export const BACKEND_URL = getBackendUrl();

export const QUOTE_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

export const DEFAULT_QUOTE = "One day broke. Don't let two.";

export const DEFAULT_HABIT_COLORS = [
  "emerald",
  "cyan",
  "blue",
  "purple",
  "rose",
  "amber",
  "orange",
  "indigo",
];

export const APP_NAME = "OneDay";
console.log('[CONFIG] Production Backend URL initialized:', BACKEND_URL);

