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
        "rounded-[28px] border border-border bg-card/95 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.45)] transition duration-200",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
