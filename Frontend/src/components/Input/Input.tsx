import type { InputHTMLAttributes } from "react";
import styles from "./Input.module.css";

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "id"> {
  id: string;
  label: string;
  error?: string;
}

export function Input({
  label,
  error,
  id,
  className,
  "aria-describedby": ariaDescribedBy,
  ...props
}: InputProps) {
  const describedBy =
    [ariaDescribedBy, error ? `${id}-error` : undefined]
      .filter(Boolean)
      .join(" ") || undefined;

  return (
    <div className={styles.container}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>

      <input
        id={id}
        className={`${styles.input} ${
          error ? styles.inputError : ""
        } ${className ?? ""}`}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        {...props}
      />

      {error && (
        <span id={`${id}-error`} className={styles.error}>
          {error}
        </span>
      )}
    </div>
  );
}
