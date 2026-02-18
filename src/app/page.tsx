"use client";

import { useMemo, useRef } from "react";
import { motion } from "framer-motion";
import styles from "./page.module.css";
import { usePortfolioStore } from "@/store/usePortfolioStore";
import { useShallow } from "zustand/shallow";
import { COINS } from "@/lib/coins";
import {
  avgBuyWeightedByCoin,
  holdingsByCoin,
  investedByCoin,
  currentValueByCoin,
  pnlByCoin,
  totalInvested,
  totalValue,
  totalPnL,
} from "@/lib/calculations";
import { formatEUR, formatPct } from "@/lib/format";
import StatTile from "@/components/StatTile";
import CoinCard from "@/components/CoinCard";
import AllocationDonut from "@/components/Charts/AllocationDonut";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/EmptyState";

export default function DashboardPage() {
  const {
    lots,
    cachedPrices,
    priceStatus,
    priceError,
    openAddModal,
    refreshPrices,
    importState,
  } = usePortfolioStore(
    useShallow((state) => ({
      lots: state.lots,
      cachedPrices: state.cachedPrices,
      priceStatus: state.priceStatus,
      priceError: state.priceError,
      openAddModal: state.openAddModal,
      refreshPrices: state.refreshPrices,
      importState: state.importState,
    }))
  );

  const fileInputRef = useRef<HTMLInputElement>(null);

  const holdings = useMemo(() => holdingsByCoin(lots), [lots]);
  const invested = useMemo(() => investedByCoin(lots), [lots]);
  const avgBuy = useMemo(() => avgBuyWeightedByCoin(lots), [lots]);
  const livePrices = useMemo(
    () =>
      Object.fromEntries(
        COINS.map((coin) => [coin.symbol, cachedPrices[coin.symbol]?.eur ?? 0])
      ),
    [cachedPrices]
  );
  const currentValues = useMemo(
    () => currentValueByCoin(holdings, livePrices),
    [holdings, livePrices]
  );
  const pnl = useMemo(() => pnlByCoin(invested, currentValues), [invested, currentValues]);

  const totalInv = totalInvested(lots);
  const totalVal = totalValue(holdings, livePrices);
  const total = totalPnL(totalInv, totalVal);

  const lastUpdated = useMemo(() => {
    const times = Object.values(cachedPrices)
      .map((price) => new Date(price?.updatedAtISO ?? 0).getTime())
      .filter(Boolean);
    if (!times.length) return "Never";
    return new Date(Math.max(...times)).toLocaleTimeString();
  }, [cachedPrices]);

  const allocationData = COINS.map((coin) => ({
    name: coin.symbol,
    value: currentValues[coin.symbol],
    color: coin.accent,
  }));

  const handleExport = () => {
    const payload = JSON.stringify(
      {
        schemaVersion: 2,
        lots,
        preferences: usePortfolioStore.getState().preferences,
        cachedPrices,
      },
      null,
      2
    );
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `dlta-export-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);
        importState(data);
      } catch (error) {
        console.warn("Invalid import", error);
      }
    };
    reader.readAsText(file);
  };

  return (
    <motion.div
      className={styles.page}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <section className={styles.summary}>
        <div>
          <h1>Portfolio Dashboard</h1>
          <p className="muted">All holdings, live pricing, and delta-level clarity.</p>
        </div>
        <div className={styles.actions}>
          <Button variant="outline" size="sm" onClick={() => refreshPrices(true)}>
            {priceStatus === "loading" ? "Refreshing..." : "Refresh prices"}
          </Button>
          <Button variant="ghost" size="sm" onClick={openAddModal}>
            Add purchase
          </Button>
          <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()}>
            Import
          </Button>
          <Button variant="ghost" size="sm" onClick={handleExport}>
            Export
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            style={{ display: "none" }}
            onChange={handleImport}
          />
        </div>
      </section>

      {priceError ? <div className={styles.warning}>{priceError} Showing cached prices.</div> : null}
      <div className={styles.lastUpdated}>Last updated: {lastUpdated}</div>

      {lots.length === 0 ? (
        <EmptyState
          title="Start your first lot"
          description="Add BTC, ETH, or XRP purchases and watch DLTA compute live performance."
          actionLabel="Add purchase"
          onAction={openAddModal}
        />
      ) : (
        <>
          <section className={styles.stats}>
            <StatTile label="Total invested" value={formatEUR(totalInv)} />
            <StatTile label="Current value" value={formatEUR(totalVal)} />
            <StatTile
              label="Total P/L"
              value={formatEUR(total.eur)}
              subvalue={formatPct(total.pct)}
              trend={total.eur >= 0 ? "positive" : "negative"}
            />
          </section>

          <section className={styles.coinGrid}>
            {COINS.map((coin) => (
              <CoinCard
                key={coin.symbol}
                symbol={coin.symbol}
                name={coin.name}
                accent={coin.accent}
                holdings={holdings[coin.symbol]}
                invested={invested[coin.symbol]}
                avgBuy={avgBuy[coin.symbol]}
                currentValue={currentValues[coin.symbol]}
                pnlEur={pnl[coin.symbol].eur}
                pnlPct={pnl[coin.symbol].pct}
                livePrice={cachedPrices[coin.symbol]?.eur}
                change24h={cachedPrices[coin.symbol]?.change24h}
              />
            ))}
          </section>

          <section className={styles.charts}>
            <AllocationDonut data={allocationData} />
          </section>
        </>
      )}
    </motion.div>
  );
}
