"use client";

import clsx from "./button.module.css";
import { forwardRef } from "react";

export type ButtonVariant = "primary" | "ghost" | "outline" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className, ...props }, ref) => {
    const classes = [
      clsx.button,
      clsx[variant],
      clsx[size],
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return <button ref={ref} className={classes} {...props} />;
  }
);

Button.displayName = "Button";

export default Button;
