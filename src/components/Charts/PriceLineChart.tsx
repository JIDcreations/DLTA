"use client";

import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Scatter,
} from "recharts";
import styles from "./PriceLineChart.module.css";
import type { PurchaseLot } from "@/lib/types";
import type { PricePoint } from "@/lib/prices";
import { formatEUR, formatPct } from "@/lib/format";
import { perLotPnL } from "@/lib/calculations";

interface PriceLineChartProps {
  history: PricePoint[];
  lots: PurchaseLot[];
  livePrice?: number;
  rangeDays: 7 | 30;
  onRangeChange: (range: 7 | 30) => void;
}

export default function PriceLineChart({
  history,
  lots,
  livePrice,
  rangeDays,
  onRangeChange,
}: PriceLineChartProps) {
  const chartData = history.map((point) => ({
    timestamp: point.timestamp,
    price: point.price,
  }));

  const lotPoints = lots.map((lot) => {
    const pnl = perLotPnL(lot, livePrice);
    return {
      timestamp: new Date(lot.datetimeISO).getTime(),
      lotPrice: lot.buyPrice,
      note: lot.note,
      eurSpent: lot.eurSpent,
      pnlEur: pnl.eur,
      pnlPct: pnl.pct,
    };
  });

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div>
          <h3>Price History</h3>
          <span className="muted">Spot price with buy markers.</span>
        </div>
        <div className={styles.controls}>
          <button
            className={rangeDays === 7 ? styles.active : ""}
            onClick={() => onRangeChange(7)}
          >
            7d
          </button>
          <button
            className={rangeDays === 30 ? styles.active : ""}
            onClick={() => onRangeChange(30)}
          >
            30d
          </button>
        </div>
      </div>
      <div className={styles.chartWrap}>
        {history.length === 0 ? (
          <div className={styles.placeholder}>Chart data unavailable.</div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={chartData}>
              <XAxis
                dataKey="timestamp"
                type="number"
                domain={["auto", "auto"]}
                tickFormatter={(value) => new Date(value).toLocaleDateString()}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "rgba(230,237,245,0.5)", fontSize: 12 }}
              />
              <YAxis
                dataKey="price"
                tickFormatter={(value) => `€${value.toFixed(0)}`}
                axisLine={false}
                tickLine={false}
                width={40}
                tick={{ fill: "rgba(230,237,245,0.5)", fontSize: 12 }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const pricePayload = payload.find((item) => item.dataKey === "price");
                  const lotPayload = payload.find((item) => item.dataKey === "lotPrice");
                  return (
                    <div className={styles.tooltip}>
                      {pricePayload ? (
                        <div>
                          <div className={styles.tooltipLabel}>Spot price</div>
                          <strong>{formatEUR(pricePayload.value as number)}</strong>
                        </div>
                      ) : null}
                      {lotPayload ? (
                        <div className={styles.tooltipLot}>
                          <div className={styles.tooltipLabel}>Purchase</div>
                          <div>{lotPayload.payload.note || "No note"}</div>
                          <div className={lotPayload.payload.pnlEur >= 0 ? "positive" : "negative"}>
                            {formatEUR(lotPayload.payload.pnlEur)} ({formatPct(lotPayload.payload.pnlPct)})
                          </div>
                        </div>
                      ) : null}
                    </div>
                  );
                }}
              />
              <Line
                type="monotone"
                dataKey="price"
                stroke="rgba(180, 240, 0, 0.9)"
                strokeWidth={2}
                dot={false}
              />
              <Scatter data={lotPoints} dataKey="lotPrice" fill="#ffffff" />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
