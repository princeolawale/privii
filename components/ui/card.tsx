import type { HTMLAttributes, PropsWithChildren } from "react";

import { cn } from "@/lib/utils";

export function Card({
  children,
  className,
  ...props
}: PropsWithChildren<HTMLAttributes<HTMLDivElement>>) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-border bg-card/95 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.45)]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
