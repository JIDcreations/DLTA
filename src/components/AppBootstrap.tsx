"use client";

import { useEffect } from "react";
import { usePortfolioStore } from "@/store/usePortfolioStore";

export default function AppBootstrap() {
  const initialize = usePortfolioStore((state) => state.initialize);
  const refreshPrices = usePortfolioStore((state) => state.refreshPrices);
  const refreshIntervalSeconds = usePortfolioStore(
    (state) => state.preferences.refreshIntervalSeconds
  );

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    refreshPrices(false);
    const interval = window.setInterval(() => {
      refreshPrices(false);
    }, refreshIntervalSeconds * 1000);
    return () => window.clearInterval(interval);
  }, [refreshIntervalSeconds, refreshPrices]);

  return null;
}
