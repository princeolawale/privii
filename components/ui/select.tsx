import type { SelectHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Select({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm text-primary transition duration-200 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:opacity-60",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}
