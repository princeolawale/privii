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
        "inline-flex min-h-14 items-center justify-center rounded-2xl border px-5 text-base font-medium transition duration-200 focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" &&
          "border-white bg-white text-black shadow-[0_10px_30px_rgba(255,255,255,0.06)] hover:-translate-y-0.5 hover:bg-white/90",
        variant === "secondary" &&
          "border-border bg-white/[0.04] text-primary hover:border-white/20 hover:bg-white/[0.07]",
        variant === "ghost" &&
          "min-h-0 border-transparent bg-transparent px-4 py-2 text-sm text-secondary hover:bg-white/[0.03] hover:text-primary",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
