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
        "inline-flex items-center justify-center rounded-2xl border px-4 py-3 text-sm font-medium transition duration-200 focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" &&
          "border-white bg-white text-black hover:-translate-y-0.5 hover:bg-white/90",
        variant === "secondary" &&
          "border-border bg-card text-primary hover:border-white/20 hover:bg-white/[0.03]",
        variant === "ghost" &&
          "border-transparent bg-transparent text-secondary hover:bg-white/[0.03] hover:text-primary",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
