import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

import { cn } from "@/lib/utils";

type ButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "secondary" | "ghost";
  }
>;

export function Button({
  children,
  className,
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-2xl border px-4 py-3 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-accent/50 disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" &&
          "border-accent bg-accent text-primary shadow-glow hover:opacity-95",
        variant === "secondary" &&
          "border-border bg-card text-primary hover:border-accent/40 hover:text-primary",
        variant === "ghost" &&
          "border-transparent bg-transparent text-secondary hover:text-primary",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
