import Link from "next/link";
import styles from "./CoinCard.module.css";
import { formatEUR, formatPct, formatQty } from "@/lib/format";

interface CoinCardProps {
  symbol: string;
  name: string;
  accent: string;
  holdings: number;
  invested: number;
  avgBuy: number;
  currentValue: number;
  pnlEur: number;
  pnlPct: number;
  livePrice?: number;
  change24h?: number;
}

export default function CoinCard({
  symbol,
  name,
  accent,
  holdings,
  invested,
  avgBuy,
  currentValue,
  pnlEur,
  pnlPct,
  livePrice,
  change24h,
}: CoinCardProps) {
  const pnlClass = pnlEur >= 0 ? "positive" : "negative";

  return (
    <Link href={`/coin/${symbol}`} className={styles.card}>
      <div className={styles.header}>
        <div className={styles.identity}>
          <span className={styles.symbol} style={{ color: accent }}>
            {symbol}
          </span>
          <span className={styles.name}>{name}</span>
        </div>
        <div className={styles.price}>
          {livePrice ? (
            <span className="mono">€{livePrice.toFixed(2)}</span>
          ) : (
            <span className="skeleton" style={{ width: 70, height: 14 }} />
          )}
          {typeof change24h === "number" ? (
            <span className={`${styles.change} ${change24h >= 0 ? "positive" : "negative"}`}>
              {formatPct(change24h / 100)}
            </span>
          ) : null}
        </div>
      </div>
      <div className={styles.metrics}>
        <div>
          <span className={styles.metricLabel}>Holdings</span>
          <span className="mono">{formatQty(holdings)}</span>
        </div>
        <div>
          <span className={styles.metricLabel}>Avg buy</span>
          <span className="mono">{avgBuy ? formatEUR(avgBuy) : "—"}</span>
        </div>
        <div>
          <span className={styles.metricLabel}>Invested</span>
          <span className="mono">{formatEUR(invested)}</span>
        </div>
        <div>
          <span className={styles.metricLabel}>Current value</span>
          <span className="mono">{formatEUR(currentValue)}</span>
        </div>
      </div>
      <div className={styles.pnl}>
        <span className={styles.metricLabel}>P/L</span>
        <span className={`mono ${pnlClass}`}>{formatEUR(pnlEur)}</span>
        <span className={`${styles.pnlPct} ${pnlClass}`}>{formatPct(pnlPct)}</span>
      </div>
    </Link>
  );
}
