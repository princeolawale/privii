import type { InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm text-primary transition duration-200 placeholder:text-secondary/70 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:opacity-60",
        className
      )}
      {...props}
    />
  );
}
