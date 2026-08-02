// src/store/quoteStore.ts

import { create } from "zustand";
import { quoteService } from "../services/quoteService";
import { Habit } from "../types";

interface QuoteState {
  quote: string;
  loading: boolean;
  lastFetchedAt: number;
  fetchQuote: (streak?: number, habits?: Habit[]) => Promise<string>;
}

export const useQuoteStore = create<QuoteState>((set, get) => ({
  quote: "One day broke. Don't let two.",
  loading: false,
  lastFetchedAt: 0,
  fetchQuote: async (streak = 0, habits = []) => {
    set({ loading: true });
    try {
      const q = await quoteService.getQuote(streak, habits);
      set({ quote: q, loading: false, lastFetchedAt: Date.now() });
      return q;
    } catch (e) {
      set({ loading: false });
      return get().quote;
    }
  },
}));
