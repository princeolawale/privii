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
          "border-accent/25 bg-[linear-gradient(135deg,#8B5CFF_0%,#5B2DFF_55%,#7043FF_100%)] text-white shadow-[0_18px_44px_rgba(91,45,255,0.28)] hover:-translate-y-0.5 hover:shadow-[0_22px_52px_rgba(91,45,255,0.34)]",
        variant === "secondary" &&
          "border-white/[0.06] bg-white/[0.03] text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.025)] hover:border-accent/25 hover:bg-white/[0.045]",
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
