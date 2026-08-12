// src/services/quoteService.ts

import { apiClient } from "../api/client";
import { QUOTE_CACHE_TTL_MS, DEFAULT_QUOTE } from "../constants";
import { Habit } from "../types";

let cachedQuote: string | null = null;
let lastFetchedTime: number = 0;

export const quoteService = {
  async getQuote(streak: number = 0, habits: Habit[] = []): Promise<string> {
    const now = Date.now();
    // Use cache if within 10 minutes TTL
    if (cachedQuote && now - lastFetchedTime < QUOTE_CACHE_TTL_MS) {
      return cachedQuote;
    }

    try {
      const res = await apiClient.get<{ quote?: string; text?: string; message?: string }>("/api/mindset");

      const quoteText =
        res.data?.quote ||
        res.data?.text ||
        res.data?.message ||
        (typeof res.data === "string" ? res.data : DEFAULT_QUOTE);

      cachedQuote = quoteText;
      lastFetchedTime = now;
      return quoteText;
    } catch (e) {
      console.warn("Quote fetch failed, using cached or default quote:", e);
      return cachedQuote || DEFAULT_QUOTE;
    }
  },

  clearCache() {
    cachedQuote = null;
    lastFetchedTime = 0;
  }
};
