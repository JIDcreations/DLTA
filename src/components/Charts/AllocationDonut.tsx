"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import styles from "./AllocationDonut.module.css";
import { formatEUR } from "@/lib/format";

interface AllocationDonutProps {
  data: { name: string; value: number; color: string }[];
}

export default function AllocationDonut({ data }: AllocationDonutProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h3>Allocation</h3>
        <span className="muted">Current value by coin</span>
      </div>
      <div className={styles.chartWrap}>
        {total === 0 ? (
          <div className={styles.placeholder}>No allocation data yet.</div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={4}
                stroke="none"
              >
                {data.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                content={({ payload }) => {
                  if (!payload?.length) return null;
                  const item = payload[0].payload;
                  return (
                    <div className={styles.tooltip}>
                      <div>{item.name}</div>
                      <strong>{formatEUR(item.value)}</strong>
                    </div>
                  );
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
      <div className={styles.legend}>
        {data.map((item) => (
          <div key={item.name} className={styles.legendItem}>
            <span className={styles.dot} style={{ background: item.color }} />
            <span>{item.name}</span>
            <span className="mono">{formatEUR(item.value, true)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
