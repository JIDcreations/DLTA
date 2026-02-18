import styles from "./field.module.css";

interface FieldProps {
  label: React.ReactNode;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}

export default function Field({ label, hint, error, children }: FieldProps) {
  return (
    <label className={styles.field}>
      <span className={styles.label}>{label}</span>
      {children}
      {error ? (
        <span className={styles.error}>{error}</span>
      ) : hint ? (
        <span className={styles.hint}>{hint}</span>
      ) : null}
    </label>
  );
}
