import styles from "./EmptyState.module.css";
import Button from "./ui/Button";

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className={styles.empty}>
      <div className={styles.glow} />
      <div>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      {actionLabel && onAction ? (
        <Button onClick={onAction}>{actionLabel}</Button>
      ) : null}
    </div>
  );
}
