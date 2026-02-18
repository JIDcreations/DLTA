import styles from "./PriceHeader.module.css";
import { formatEUR, formatPct, formatQty } from "@/lib/format";

interface PriceHeaderProps {
  name: string;
  symbol: string;
  livePrice?: number;
  change24h?: number;
  holdings: number;
}

export default function PriceHeader({
  name,
  symbol,
  livePrice,
  change24h,
  holdings,
}: PriceHeaderProps) {
  return (
    <div className={styles.header}>
      <div>
        <div className={styles.symbol}>{symbol}</div>
        <div className={styles.name}>{name}</div>
      </div>
      <div className={styles.priceBlock}>
        <span className="mono">
          {livePrice ? formatEUR(livePrice) : "—"}
        </span>
        {typeof change24h === "number" ? (
          <span className={`${styles.change} ${change24h >= 0 ? "positive" : "negative"}`}>
            {formatPct(change24h / 100)}
          </span>
        ) : null}
      </div>
      <div className={styles.holdings}>
        <span className={styles.label}>Holdings</span>
        <span className="mono">{formatQty(holdings)}</span>
      </div>
    </div>
  );
}
