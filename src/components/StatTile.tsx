import styles from "./StatTile.module.css";

interface StatTileProps {
  label: string;
  value: string;
  subvalue?: string;
  trend?: "positive" | "negative" | "neutral";
}

export default function StatTile({ label, value, subvalue, trend = "neutral" }: StatTileProps) {
  return (
    <div className={styles.tile}>
      <span className={styles.label}>{label}</span>
      <span className={`${styles.value} mono`}>{value}</span>
      {subvalue ? (
        <span
          className={`${styles.subvalue} ${
            trend === "positive" ? "positive" : trend === "negative" ? "negative" : ""
          }`}
        >
          {subvalue}
        </span>
      ) : null}
    </div>
  );
}
