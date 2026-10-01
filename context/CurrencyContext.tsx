"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

interface CurrencyContextType {
  currency: string;
  isLoading: boolean;
  error: Error | null;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(
  undefined,
);

/**
 * Fetches the user's display-currency preference from `/api/account/preferences`
 * and makes it available via `useCurrencyPreference()`.
 *
 * The preferences API (and `preferencesSchema`) expose the field as
 * `displayCurrency`, not `currency`. Always read `data.displayCurrency`
 * here — using `data.currency` silently falls back to "USD" forever.
 *
 * Falls back to "USD" when the preference is absent or the request fails.
 */
export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrency] = useState<string>("USD");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isCancelled = false;
    const controller = new AbortController();

    const fetchCurrency = async () => {
      try {
        const response = await fetch("/api/account/preferences", {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error("Failed to fetch preferences");
        }
        const data = await response.json();
        if (isCancelled) return;
        if (data && data.displayCurrency) {
          setCurrency(data.displayCurrency);
        }
      } catch (err) {
        if (isCancelled) return;
        setError(err instanceof Error ? err : new Error(String(err)));
        // Fallback to USD is handled by the initial state
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchCurrency();

    return () => {
      isCancelled = true;
      controller.abort();
    };
  }, []);

  return (
    <CurrencyContext.Provider value={{ currency, isLoading, error }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrencyPreference() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error(
      "useCurrencyPreference must be used within a CurrencyProvider",
    );
  }
  return context;
}
