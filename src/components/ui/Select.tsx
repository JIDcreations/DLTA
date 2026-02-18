import styles from "./select.module.css";

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

export default function Select({ className, ...props }: SelectProps) {
  return <select className={[styles.select, className].filter(Boolean).join(" ")} {...props} />;
}
