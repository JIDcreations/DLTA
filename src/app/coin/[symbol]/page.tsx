"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import styles from "./page.module.css";
import { COIN_BY_SYMBOL, isCoinSymbol } from "@/lib/coins";
import { fetchMarketChart } from "@/lib/prices";
import { avgBuyWeightedByCoin, holdingsByCoin, perLotPnL } from "@/lib/calculations";
import { formatEUR } from "@/lib/format";
import { usePortfolioStore } from "@/store/usePortfolioStore";
import { useShallow } from "zustand/shallow";
import PriceHeader from "@/components/PriceHeader";
import PriceLineChart from "@/components/Charts/PriceLineChart";
import LotTable from "@/components/LotTable";
import EmptyState from "@/components/EmptyState";
import Button from "@/components/ui/Button";
import type { CoinSymbol } from "@/lib/types";

export default function CoinDetailPage() {
  const params = useParams();
  const symbolParam = Array.isArray(params?.symbol) ? params.symbol[0] : params?.symbol;
  const symbol = symbolParam?.toUpperCase() ?? "";

  const { lots, cachedPrices, preferences, openAddModal, openEditModal, deleteLot } =
    usePortfolioStore(
      useShallow((state) => ({
        lots: state.lots,
        cachedPrices: state.cachedPrices,
        preferences: state.preferences,
        openAddModal: state.openAddModal,
        openEditModal: state.openEditModal,
        deleteLot: state.deleteLot,
      }))
    );

  const [rangeDays, setRangeDays] = useState<7 | 30>(7);
  const [history, setHistory] = useState<{ timestamp: number; price: number }[]>([]);
  const [historyStatus, setHistoryStatus] = useState<"idle" | "loading" | "error">("idle");

  const isValidSymbol = isCoinSymbol(symbol);
  const typedSymbol = isValidSymbol ? (symbol as CoinSymbol) : null;

  useEffect(() => {
    if (!typedSymbol) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHistoryStatus("loading");
    fetchMarketChart(typedSymbol, rangeDays)
      .then((data) => {
        setHistory(data);
        setHistoryStatus("idle");
      })
      .catch(() => {
        setHistory([]);
        setHistoryStatus("error");
      });
  }, [typedSymbol, rangeDays]);

  const coin = typedSymbol ? COIN_BY_SYMBOL[typedSymbol] : null;
  const coinLots = lots.filter((lot) => lot.symbol === typedSymbol);
  const holdings = holdingsByCoin(coinLots);
  const avgBuy = avgBuyWeightedByCoin(coinLots);
  const livePrice = typedSymbol ? cachedPrices[typedSymbol]?.eur : undefined;

  const bestWorst = (() => {
    if (!coinLots.length || !livePrice) return { best: null, worst: null };
    const sorted = [...coinLots].sort(
      (a, b) => perLotPnL(b, livePrice).eur - perLotPnL(a, livePrice).eur
    );
    return {
      best: sorted[0],
      worst: sorted[sorted.length - 1],
    };
  })();

  const handleDelete = (id: string) => {
    const confirmed = window.confirm("Delete this lot?");
    if (confirmed) {
      deleteLot(id);
    }
  };

  if (!typedSymbol || !coin) {
    return (
      <div className={styles.invalid}>
        <h2>Coin not found</h2>
        <p className="muted">We only support BTC, ETH, and XRP for now.</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <section className={styles.header}>
        <PriceHeader
          name={coin.name}
          symbol={coin.symbol}
          livePrice={livePrice}
          change24h={cachedPrices[typedSymbol]?.change24h}
          holdings={holdings[typedSymbol]}
        />
      </section>

      {coinLots.length === 0 ? (
        <EmptyState
          title={`No ${coin.symbol} lots yet`}
          description="Add your first purchase to unlock charts and insights."
          actionLabel="Add purchase"
          onAction={openAddModal}
        />
      ) : (
        <>
          <section className={styles.chartSection}>
            {historyStatus === "error" ? (
              <div className={styles.warning}>Historical data unavailable right now.</div>
            ) : null}
            <PriceLineChart
              history={history}
              lots={coinLots}
              livePrice={livePrice}
              rangeDays={rangeDays}
              onRangeChange={setRangeDays}
            />
          </section>

          {preferences.showAdvanced ? (
            <section className={styles.insights}>
              <div className={styles.insightCard}>
                <span className={styles.insightLabel}>Weighted avg buy</span>
                <strong className="mono">{formatEUR(avgBuy[typedSymbol])}</strong>
              </div>
              <div className={styles.insightCard}>
                <span className={styles.insightLabel}>Break-even price</span>
                <strong className="mono">{formatEUR(avgBuy[typedSymbol])}</strong>
              </div>
              <div className={styles.insightCard}>
                <span className={styles.insightLabel}>Best lot</span>
                <strong className="mono">
                  {bestWorst.best && livePrice
                    ? formatEUR(perLotPnL(bestWorst.best, livePrice).eur)
                    : "—"}
                </strong>
              </div>
              <div className={styles.insightCard}>
                <span className={styles.insightLabel}>Worst lot</span>
                <strong className="mono">
                  {bestWorst.worst && livePrice
                    ? formatEUR(perLotPnL(bestWorst.worst, livePrice).eur)
                    : "—"}
                </strong>
              </div>
            </section>
          ) : null}

          <section className={styles.tableSection}>
            <LotTable
              lots={coinLots}
              livePrice={livePrice}
              showNotes={preferences.showNotes}
              onEdit={openEditModal}
              onDelete={handleDelete}
            />
          </section>
        </>
      )}

      <div className={styles.footerActions}>
        <Button onClick={openAddModal}>Add purchase</Button>
        <Button variant="outline" onClick={() => setRangeDays(rangeDays === 7 ? 30 : 7)}>
          Toggle {rangeDays === 7 ? "30d" : "7d"}
        </Button>
      </div>
    </div>
  );
}
