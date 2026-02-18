"use client";

import { useMemo, useState } from "react";
import styles from "./LotTable.module.css";
import type { PurchaseLot } from "@/lib/types";
import { formatEUR, formatPct, formatQty } from "@/lib/format";
import { perLotPnL } from "@/lib/calculations";
import Button from "./ui/Button";

interface LotTableProps {
  lots: PurchaseLot[];
  livePrice?: number;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  showNotes: boolean;
}

type SortKey = "date" | "invested" | "pnl";

export default function LotTable({
  lots,
  livePrice,
  onEdit,
  onDelete,
  showNotes,
}: LotTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [direction, setDirection] = useState<"asc" | "desc">("desc");

  const sorted = useMemo(() => {
    const sortedLots = [...lots];
    sortedLots.sort((a, b) => {
      if (sortKey === "date") {
        return new Date(a.datetimeISO).getTime() - new Date(b.datetimeISO).getTime();
      }
      if (sortKey === "invested") {
        return a.eurSpent - b.eurSpent;
      }
      if (sortKey === "pnl") {
        const pnlA = perLotPnL(a, livePrice).eur;
        const pnlB = perLotPnL(b, livePrice).eur;
        return pnlA - pnlB;
      }
      return 0;
    });
    return direction === "asc" ? sortedLots : sortedLots.reverse();
  }, [lots, sortKey, direction, livePrice]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setDirection(direction === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setDirection("desc");
    }
  };

  return (
    <div className={styles.tableWrap}>
      <div className={styles.tableHeader}>
        <div>
          <h3>Lots</h3>
          <p className="muted">All purchase lots with live P/L.</p>
        </div>
        <div className={styles.sorts}>
          <Button variant="ghost" size="sm" onClick={() => toggleSort("date")}>
            Date
          </Button>
          <Button variant="ghost" size="sm" onClick={() => toggleSort("invested")}>
            Invested
          </Button>
          <Button variant="ghost" size="sm" onClick={() => toggleSort("pnl")}>
            P/L
          </Button>
        </div>
      </div>
      <div className={styles.table}>
        <div className={styles.rowHeader}>
          <span>Date</span>
          <span>Buy price</span>
          <span>Quantity</span>
          <span>Invested</span>
          <span>Lot P/L</span>
          <span>Actions</span>
        </div>
        {sorted.map((lot) => {
          const pnl = perLotPnL(lot, livePrice);
          const pnlClass = pnl.eur >= 0 ? "positive" : "negative";
          return (
            <div key={lot.id} className={styles.row}>
              <div>
                <div>{new Date(lot.datetimeISO).toLocaleString()}</div>
                {showNotes && lot.note ? (
                  <div className={styles.note}>{lot.note}</div>
                ) : null}
              </div>
              <span className="mono">{formatEUR(lot.buyPrice)}</span>
              <span className="mono">{formatQty(lot.quantity)}</span>
              <span className="mono">{formatEUR(lot.eurSpent)}</span>
              <span className={`${styles.pnl} mono ${pnlClass}`}>
                {livePrice ? `${formatEUR(pnl.eur)} (${formatPct(pnl.pct)})` : "—"}
              </span>
              <div className={styles.actions}>
                <Button variant="ghost" size="sm" onClick={() => onEdit(lot.id)}>
                  Edit
                </Button>
                <Button variant="danger" size="sm" onClick={() => onDelete(lot.id)}>
                  Delete
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
