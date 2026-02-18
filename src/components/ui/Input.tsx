import styles from "./input.module.css";

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export default function Input({ className, ...props }: InputProps) {
  return <input className={[styles.input, className].filter(Boolean).join(" ")} {...props} />;
}
