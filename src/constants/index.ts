// src/constants/index.ts

export const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || "https://oneday-backend-xocv.onrender.com";

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
