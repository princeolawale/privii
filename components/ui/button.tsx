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
          "border-accent/30 bg-[linear-gradient(180deg,rgba(16,16,18,0.98)_0%,rgba(10,10,10,0.98)_100%)] text-primary shadow-[0_0_0_1px_rgba(139,92,255,0.08),0_16px_40px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.05)] hover:-translate-y-0.5 hover:border-accent/45 hover:shadow-[0_0_0_1px_rgba(139,92,255,0.16),0_20px_48px_rgba(0,0,0,0.44),0_0_28px_rgba(91,45,255,0.14)]",
        variant === "secondary" &&
          "border-border bg-card text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] hover:border-accent/30 hover:bg-accent/8 hover:text-white",
        variant === "ghost" &&
          "min-h-0 border-transparent bg-transparent px-4 py-2 text-sm text-secondary hover:bg-accent/8 hover:text-primary",
        className
      )}
      {...props}
    >
      <span className="pointer-events-none relative z-10 inline-flex items-center">
        {children}
      </span>
    </button>
  );
}
