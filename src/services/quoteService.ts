// src/services/quoteService.ts

import { apiClient } from "../api/client";
import { QUOTE_CACHE_TTL_MS, DEFAULT_QUOTE } from "../constants";
import { Habit } from "../types";
import { perfLogger } from "../utils/perfLogger";

let cachedQuote: string | null = null;
let lastFetchedTime: number = 0;
let isFetching = false;

export const quoteService = {
  async getQuote(streak: number = 0, habits: Habit[] = []): Promise<string> {
    const quoteStart = performance.now();
    const now = Date.now();

    // Check localStorage fallback as well
    if (!cachedQuote && typeof localStorage !== "undefined") {
      cachedQuote = localStorage.getItem("oneday_mindset_current") || null;
    }

    // Use cache if within 10 minutes TTL
    if (cachedQuote && (now - lastFetchedTime < QUOTE_CACHE_TTL_MS)) {
      console.log(`[PERF] quote: ${Math.round(performance.now() - quoteStart)}ms (cached)`);
      perfLogger.mark("quoteReady", Math.round(performance.now() - quoteStart));
      return cachedQuote;
    }

    // Trigger non-blocking async background fetch if already have cached quote
    if (cachedQuote) {
      if (!isFetching) {
        this.fetchFreshQuoteInBackground();
      }
      perfLogger.mark("quoteReady", Math.round(performance.now() - quoteStart));
      return cachedQuote;
    }

    try {
      isFetching = true;
      const res = await apiClient.get<{ quote?: string; text?: string; message?: string }>("/api/mindset");

      const quoteText =
        res.data?.quote ||
        res.data?.text ||
        res.data?.message ||
        (typeof res.data === "string" ? res.data : DEFAULT_QUOTE);

      cachedQuote = quoteText;
      lastFetchedTime = now;
      if (typeof localStorage !== "undefined") {
        localStorage.setItem("oneday_mindset_current", quoteText);
      }
      console.log(`[PERF] quote: ${Math.round(performance.now() - quoteStart)}ms`);
      perfLogger.mark("quoteReady", Math.round(performance.now() - quoteStart));
      return quoteText;
    } catch (e) {
      console.warn("Quote fetch failed, using cached or default quote:", e);
      perfLogger.mark("quoteReady", Math.round(performance.now() - quoteStart));
      return cachedQuote || DEFAULT_QUOTE;
    } finally {
      isFetching = false;
    }
  },

  fetchFreshQuoteInBackground() {
    isFetching = true;
    apiClient.get<{ quote?: string; text?: string; message?: string }>("/api/mindset")
      .then(res => {
        const quoteText =
          res.data?.quote ||
          res.data?.text ||
          res.data?.message ||
          (typeof res.data === "string" ? res.data : DEFAULT_QUOTE);
        cachedQuote = quoteText;
        lastFetchedTime = Date.now();
        if (typeof localStorage !== "undefined") {
          localStorage.setItem("oneday_mindset_current", quoteText);
        }
      })
      .catch(() => {})
      .finally(() => {
        isFetching = false;
      });
  },

  clearCache() {
    cachedQuote = null;
    lastFetchedTime = 0;
  }
};

