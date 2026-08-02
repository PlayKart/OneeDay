// src/hooks/useMindset.ts

import { useQuoteStore } from "../store/quoteStore";

export function useMindset() {
  const { quote, loading, lastFetchedAt, fetchQuote } = useQuoteStore();

  return {
    quote,
    loading,
    lastFetchedAt,
    fetchQuote,
  };
}
